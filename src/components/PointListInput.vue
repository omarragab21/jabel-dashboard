<template>
  <div class="points-input" :dir="dir">
    <div class="points-add-row">
      <input
        ref="inputEl"
        v-model="draft"
        type="text"
        class="points-text"
        :placeholder="placeholder"
        :aria-label="label"
        @keydown.enter.prevent="addPoint"
      />
      <button type="button" class="points-add-btn" :disabled="!draft.trim()" @click.prevent="addPoint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {{ addLabel }}
      </button>
    </div>
    <ul v-if="points.length" class="points-list" data-testid="points-list">
      <li v-for="(point, index) in points" :key="index" class="point-row">
        <span class="point-dot" aria-hidden="true"></span>
        <input
          class="point-edit"
          type="text"
          :value="point"
          :aria-label="`${label} ${index + 1}`"
          @input="updatePoint(index, $event.target.value)"
          @keydown.enter.prevent="focusAdd"
        />
        <button type="button" class="point-remove" :title="removeLabel" :aria-label="removeLabel" @click.prevent="removePoint(index)">✕</button>
      </li>
    </ul>
    <p v-else class="points-empty">{{ emptyLabel }}</p>
    <p v-if="tip" class="points-tip">{{ tip }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  dir: { type: String, default: 'rtl' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  addLabel: { type: String, default: 'Add' },
  removeLabel: { type: String, default: 'Remove' },
  emptyLabel: { type: String, default: '' },
  tip: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const draft = ref('');
const inputEl = ref(null);

// The form stores one point per line, which is exactly what the API receives.
const points = computed(() => String(props.modelValue || '')
  .split(/\r?\n/)
  .map((line) => line.replace(/^[-•*❖]\s*/, '').trim())
  .filter(Boolean));

const commit = (list) => emit('update:modelValue', list.join('\n'));

const addPoint = () => {
  const text = draft.value.replace(/\s+/g, ' ').trim();
  if (!text) return;
  commit([...points.value, text]);
  draft.value = '';
};

const updatePoint = (index, value) => {
  // Keep an emptied row in place while typing; it is dropped when the value is re-read.
  const next = [...points.value];
  next[index] = value.replace(/[\r\n]+/g, ' ');
  emit('update:modelValue', next.join('\n'));
};

const removePoint = (index) => commit(points.value.filter((_, i) => i !== index));
const focusAdd = () => inputEl.value?.focus();
</script>

<style scoped>
.points-input {
  display: flex; flex-direction: column; gap: 0.85rem; padding: 1rem; background: #fff;
  border: 1px solid #e5e7eb; border-radius: 14px; font-family: 'IBM Plex Sans Arabic', sans-serif; box-sizing: border-box;
}
.points-add-row { display: flex; gap: 0.6rem; align-items: stretch; }
.points-text {
  flex: 1; min-width: 0; box-sizing: border-box; padding: 0.8rem 1rem; border: 1px solid #e5e7eb; border-radius: 10px;
  background: #f9fafb; font: 400 0.9rem 'IBM Plex Sans Arabic', sans-serif; color: #1f2937; outline: none; transition: 0.2s;
}
.points-text::placeholder { color: #9ca3af; }
.points-text:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(102, 0, 51, 0.08); }
.points-add-btn {
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0 1.1rem; border: none; border-radius: 10px;
  background: #660033; color: #fff; font: 700 0.85rem 'IBM Plex Sans Arabic', sans-serif; cursor: pointer; white-space: nowrap; transition: 0.2s;
}
.points-add-btn:hover:not(:disabled) { background: #4d0026; }
.points-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.points-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.point-row {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.3rem 0.5rem 0.3rem 0.9rem; background: #f9fafb;
  border: 1px solid #eef0f3; border-radius: 10px; transition: 0.15s;
}
.points-input[dir='rtl'] .point-row { padding: 0.3rem 0.9rem 0.3rem 0.5rem; }
.point-row:hover { border-color: #d9dce1; background: #fff; }
.point-row:focus-within { border-color: #660033; background: #fff; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.08); }
.point-dot { width: 8px; height: 8px; border-radius: 50%; background: #660033; flex-shrink: 0; }
.point-edit {
  flex: 1; min-width: 0; box-sizing: border-box; border: none; outline: none; background: transparent; padding: 0.65rem 0.25rem;
  font: 400 0.9rem 'IBM Plex Sans Arabic', sans-serif; color: #111827;
}
.point-remove {
  display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 50%;
  background: transparent; color: #9ca3af; cursor: pointer; font-size: 0.8rem; flex-shrink: 0; transition: 0.15s;
}
.point-remove:hover { color: #dc2626; background: #fef2f2; }
.points-empty {
  margin: 0; padding: 0.9rem; text-align: center; font-size: 0.82rem; color: #9ca3af; border: 1px dashed #e5e7eb; border-radius: 10px;
}
.points-tip { margin: 0; font-size: 0.75rem; color: #9ca3af; }
</style>
