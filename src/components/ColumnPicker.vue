<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import { columnRules, loadHiddenColumns, saveHiddenColumns, toggleColumn, visibleLabeledCount } from '../domain/columns';

// "الأعمدة": a checkbox per column of a table. Unticking one hides that column (header and cells) at once; the choice
// is remembered per table. The table to control is the one marked data-col-key="<tableKey>", so a view only needs
// that attribute on its <table> and this button next to it. Works by CSS, so rows that render later are covered too.
const props = defineProps({ tableKey: { type: String, required: true } });
const { tx } = useAdminText();

const open = ref(false);
const root = ref(null);
const headers = ref([]); // [{ index, label }] of every <th> of the table (label '' for icon-only columns)
const hidden = ref([]);
let styleEl = null;
let retryTimer = null;

const findTable = () => document.querySelector(`table[data-col-key="${props.tableKey}"]`);
const readHeaders = () => {
  const table = findTable();
  if (!table) return [];
  return [...table.querySelectorAll(':scope > thead > tr:first-child > th')]
    .map((th, index) => ({ index, label: th.textContent.replace(/\s+/g, ' ').trim() }));
};

// Only columns with a title can be switched; icon-only ones (drag handle, select box) always stay.
const labeled = computed(() => headers.value.filter((header) => header.label));
const columns = computed(() => labeled.value.map((header) => ({ ...header, shown: !hidden.value.includes(header.index) })));
const shownCount = computed(() => visibleLabeledCount(headers.value, hidden.value));
const hiddenCount = computed(() => labeled.value.length - shownCount.value);

const apply = () => {
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-column-picker', props.tableKey);
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = columnRules(props.tableKey, hidden.value);
};

const refresh = () => {
  headers.value = readHeaders();
  return headers.value.length > 0;
};

const setup = (tries = 0) => {
  if (refresh()) {
    hidden.value = loadHiddenColumns(props.tableKey, headers.value.length);
    apply();
    return;
  }
  // The table is drawn after the data arrives in some pages: look again for a moment.
  if (tries < 15) retryTimer = setTimeout(() => setup(tries + 1), 200);
};

const onToggle = (index, event) => {
  // Keep at least one titled column on screen.
  if (!event.target.checked && shownCount.value <= 1) { event.target.checked = true; return; }
  hidden.value = toggleColumn(hidden.value, index, event.target.checked);
  saveHiddenColumns(props.tableKey, hidden.value, headers.value.length);
  apply();
};

const showAll = () => {
  hidden.value = [];
  saveHiddenColumns(props.tableKey, [], headers.value.length);
  apply();
};

const toggleOpen = () => {
  open.value = !open.value;
  if (open.value) refresh(); // titles may have changed with the language
};
const onOutside = (event) => { if (open.value && root.value && !root.value.contains(event.target)) open.value = false; };
const onKey = (event) => { if (event.key === 'Escape') open.value = false; };

onMounted(() => {
  setup();
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  clearTimeout(retryTimer);
  document.removeEventListener('pointerdown', onOutside);
  document.removeEventListener('keydown', onKey);
  if (styleEl) styleEl.remove();
});
</script>

<template>
  <div v-if="labeled.length > 1" ref="root" class="col-picker" :data-testid="`columns-${tableKey}`">
    <button type="button" class="col-btn" :class="{ filtered: hiddenCount > 0 }" :aria-expanded="open" aria-haspopup="true" data-testid="columns-button" @click="toggleOpen">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/></svg>
      <span>{{ tx('الأعمدة', 'Columns') }}</span>
      <span v-if="hiddenCount > 0" class="col-count" data-testid="columns-count">{{ shownCount }}/{{ labeled.length }}</span>
    </button>

    <div v-if="open" class="col-panel" role="group" :aria-label="tx('الأعمدة المعروضة في الجدول', 'Columns shown in the table')" data-testid="columns-panel">
      <label v-for="column in columns" :key="column.index" class="col-item">
        <input type="checkbox" :checked="column.shown" :data-testid="`column-${column.index}`" @change="onToggle(column.index, $event)" />
        <span>{{ column.label }}</span>
      </label>
      <button v-if="hiddenCount > 0" type="button" class="col-reset" data-testid="columns-show-all" @click="showAll">{{ tx('إظهار الكل', 'Show all') }}</button>
    </div>
  </div>
</template>

<style scoped>
.col-picker { position: relative; display: inline-block; }
.col-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.5rem 0.85rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #374151; font-family: inherit; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.15s; }
.col-btn:hover { background: #f9fafb; }
.col-btn.filtered { border-color: #d9a6bd; color: #660033; background: #fdf4f8; }
.col-count { padding: 0.05rem 0.45rem; border-radius: 999px; background: #660033; color: #fff; font-size: 0.68rem; font-weight: 800; }
.col-panel { position: absolute; z-index: 60; inset-inline-end: 0; top: calc(100% + 6px); min-width: 210px; max-height: 340px; overflow-y: auto; padding: 0.4rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14); display: flex; flex-direction: column; }
.col-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.65rem; border-radius: 6px; font-size: 0.83rem; font-weight: 600; color: #1f2937; cursor: pointer; white-space: nowrap; }
.col-item:hover { background: #f3f4f6; }
.col-item input { width: 16px; height: 16px; accent-color: #660033; margin: 0; cursor: pointer; flex-shrink: 0; }
.col-reset { margin-top: 0.25rem; padding: 0.5rem 0.65rem; border: none; border-top: 1px solid #f3f4f6; background: none; color: #660033; font-family: inherit; font-weight: 700; font-size: 0.78rem; cursor: pointer; text-align: start; }
</style>
