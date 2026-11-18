// "Columns" menu for every data table in the dashboard.
//
// Any table matching TABLE_SELECTOR gets a small "Columns" button above it. The menu lists the
// table's column headers with a checkbox each, so the admin picks which columns show. The choice
// is remembered per table in localStorage. Columns without a header text (checkbox/select-all) and
// the actions column are always shown, so a row can never lose its buttons.
//
// Hiding is done with generated CSS (nth-child rules), so it keeps working while Vue re-renders
// the rows. Rows made of a single colspan cell (empty / loading states) are never hidden.

import { attachRowSelection } from './rowSelection';

const TABLE_SELECTOR = 'table.data-table, table.returns-table';
const STORAGE_PREFIX = 'jb:cols:';
const STYLE_ID = 'jb-column-toggle-style';
const ALWAYS_VISIBLE = /(^|\s)col-actions(\s|$)/;

const TEXT = {
  ar: { columns: 'الأعمدة', showAll: 'إظهار الكل', hint: 'اختر الأعمدة اللي تظهر في الجدول', hidden: (n) => `${n} مخفي` },
  en: { columns: 'Columns', showAll: 'Show all', hint: 'Choose which columns the table shows', hidden: (n) => `${n} hidden` },
};
const text = () => TEXT[document.documentElement.lang === 'en' ? 'en' : 'ar'];

const CSS = `
.ct-bar { display: flex; justify-content: flex-end; margin: 0 0 0.5rem; position: relative; }
.ct-btn {
  display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer;
  padding: 0.4rem 0.8rem; border-radius: 10px; font: inherit; font-size: 0.82rem; font-weight: 700;
  color: var(--text-main, #2e2b3a); background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e2e0e7);
}
.ct-btn:hover, .ct-btn[aria-expanded="true"] { border-color: var(--primary, #660033); color: var(--primary, #660033); }
.ct-badge { background: var(--primary, #660033); color: #fff; border-radius: 999px; padding: 0 0.45rem; font-size: 0.7rem; line-height: 1.35rem; }
.ct-panel {
  position: fixed; z-index: 1000; min-width: 230px; max-width: 320px; max-height: 340px; overflow: auto;
  background: var(--bg-card, #fff); color: var(--text-main, #2e2b3a); border: 1px solid var(--border-color, #e2e0e7);
  border-radius: 12px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16); padding: 0.6rem;
}
.ct-panel[hidden] { display: none; }
.ct-hint { margin: 0 0.3rem 0.5rem; font-size: 0.75rem; color: var(--text-muted, #787586); }
.ct-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.42rem 0.5rem; border-radius: 8px; cursor: pointer; font-size: 0.86rem; font-weight: 600; }
.ct-item:hover { background: var(--table-hover, #f9fafb); }
.ct-item input { width: 16px; height: 16px; accent-color: var(--primary, #660033); cursor: pointer; flex: none; }
.ct-reset { margin-top: 0.4rem; width: 100%; padding: 0.4rem; border: none; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 700; color: var(--primary, #660033); background: transparent; }
.ct-reset:hover { background: var(--table-hover, #f9fafb); }
`;

const tables = new Map(); // table element -> { id, bar, style, hidden:Set<number> }

const pageKey = () => {
  const path = window.location.pathname.replace(/\/\d+(?=\/|$)/g, '/:id');
  return path || '/';
};

const headerCells = (table) => Array.from(table.querySelectorAll(':scope > thead > tr:first-child > th'));
const isFixed = (th) => !th.textContent.trim() || ALWAYS_VISIBLE.test(th.className);

const load = (id) => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_PREFIX + id) || '[]')); } catch { return new Set(); }
};
const save = (id, set) => {
  try {
    if (set.size) localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify([...set]));
    else localStorage.removeItem(STORAGE_PREFIX + id);
  } catch { /* storage unavailable: the choice still applies until reload */ }
};

const applyRules = (table, entry) => {
  const attr = `[data-ct-id="${entry.id}"]`;
  const cells = headerCells(table);
  const rules = [...entry.hidden]
    .filter((index) => index < cells.length && !isFixed(cells[index]))
    .map((index) => {
      const n = index + 1;
      return `table${attr} > thead > tr > :nth-child(${n}), table${attr} > tfoot > tr > :nth-child(${n}), table${attr} > tbody > tr > :nth-child(${n}):not([colspan]) { display: none !important; }`;
    });
  entry.style.textContent = rules.join('\n');
};

