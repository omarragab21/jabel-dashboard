// Row selection (design only) for tables that have an actions column.
//
// A checkbox sits next to every row, plus a select-all checkbox in the header. Picking rows shows a
// bulk-actions bar above the table. The bulk buttons are a visual design only: they do nothing yet.
//
// The checkboxes live in a rail layered over the table container instead of inside the table cells,
// so Vue can keep re-rendering the rows without ever meeting a cell it didn't create.

const CSS = `
.ct-has-rail { position: relative; padding-inline-start: 46px !important; }
.ct-rail { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
.ct-cb {
  appearance: none; -webkit-appearance: none; position: absolute; inset-inline-start: 14px; margin: 0; pointer-events: auto;
  width: 18px; height: 18px; border-radius: 5px; cursor: pointer; background: var(--bg-card, #fff);
  border: 2px solid var(--input-border, #c4c1cc); transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
}
.ct-cb:hover { border-color: var(--primary, #660033); box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.12); }
.ct-cb:focus-visible { outline: 2px solid var(--primary, #660033); outline-offset: 2px; }
.ct-cb:checked, .ct-cb:indeterminate { background: var(--primary, #660033); border-color: var(--primary, #660033); }
.ct-cb:checked::after {
  content: ''; position: absolute; left: 4px; top: 0; width: 4px; height: 9px;
  border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg);
}
.ct-cb:indeterminate::after { content: ''; position: absolute; left: 3px; top: 6px; width: 8px; height: 2px; background: #fff; border-radius: 1px; }
.ct-hl { position: absolute; inset-inline-start: 0; pointer-events: none; background: rgba(102, 0, 51, 0.07); border-inline-start: 3px solid var(--primary, #660033); }
.ct-bulk { display: none; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-inline-end: auto; padding: 0.3rem 0.45rem; border-radius: 12px;
  background: rgba(102, 0, 51, 0.08); border: 1px solid rgba(102, 0, 51, 0.28); }
.ct-bulk.on { display: inline-flex; }
.ct-bulk-count { font-weight: 800; font-size: 0.85rem; color: var(--primary, #660033); padding: 0 0.45rem; }
.ct-bulk-btn {
  display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 700;
  padding: 0.35rem 0.75rem; border-radius: 9px; background: var(--bg-card, #fff); color: var(--text-main, #2e2b3a); border: 1px solid var(--border-color, #e2e0e7);
}
.ct-bulk-btn:hover { border-color: var(--primary, #660033); color: var(--primary, #660033); }
.ct-bulk-btn.danger { color: #dc2626; border-color: rgba(220, 38, 38, 0.35); }
.ct-bulk-btn.danger:hover { background: #dc2626; color: #fff; border-color: #dc2626; }
.ct-bulk-btn.ghost { background: transparent; border-color: transparent; color: var(--text-muted, #787586); }
`;

const TEXT = {
  ar: { selected: (n) => `تم تحديد ${n}`, export: 'تصدير', remove: 'حذف المحدد', clear: 'إلغاء التحديد', all: 'تحديد الكل', row: 'تحديد الصف' },
  en: { selected: (n) => `${n} selected`, export: 'Export', remove: 'Delete selected', clear: 'Clear', all: 'Select all', row: 'Select row' },
};
const text = () => TEXT[document.documentElement.lang === 'en' ? 'en' : 'ar'];

let cssAdded = false;
const addCss = () => {
  if (cssAdded) return;
  cssAdded = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
};

const BOX = 18;

export const attachRowSelection = (table, holder, bar) => {
  addCss();
  holder.classList.add('ct-has-rail');
  const rail = document.createElement('div');
  rail.className = 'ct-rail';
  holder.append(rail);

  const bulk = document.createElement('div');
  bulk.className = 'ct-bulk';
  bar.prepend(bulk);

  const headBox = document.createElement('input');
  headBox.type = 'checkbox';
  headBox.className = 'ct-cb';
  rail.append(headBox);

  const boxes = new Map(); // row element -> checkbox
  const marks = new Map(); // row element -> highlight
  const selected = new Set();
  let bulkKey = '';

  const dataRows = () => Array.from(table.querySelectorAll(':scope > tbody > tr'))
    .filter((row) => row.children.length > 1 && !row.querySelector(':scope > [colspan]'));

  const renderBulk = (count) => {
    const t = text();
    const key = `${document.documentElement.lang}|${count}`;
    bulk.classList.toggle('on', count > 0);
    if (key === bulkKey) return;
    bulkKey = key;
    bulk.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'ct-bulk-count';
    label.textContent = t.selected(count);
    // Design only: the two action buttons have no behaviour yet.
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'ct-bulk-btn';
    exportBtn.textContent = t.export;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ct-bulk-btn danger';
    removeBtn.textContent = t.remove;
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ct-bulk-btn ghost';
    clearBtn.textContent = `✕ ${t.clear}`;
    clearBtn.addEventListener('click', () => { selected.clear(); layout(); });
    bulk.append(label, exportBtn, removeBtn, clearBtn);
  };

  const layout = () => {
    const rows = dataRows();
    const hRect = holder.getBoundingClientRect();
    const place = (el, rect, height) => {
      el.style.top = `${rect.top - hRect.top + holder.scrollTop + (rect.height - height) / 2}px`;
    };

    // Drop boxes of rows that are gone (page changed, row deleted); keep the ones Vue kept.
    boxes.forEach((box, row) => {
      if (!rows.includes(row)) { box.remove(); boxes.delete(row); selected.delete(row); marks.get(row)?.remove(); marks.delete(row); }
    });

    rows.forEach((row) => {
      let box = boxes.get(row);
      if (!box) {
        box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'ct-cb';
        box.addEventListener('change', () => {
          if (box.checked) selected.add(row); else selected.delete(row);
          layout();
        });
        rail.append(box);
        boxes.set(row, box);
      }
      box.checked = selected.has(row);
      box.setAttribute('aria-label', text().row);
      const rect = row.getBoundingClientRect();
      place(box, rect, BOX);

      let mark = marks.get(row);
      if (selected.has(row)) {
        if (!mark) { mark = document.createElement('div'); mark.className = 'ct-hl'; rail.append(mark); marks.set(row, mark); }
        mark.style.top = `${rect.top - hRect.top + holder.scrollTop}px`;
        mark.style.height = `${rect.height}px`;
        mark.style.width = `${holder.scrollWidth}px`;
      } else if (mark) { mark.remove(); marks.delete(row); }
    });

    const headRow = table.querySelector(':scope > thead > tr');
    if (headRow) place(headBox, headRow.getBoundingClientRect(), BOX);
    headBox.setAttribute('aria-label', text().all);
    headBox.disabled = !rows.length;
    headBox.checked = rows.length > 0 && selected.size === rows.length;
    headBox.indeterminate = selected.size > 0 && selected.size < rows.length;
    renderBulk(selected.size);
  };

  headBox.addEventListener('change', () => {
    const rows = dataRows();
    if (headBox.checked) rows.forEach((row) => selected.add(row)); else selected.clear();
    layout();
  });

  const resizer = new ResizeObserver(() => layout());
  resizer.observe(table);
  resizer.observe(holder);

  return {
    layout,
    destroy: () => { resizer.disconnect(); rail.remove(); bulk.remove(); holder.classList.remove('ct-has-rail'); },
  };
};
