<template>
  <button type="button" class="crop-trigger" :class="{ compact }" :title="tx('قص وتعديل حجم الصورة', 'Crop and resize the image')" @click.stop.prevent="$emit('crop')">
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
    <span v-if="!compact">{{ tx('قص وضبط الحجم', 'Crop & resize') }}</span>
  </button>
</template>

<script setup>
import { useAdminText } from '../composables/useAdminText';

// compact: icon only, for small thumbnails.
defineProps({ compact: { type: Boolean, default: false } });
defineEmits(['crop']);

const { tx } = useAdminText();
</script>

<style scoped>
.crop-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border: 1px solid #fde68a;
  border-radius: 0.75rem;
  background: #fffbeb;
  color: #92400e;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.crop-trigger svg { color: #d97706; flex-shrink: 0; }
.crop-trigger:hover { background: #fef3c7; }
.crop-trigger.compact { padding: 0; width: 22px; height: 22px; justify-content: center; border-radius: 50%; }
.crop-trigger.compact svg { width: 12px; height: 12px; }
</style>
