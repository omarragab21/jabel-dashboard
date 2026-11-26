<script setup>
// The bar that appears under a table once rows are ticked: how many are selected, the module's own bulk actions
// (delete, activate, ...), plus copy and CSV export of the selected rows exactly as the table shows them.
// Every action runs through runInBatches: a few requests at a time, one refresh at the end, and a summary of what failed.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import { useDialog } from '../composables/useDialog';
import { failureReason, runInBatches, toCsv, toTsv } from '../domain/bulkSelection';

const props = defineProps({
  bulk: { type: Object, required: true },
  // [{ key, label, icon, tone, confirm(rows) -> text, applies(row) -> bool, each(row) -> Promise | all(rows, inputs) -> Promise (one request for every row) | prepare(rows) -> inputs|null (ask first; null cancels), done(), success(n) -> text }]
  actions: { type: Array, default: () => [] },
  fileName: { type: String, default: 'export' },
  labelOf: { type: Function, default: (row) => row?.name_i18n?.ar || row?.name_ar || row?.name || row?.title || row?.code || (row?.id !== undefined ? `#${row.id}` : '') },
});

const { tx } = useAdminText();
const dialog = useDialog();
const running = ref(null); // { key, done, total }
const toast = ref('');
let toastTimer = null;

const visible = computed(() => props.bulk.count > 0 || running.value);

const flash = (text) => {
  toast.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 2600);
};

const run = async (action) => {
  if (running.value) return;
  const picked = props.bulk.selectedRows.filter(Boolean);
  const applicable = action.applies ? picked.filter(action.applies) : picked;
  const rows = action.order ? action.order(applicable) : applicable;
  if (!rows.length) {
    flash(action.nothing || tx('كل العناصر المحددة على هذه الحالة بالفعل', 'All selected items are already in that state'));
    return;
  }
  let inputs;
  if (action.prepare) {
    inputs = await action.prepare(rows);
    if (inputs === null || inputs === undefined) return;
  }
  if (action.confirm) {
    const ok = await dialog.confirm(action.confirm(rows), {
      type: action.tone === 'danger' ? 'error' : 'warning',
      title: action.label,
      confirmText: action.label,
      cancelText: tx('إلغاء', 'Cancel'),
    });
    if (!ok) return;
  }
  running.value = { key: action.key, done: 0, total: rows.length };
  let done;
  let failed;
  if (action.all) {
    // One request for the whole selection: it either works for every row or fails for every row.
    try {
      await action.all(rows, inputs);
      done = rows;
      failed = [];
    } catch (error) {
      done = [];
      failed = rows.map((item) => ({ item, error }));
    }
  } else {
    ({ done, failed } = await runInBatches(rows, action.each, {
      concurrency: action.concurrency || 4,
      onProgress: (count) => { if (running.value) running.value.done = count; },
    }));
  }
  // Rows that worked leave the selection; failed ones stay ticked so the admin sees which.
  props.bulk.deselect(done.map((row) => row.id));
  try { if (done.length && action.done) await action.done(done); } catch { /* the list refresh failing must not hide the summary */ }
  running.value = null;
  if (failed.length) {
    const lines = failed.slice(0, 5).map(({ item, error }) => `• ${props.labelOf(item)}${failureReason(error) ? ` — ${failureReason(error)}` : ''}`);
    if (failed.length > 5) lines.push(tx(`… و${failed.length - 5} غيرها`, `… and ${failed.length - 5} more`));
    await dialog.alert(lines.join('\n'), {
      type: 'error',
      title: done.length
        ? tx(`تم تنفيذ ${done.length} وفشل ${failed.length}`, `${done.length} done, ${failed.length} failed`)
        : tx(`فشل التنفيذ على ${failed.length}`, `Failed for ${failed.length}`),
    });
  } else {
    flash(action.success ? action.success(done.length) : tx(`تم التنفيذ على ${done.length}`, `Done for ${done.length}`));
  }
};

// ---- Copy / export: read the table as it is drawn (respects hidden columns and the current language).
const SKIP_HEADERS = new Set(['الإجراءات', 'إجراءات', 'Actions', 'Action']);
const tableRows = () => {
  const table = document.querySelector(`[data-bulk-table="${props.bulk.tableId}"]`);
  if (!table) return [];
  const headers = [...table.querySelectorAll(':scope > thead > tr:first-child > th')];
  const columns = headers
    .map((th, index) => ({ index, label: th.textContent.replace(/\s+/g, ' ').trim(), th }))
    .filter(({ th, label }) => label && !th.classList.contains('bulk-col') && !SKIP_HEADERS.has(label) && getComputedStyle(th).display !== 'none');
  const out = [columns.map((column) => column.label)];
  for (const id of props.bulk.selectedIds) {
    const tr = table.querySelector(`:scope > tbody > tr[data-bulk-id="${CSS.escape(String(id))}"]`);
    if (!tr) continue;
    out.push(columns.map(({ index }) => tr.children[index]?.innerText ?? ''));
  }
  return out;
};

const copyRows = async () => {
  const text = toTsv(tableRows());
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  flash(tx(`تم نسخ ${props.bulk.count} صف — الصقه في Excel مباشرة`, `Copied ${props.bulk.count} rows — paste into Excel`));
};

const exportRows = () => {
  const blob = new Blob([toCsv(tableRows())], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash(tx(`تم تصدير ${props.bulk.count} صف`, `Exported ${props.bulk.count} rows`));
};

const onKey = (event) => {
  if (event.key !== 'Escape' || !props.bulk.count || running.value) return;
  if (document.querySelector('.modal-overlay, .app-dialog-backdrop, [role="dialog"]')) return;
  props.bulk.clear();
};
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); clearTimeout(toastTimer); });

