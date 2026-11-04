<script setup>
import { computed, ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import { adminInventoryService } from '../application/adminInventoryService';
import { NOTES_MAX, REASON_MAX, adjustErrorText, validateAdjustment } from '../domain/inventory/inventory';

// Add or remove stock for one product (POST /products/{id}/adjust-stock).
const props = defineProps({
  product: { type: Object, default: null }, // { id, name, stock }
  mode: { type: String, default: 'add' }, // add | remove
});
const emit = defineEmits(['close', 'done']);

const { tx, locale } = useAdminText();
const form = ref({ quantity: '', reason: '', notes: '' });
const touched = ref(false);
const saving = ref(false);
const serverError = ref('');

watch(() => [props.product?.id, props.mode], () => {
  form.value = { quantity: '', reason: '', notes: '' };
  touched.value = false;
  serverError.value = '';
}, { immediate: true });

const isRemove = computed(() => props.mode === 'remove');
const available = computed(() => Number(props.product?.stock) || 0);
const errors = computed(() => (touched.value ? validateAdjustment({ ...form.value, mode: props.mode }, available.value) : {}));
const after = computed(() => {
  const n = parseInt(form.value.quantity, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return isRemove.value ? available.value - n : available.value + n;
});

const ERROR_TEXT = {
  quantity: {
    required: ['أدخل الكمية', 'Enter the quantity'],
    integer: ['الكمية لازم تكون رقم صحيح', 'The quantity must be a whole number'],
    positive: ['الكمية لازم تكون أكبر من صفر', 'The quantity must be more than zero'],
    too_large: ['الكمية كبيرة جداً', 'The quantity is too large'],
    exceeds: ['الكمية أكبر من المتوفر', 'More than the available stock'],
  },
  reason: {
    required: ['اكتب سبب الحركة', 'Enter the reason'],
    too_long: [`السبب بحد أقصى ${REASON_MAX} حرف`, `At most ${REASON_MAX} characters`],
  },
  notes: { too_long: [`الملاحظات بحد أقصى ${NOTES_MAX} حرف`, `At most ${NOTES_MAX} characters`] },
};
const errorText = (field) => {
  const pair = ERROR_TEXT[field]?.[errors.value[field]];
  if (!pair) return '';
  if (field === 'quantity' && errors.value.quantity === 'exceeds') {
    return tx(`الكمية أكبر من المتوفر (${available.value})`, `More than the available stock (${available.value})`);
  }
  return tx(pair[0], pair[1]);
};

const close = () => { if (!saving.value) emit('close'); };

const submit = async () => {
  touched.value = true;
  serverError.value = '';
  if (Object.keys(validateAdjustment({ ...form.value, mode: props.mode }, available.value)).length) return;
  saving.value = true;
  try {
    const result = await adminInventoryService.adjustStock(props.product.id, { ...form.value, mode: props.mode });
    emit('done', { stock: Number.isFinite(result.stock) ? result.stock : after.value });
  } catch (error) {
    serverError.value = adjustErrorText(error, locale.value) || tx('تعذّر حفظ حركة المخزون، حاول مرة أخرى', 'Could not save the stock change, please try again');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div v-if="product" class="modal-overlay" @click.self="close">
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title" data-testid="stock-dialog" :data-mode="mode">
      <button class="modal-close" type="button" :aria-label="tx('إغلاق', 'Close')" @click="close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="dialog-head">
        <span class="head-icon" :class="isRemove ? 'remove' : 'add'">
          <svg v-if="isRemove" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </span>
        <div>
          <h2 id="stock-dialog-title">{{ isRemove ? tx('خصم مخزون', 'Remove stock') : tx('إضافة مخزون', 'Add stock') }}</h2>
          <p data-testid="stock-dialog-product">{{ product.name }} ({{ tx('المتوفر', 'Available') }}: <b dir="ltr">{{ available }}</b>)</p>
        </div>
      </div>

      <form class="dialog-body" novalidate @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label" for="stock-qty">{{ tx('الكمية', 'Quantity') }} <span class="req">*</span></label>
          <input
            id="stock-qty" v-model="form.quantity" type="number" inputmode="numeric" min="1" step="1"
            class="form-control" :class="{ invalid: errors.quantity }" :placeholder="tx('أدخل الكمية', 'Enter the quantity')"
            data-testid="stock-qty" autofocus
          />
          <span v-if="errors.quantity" class="field-error" data-testid="error-quantity">{{ errorText('quantity') }}</span>
          <span v-else-if="after !== null" class="after-hint" :class="{ warn: after <= 0 }" data-testid="stock-after">
            {{ tx('المخزون بعد الحفظ', 'Stock after saving') }}: <b dir="ltr">{{ after }}</b>
          </span>
        </div>

        <div class="form-group">
          <label class="form-label" for="stock-reason">{{ tx('السبب', 'Reason') }} <span class="req">*</span></label>
          <input
            id="stock-reason" v-model="form.reason" type="text" :maxlength="REASON_MAX + 50"
            class="form-control" :class="{ invalid: errors.reason }"
            :placeholder="isRemove ? tx('مثال: تالف / مرتجع', 'e.g. damaged / returned') : tx('مثال: توريد جديد من المورد', 'e.g. new delivery from the supplier')"
            data-testid="stock-reason"
          />
          <span v-if="errors.reason" class="field-error" data-testid="error-reason">{{ errorText('reason') }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="stock-notes">{{ tx('ملاحظات', 'Notes') }} <span class="optional">({{ tx('اختياري', 'optional') }})</span></label>
          <textarea id="stock-notes" v-model="form.notes" rows="3" class="form-control textarea" :class="{ invalid: errors.notes }" data-testid="stock-notes"></textarea>
          <span v-if="errors.notes" class="field-error" data-testid="error-notes">{{ errorText('notes') }}</span>
        </div>

        <div v-if="serverError" class="server-error" role="alert" data-testid="stock-server-error">{{ serverError }}</div>

        <div class="dialog-foot">
          <button type="button" class="btn-cancel" :disabled="saving" data-testid="stock-cancel" @click="close">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="submit" class="btn-save" :class="isRemove ? 'remove' : 'add'" :disabled="saving" data-testid="stock-save">
            <span v-if="saving" class="spinner"></span>
            {{ isRemove ? tx('خصم', 'Remove') : tx('إضافة', 'Add') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: #fff; border-radius: 12px; width: 100%; max-width: 480px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-height: 95vh; overflow-y: auto; font-family: 'IBM Plex Sans Arabic', sans-serif; }
.modal-close { position: absolute; top: 1.1rem; inset-inline-end: 1.1rem; background: transparent; color: #6b7280; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: #f3f4f6; }
.dialog-head { display: flex; align-items: center; gap: 0.8rem; padding: 1.3rem 1.5rem 1rem; border-bottom: 1px solid #e5e7eb; }
.dialog-head h2 { margin: 0; font-size: 1.08rem; font-weight: 800; color: #111827; }
.dialog-head p { margin: 0.15rem 0 0; font-size: 0.8rem; color: #6b7280; }
.head-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.head-icon.add { background: #dcfce7; color: #16a34a; }
.head-icon.remove { background: #ffedd5; color: #ea580c; }
.dialog-body { padding: 1.1rem 1.5rem 1.4rem; display: flex; flex-direction: column; gap: 0.95rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #374151; }
.req { color: #dc2626; }
.optional { color: #9ca3af; font-weight: 500; }
.form-control { width: 100%; box-sizing: border-box; height: 42px; padding: 0 0.9rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: inherit; font-size: 0.85rem; color: #111827; background: #f9fafb; outline: none; }
.form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.12); }
.form-control.invalid { border-color: #dc2626; background: #fef2f2; }
.textarea { height: auto; padding: 0.6rem 0.9rem; resize: vertical; }
.field-error { color: #dc2626; font-size: 0.74rem; font-weight: 600; }
.after-hint { font-size: 0.76rem; color: #374151; }
.after-hint.warn { color: #ea580c; }
.server-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.8rem; font-weight: 600; }
.dialog-foot { display: flex; gap: 0.6rem; justify-content: flex-end; padding-top: 0.4rem; border-top: 1px solid #f3f4f6; margin-top: 0.2rem; }
.btn-cancel { padding: 0.6rem 1.1rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.btn-save { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.6rem 1.3rem; border-radius: 8px; border: none; color: #fff; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.btn-save.add { background: #16a34a; }
.btn-save.add:hover:not(:disabled) { background: #15803d; }
.btn-save.remove { background: #ea580c; }
.btn-save.remove:hover:not(:disabled) { background: #c2410c; }
.btn-save:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.45); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 520px) {
  .dialog-foot button { flex: 1; justify-content: center; }
}
</style>
