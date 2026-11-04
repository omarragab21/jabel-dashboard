<template>
  <div v-if="modelValue" class="modal-overlay" @click="close">
    <div class="modal-content" role="dialog" aria-modal="true" @click.stop>
      <div class="modal-head">
        <h3 class="modal-title">{{ tx('رفض طلب الإرجاع', 'Reject Return Request') }}</h3>
      </div>
      <div class="modal-body">
        <label for="reject-reason">{{ tx('سبب الرفض', 'Rejection reason') }}</label>
        <textarea id="reject-reason" v-model="reason" rows="4" :placeholder="tx('يرجى توضيح سبب الرفض...', 'Please explain the reason for rejection...')"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="close">{{ tx('إلغاء', 'Cancel') }}</button>
        <button class="btn-confirm" type="button" :disabled="busy" @click="confirm">{{ tx('تأكيد الرفض', 'Confirm rejection') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import { useDialog } from '../composables/useDialog';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const { tx } = useAdminText();
const dialog = useDialog();
const reason = ref('');

watch(() => props.modelValue, (open) => { if (open) reason.value = ''; });

const close = () => emit('update:modelValue', false);

const confirm = () => {
  if (!reason.value.trim()) {
    dialog.alert('يرجى إدخال سبب الرفض', { type: 'warning', title: 'رفض طلب الإرجاع' });
    return;
  }
  emit('confirm', reason.value.trim());
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  border-radius: 12px;
  background: #ffffff;
  color: #374151;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:global(.dark) .modal-content {
  background: #1e293b;
  color: #cbd5e1;
}

.modal-head {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

:global(.dark) .modal-head {
  border-color: #334155;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #111827;
}

:global(.dark) .modal-title {
  color: #f1f5f9;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
}

:global(.dark) .modal-body label {
  color: #cbd5e1;
}

.modal-body textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.8rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

:global(.dark) .modal-body textarea {
  border-color: #334155;
  background: #0f172a;
  color: #f1f5f9;
}

.modal-body textarea:focus {
  border-color: #660033;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 0.8rem;
  border: 0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
  color: #111827;
}

.btn-confirm {
  background: #dc2626;
  color: #ffffff;
}

.btn-confirm:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