const ICONS = {
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
};
</script>

<template>
  <Transition name="bulk-bar">
    <div v-if="visible" class="bulk-bar" role="toolbar" :aria-label="tx('إجراءات على العناصر المحددة', 'Actions on selected items')" data-testid="bulk-bar">
      <div class="bulk-count">
        <span class="bulk-count-num" data-testid="bulk-count">{{ bulk.count }}</span>
        <span>{{ tx('محدد', 'selected') }}</span>
        <button type="button" class="bulk-clear" :disabled="!!running" :title="tx('إلغاء التحديد (Esc)', 'Clear selection (Esc)')" data-testid="bulk-clear" @click="bulk.clear()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div v-if="running" class="bulk-progress" data-testid="bulk-progress">
        <span class="bulk-spinner" aria-hidden="true"></span>
        <span>{{ tx('جاري التنفيذ', 'Working') }} {{ running.done }}/{{ running.total }}</span>
        <span class="bulk-progress-track"><span class="bulk-progress-fill" :style="{ width: `${(running.done / running.total) * 100}%` }"></span></span>
      </div>

      <div v-else class="bulk-actions">
        <button
          v-for="action in actions" :key="action.key" type="button" class="bulk-btn" :class="action.tone && `is-${action.tone}`"
          :data-testid="`bulk-${action.key}`" @click="run(action)"
        >
          <svg v-if="ICONS[action.icon]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS[action.icon]"></svg>
          <span>{{ action.label }}</span>
        </button>
        <span v-if="actions.length" class="bulk-sep" aria-hidden="true"></span>
        <button type="button" class="bulk-btn" data-testid="bulk-copy" :title="tx('نسخ الصفوف المحددة للصقها في Excel', 'Copy the selected rows to paste into Excel')" @click="copyRows">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS.copy"></svg>
          <span>{{ tx('نسخ', 'Copy') }}</span>
        </button>
        <button type="button" class="bulk-btn" data-testid="bulk-export" @click="exportRows">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="ICONS.download"></svg>
          <span>{{ tx('تصدير CSV', 'Export CSV') }}</span>
        </button>
      </div>

      <Transition name="bulk-toast">
        <div v-if="toast" class="bulk-toast" role="status" data-testid="bulk-toast">{{ toast }}</div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.bulk-bar {
  position: sticky;
  bottom: 16px;
  z-index: 40;
  align-self: center;
  margin: 0.25rem auto 0;
  width: fit-content;
  max-width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem 0.9rem;
  padding: 0.55rem 0.7rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.16), 0 2px 6px rgba(17, 24, 39, 0.06);
  font-family: inherit;
}
.bulk-count { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; font-weight: 700; color: #374151; padding-inline-end: 0.8rem; border-inline-end: 1px solid #f1f5f9; }
.bulk-count-num { min-width: 26px; height: 26px; padding: 0 0.45rem; border-radius: 999px; background: #660033; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; font-variant-numeric: tabular-nums; }
.bulk-clear { width: 26px; height: 26px; border-radius: 8px; border: none; background: #f8fafc; color: #64748b; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s, color 0.15s; }
.bulk-clear:hover { background: #fef2f2; color: #dc2626; }
.bulk-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; }
.bulk-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; color: #374151; font-family: inherit; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; white-space: nowrap; }
.bulk-btn:hover { background: #fdf4f8; border-color: #d9a6bd; color: #660033; }
.bulk-btn.is-danger { color: #dc2626; border-color: #fecaca; }
.bulk-btn.is-danger:hover { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
.bulk-btn.is-primary { background: #660033; border-color: #660033; color: #fff; }
.bulk-btn.is-primary:hover { background: #4d0026; color: #fff; }
.bulk-btn:focus-visible, .bulk-clear:focus-visible { outline: 2px solid #660033; outline-offset: 2px; }
.bulk-sep { width: 1px; height: 22px; background: #e5e7eb; margin: 0 0.15rem; }
.bulk-progress { display: inline-flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; font-weight: 700; color: #660033; min-width: 240px; }
.bulk-progress-track { flex: 1; height: 6px; border-radius: 999px; background: #f3e8ee; overflow: hidden; min-width: 90px; }
.bulk-progress-fill { display: block; height: 100%; background: #660033; border-radius: inherit; transition: width 0.2s ease; }
.bulk-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #f3e8ee; border-top-color: #660033; animation: bulk-spin 0.7s linear infinite; }
@keyframes bulk-spin { to { transform: rotate(360deg); } }
.bulk-toast { position: absolute; bottom: calc(100% + 8px); inset-inline-start: 50%; transform: translateX(-50%); background: #111827; color: #fff; padding: 0.45rem 0.85rem; border-radius: 9px; font-size: 0.78rem; font-weight: 600; white-space: nowrap; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18); }
[dir="rtl"] .bulk-toast { transform: translateX(50%); }

.bulk-bar-enter-active, .bulk-bar-leave-active { transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
.bulk-bar-enter-from, .bulk-bar-leave-to { opacity: 0; transform: translateY(14px) scale(0.98); }
.bulk-toast-enter-active, .bulk-toast-leave-active { transition: opacity 0.18s ease; }
.bulk-toast-enter-from, .bulk-toast-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .bulk-bar { width: 100%; justify-content: center; }
  .bulk-count { border-inline-end: none; padding-inline-end: 0; }
  .bulk-btn span { display: none; }
  .bulk-btn { padding: 0.55rem; }
}
@media (prefers-reduced-motion: reduce) {
  .bulk-bar-enter-active, .bulk-bar-leave-active, .bulk-progress-fill { transition: none; }
  .bulk-spinner { animation-duration: 2s; }
}
</style>
