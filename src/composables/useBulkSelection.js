import { computed, reactive, watch } from 'vue';
import { headerState, rangeIds } from '../domain/bulkSelection';

let tableSeq = 0;

/**
 * Checkbox selection for one table.
 *
 *   const bulk = useBulkSelection(() => filteredRows.value);
 *
 * Only rows on screen can be selected: when a filter, search or page change hides a row it leaves the selection, so a
 * bulk delete never touches something the admin cannot see. Shift + click selects every row between two clicks.
 * The returned object is reactive, so templates read `bulk.count`, `bulk.isSelected(id)` directly.
 */
export const useBulkSelection = (rowsSource, { idOf = (row) => row?.id } = {}) => {
  const selected = reactive(new Set());
  const rows = computed(() => (typeof rowsSource === 'function' ? rowsSource() : rowsSource?.value) || []);
  const ids = computed(() => rows.value.map(idOf).filter((id) => id !== undefined && id !== null));
  const byId = computed(() => new Map(rows.value.map((row) => [idOf(row), row])));
  let anchor = null;

  // Drop rows that are no longer on screen.
  watch(ids, (shown) => {
    if (!selected.size) return;
    const keep = new Set(shown);
    for (const id of [...selected]) if (!keep.has(id)) selected.delete(id);
  });

  const state = computed(() => headerState(ids.value, selected));

  const toggle = (id, event) => {
    const turnOn = !selected.has(id);
    if (event?.shiftKey && anchor !== null && anchor !== id) {
      for (const each of rangeIds(ids.value, anchor, id)) {
        if (turnOn) selected.add(each); else selected.delete(each);
      }
    } else if (turnOn) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
    anchor = id;
  };

  const toggleAll = () => {
    if (state.value === 'all') {
      selected.clear();
    } else {
      for (const id of ids.value) selected.add(id);
    }
    anchor = null;
  };

  const clear = () => { selected.clear(); anchor = null; };
  const deselect = (list = []) => { for (const id of list) selected.delete(id); };

  const tableId = `bulk-${(tableSeq += 1)}`;

  return reactive({
    tableId,
    tableAttrs: { 'data-bulk-table': tableId },
    count: computed(() => selected.size),
    allSelected: computed(() => state.value === 'all'),
    someSelected: computed(() => state.value === 'some'),
    selectedIds: computed(() => ids.value.filter((id) => selected.has(id))),
    selectedRows: computed(() => ids.value.filter((id) => selected.has(id)).map((id) => byId.value.get(id))),
    isSelected: (id) => selected.has(id),
    toggle,
    toggleAll,
    clear,
    deselect,
  });
};