const refreshBar = (table, entry) => {
  const t = text();
  const count = [...entry.hidden].filter((index) => index < headerCells(table).length).length;
  const key = `${document.documentElement.lang}|${count}`;
  if (entry.key === key) return; // unchanged: don't touch the DOM (it would re-trigger the observer)
  entry.key = key;
  entry.button.innerHTML = '';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '▥';
  const label = document.createElement('span');
  label.textContent = t.columns;
  entry.button.append(icon, label);
  if (count) {
    const badge = document.createElement('span');
    badge.className = 'ct-badge';
    badge.textContent = t.hidden(count);
    entry.button.append(badge);
  }
};

const renderPanel = (table, entry) => {
  const t = text();
  const panel = entry.panel;
  panel.innerHTML = '';
  const hint = document.createElement('p');
  hint.className = 'ct-hint';
  hint.textContent = t.hint;
  panel.append(hint);
  headerCells(table).forEach((th, index) => {
    if (isFixed(th)) return;
    const row = document.createElement('label');
    row.className = 'ct-item';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !entry.hidden.has(index);
    box.addEventListener('change', () => {
      if (box.checked) entry.hidden.delete(index);
      else entry.hidden.add(index);
      save(entry.id, entry.hidden);
      applyRules(table, entry);
      refreshBar(table, entry);
    });
    const name = document.createElement('span');
    name.textContent = th.textContent.trim();
    row.append(box, name);
    panel.append(row);
  });
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'ct-reset';
  reset.textContent = t.showAll;
  reset.addEventListener('click', () => {
    entry.hidden.clear();
    save(entry.id, entry.hidden);
    applyRules(table, entry);
    refreshBar(table, entry);
    renderPanel(table, entry);
  });
  panel.append(reset);
};

const closeAll = (except) => {
  tables.forEach((entry) => {
    if (entry.panel !== except && !entry.panel.hidden) {
      entry.panel.hidden = true;
      entry.button.setAttribute('aria-expanded', 'false');
    }
  });
};

const enhance = (table, index) => {
  const cells = headerCells(table);
  if (cells.length < 2) return;
  const id = `${pageKey()}|${index}|${cells.length}`;

  const style = document.createElement('style');
  const bar = document.createElement('div');
  bar.className = 'ct-bar';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ct-btn';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('div');
  panel.className = 'ct-panel';
  panel.hidden = true;
  bar.append(button, panel);

  const entry = { id, bar, style, button, panel, hidden: load(id) };
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const opening = panel.hidden;
    closeAll(panel);
    if (opening) {
      renderPanel(table, entry);
      panel.hidden = false;
      // Fixed popup so no overflow:hidden container can clip it; its edge lines up with the button.
      const rect = button.getBoundingClientRect();
      const width = panel.offsetWidth;
      const left = document.documentElement.dir === 'rtl' ? rect.left : rect.right - width;
      panel.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - 120)}px`;
      panel.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
      panel.style.maxHeight = `${Math.max(160, window.innerHeight - rect.bottom - 24)}px`;
    }
    panel.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
  });
  panel.addEventListener('click', (event) => event.stopPropagation());

  const holder = table.closest('.table-container, .table-wrap, .table-card') || table;
  holder.parentNode.insertBefore(bar, holder);
  // Tables with row actions also get row checkboxes + a bulk-actions bar (design only).
  const hasActions = cells.some((th) => ALWAYS_VISIBLE.test(th.className) || /إجراءات|actions?/i.test(th.textContent.trim()));
  if (hasActions && holder !== table) entry.selection = attachRowSelection(table, holder, bar);
  document.head.append(style);
  table.dataset.ctId = id;
  tables.set(table, entry);
  applyRules(table, entry);
  refreshBar(table, entry);
};

const scan = () => {
  // Forget tables that left the page (route change, tab switch) together with their menu.
  tables.forEach((entry, table) => {
    if (!table.isConnected) {
      entry.selection?.destroy();
      entry.bar.remove();
      entry.style.remove();
      tables.delete(table);
    }
  });
  Array.from(document.querySelectorAll(TABLE_SELECTOR)).forEach((table, index) => {
    if (table.closest('.modal-content, .modal-overlay, .sr-only')) return; // tables inside dialogs keep all columns
    const known = tables.get(table);
    if (!known) enhance(table, index);
    else { refreshBar(table, known); known.selection?.layout(); }
  });
};

export const initColumnToggle = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  };
  new MutationObserver((records) => {
    if (records.every((record) => record.target.closest?.('.ct-bar, .ct-rail'))) return; // our own menu changes
    schedule();
  }).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  document.addEventListener('click', () => closeAll(null));
  window.addEventListener('resize', () => closeAll(null));
  window.addEventListener('scroll', () => closeAll(null), true);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAll(null); });
  schedule();
};
