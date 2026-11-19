<script setup>
import { useAdminText } from '../composables/useAdminText';

// The grip of a draggable table row (same one as the homepage banners). Pressing it arms its row for dragging; the
// parent passes the mousedown / mouseup listeners with v-bind="drag.handleBindings(item)".
defineProps({
  enabled: { type: Boolean, default: true },
  // Why dragging is off, shown as the tooltip while it is.
  disabledHint: { type: String, default: '' },
});
const { tx } = useAdminText();
</script>

<template>
  <span
    class="drag-handle"
    :class="{ disabled: !enabled }"
    :title="enabled ? tx('اسحب لتغيير الترتيب', 'Drag to reorder') : (disabledHint || tx('امسح البحث والفلاتر لتغيير الترتيب', 'Clear the search and filters to reorder'))"
    data-testid="drag-handle"
  >
    <svg width="14" height="14" aria-hidden="true" viewBox="0 0 14 14"><circle cx="4.5" cy="3" r="1.4"/><circle cx="9.5" cy="3" r="1.4"/><circle cx="4.5" cy="7" r="1.4"/><circle cx="9.5" cy="7" r="1.4"/><circle cx="4.5" cy="11" r="1.4"/><circle cx="9.5" cy="11" r="1.4"/></svg>
  </span>
</template>

<style scoped>
.drag-handle { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 30px; border-radius: 6px; color: #9ca3af; cursor: grab; transition: all 0.15s; flex-shrink: 0; }
.drag-handle:hover { background: #f3f4f6; color: #660033; }
.drag-handle:active { cursor: grabbing; }
.drag-handle.disabled { cursor: not-allowed; opacity: 0.35; }
.drag-handle svg { fill: currentColor; }
</style>
