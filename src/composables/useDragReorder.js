import { computed, ref } from 'vue';
import { moveItem } from '../domain/reorder';

/**
 * Drag-and-drop reordering of table rows (same behaviour as the homepage banners): grab a row by its handle and drop
 * it above or below another row of the same group; the new order is handed to `onReorder` to be saved.
 *
 *   const drag = useDragReorder({
 *     canDrag,                       // computed: false while a search / filter hides part of the list
 *     groupOf: (item) => item.parent_id || 0,   // optional: rows only move inside their own group
 *     siblings: (item) => [...],     // the FULL ordered list of the group the row belongs to
 *     onReorder: async (newList, moved) => { ... save ... },
 *   });
 *
 *   <tr v-bind="drag.rowBindings(item)"> ... <DragHandle :enabled="drag.enabled.value" v-bind="drag.handleBindings(item)" />
 */
export function useDragReorder({ canDrag, siblings, onReorder, groupOf = () => 'all' }) {
  const isReordering = ref(false);
  const armedId = ref(null); // row whose handle is pressed (only that row is draggable)
  const dragging = ref(null); // the row being dragged
  const dropTarget = ref(null); // { id, after }: where it would land

  const enabled = computed(() => Boolean(canDrag.value) && !isReordering.value);

  const reset = () => { armedId.value = null; dragging.value = null; dropTarget.value = null; };
  const arm = (item) => { if (enabled.value) armedId.value = item.id; };
  const disarm = () => { armedId.value = null; };

  const onDragStart = (item, event) => {
    if (armedId.value !== item.id) { event.preventDefault(); return; }
    dragging.value = item;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(item.id));
  };

  const onDragOver = (item, event) => {
    const moved = dragging.value;
    if (!moved || groupOf(item) !== groupOf(moved)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    dropTarget.value = { id: item.id, after: event.clientY > rect.top + rect.height / 2 };
  };

  const onDrop = async (event) => {
    event.preventDefault();
    const moved = dragging.value;
    const target = dropTarget.value;
    reset();
    if (!moved || !target || String(target.id) === String(moved.id)) return;
    const list = moveItem(siblings(moved), moved.id, target.id, target.after);
    isReordering.value = true;
    try {
      await onReorder(list, moved);
    } finally {
      isReordering.value = false;
    }
  };

  const rowClass = (item) => ({
    'is-dragging': dragging.value !== null && String(dragging.value.id) === String(item.id),
    'drop-before': dropTarget.value !== null && String(dropTarget.value.id) === String(item.id) && !dropTarget.value.after && String(dragging.value?.id) !== String(item.id),
    'drop-after': dropTarget.value !== null && String(dropTarget.value.id) === String(item.id) && dropTarget.value.after && String(dragging.value?.id) !== String(item.id),
  });

  /** Spread on the <tr> with v-bind. */
  const rowBindings = (item) => ({
    class: rowClass(item),
    draggable: armedId.value === item.id,
    onDragstart: (event) => onDragStart(item, event),
    onDragover: (event) => onDragOver(item, event),
    onDrop,
    onDragend: reset,
  });

  /** Spread on the handle with v-bind. */
  const handleBindings = (item) => ({ onMousedown: () => arm(item), onMouseup: disarm });

  return { enabled, isReordering, armedId, dragging, dropTarget, rowBindings, handleBindings, rowClass, reset };
}
