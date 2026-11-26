<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import adminCatalogService from '../application/adminCatalogService';
import { apiErrorMessage } from '../utils/apiMessage';
import { useAdminText } from '../composables/useAdminText';
import { useDialog } from '../composables/useDialog';
import { optionIdsFromSelection, variantOptionsText, variantPayload, variantSelection } from '../domain/catalog/productVariants';

// The variants (SKUs) of one product: each has its own price, stock, options and pictures. The product's own id is
// its main variant (edited in the form above); the variants listed here are managed through
// /v1/dashboard/products/{id}/variants. Stock of an existing variant is changed with "Adjust stock".
const props = defineProps({
  productId: { type: [Number, String], required: true },
  // [{ name, label, values: [{ id, label }] }] from the attributes endpoint.
  attributes: { type: Array, default: () => [] },
  currency: { type: String, default: '' },
});
const emit = defineEmits(['changed', 'notify']);

const { tx } = useAdminText();
const dialog = useDialog();

const variants = ref([]);
const loading = ref(false);
const saving = ref(false);
const editing = ref(null); // { id: number|null, price, number, is_active, is_main, selection: { [attribute]: optionId|'' }, files: File[] }

const usableAttributes = computed(() => props.attributes.filter((attribute) => Array.isArray(attribute.values) && attribute.values.length));

const load = async () => {
  if (!props.productId) return;
  loading.value = true;
  try {
    variants.value = await adminCatalogService.listVariants(props.productId);
  } catch (error) {
    emit('notify', apiErrorMessage(error, tx('تعذر تحميل المتغيرات', 'Could not load the variants')), 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(load);
watch(() => props.productId, () => { editing.value = null; load(); });

const startAdd = () => {
  editing.value = { id: null, price: '', number: 0, is_active: true, is_main: false, selection: {}, files: [] };
};

const startEdit = (variant) => {
  editing.value = {
    id: variant.id,
    price: variant.price,
    number: variant.number,
    is_active: variant.is_active !== false,
    is_main: variant.is_main === true,
    selection: variantSelection(variant, usableAttributes.value),
    files: [],
  };
};

const cancel = () => { editing.value = null; };

const pickFiles = (event) => {
  if (editing.value) editing.value.files = [...(event.target.files || [])];
};

const save = async () => {
  const form = editing.value;
  if (!form || saving.value) return;
  if (!(Number(form.price) >= 0) || form.price === '') {
    emit('notify', tx('اكتب سعر المتغير', 'Enter the variant price'), 'error');
    return;
  }
  const payload = variantPayload(form, optionIdsFromSelection(form.selection));
  saving.value = true;
  try {
    if (form.id) await adminCatalogService.updateVariant(props.productId, form.id, payload, form.files);
    else await adminCatalogService.createVariant(props.productId, payload, form.files);
    emit('notify', form.id ? tx('تم تحديث المتغير', 'Variant updated') : tx('تمت إضافة المتغير', 'Variant added'));
    editing.value = null;
    await load();
    emit('changed');
  } catch (error) {
    emit('notify', apiErrorMessage(error, tx('تعذر حفظ المتغير', 'Could not save the variant')), 'error');
  } finally {
    saving.value = false;
  }
};

const makeMain = async (variant) => {
  try {
    await adminCatalogService.updateVariant(props.productId, variant.id, { is_main: true });
    emit('notify', tx('تم تعيين المتغير الأساسي', 'Main variant set'));
    await load();
    emit('changed');
  } catch (error) {
    emit('notify', apiErrorMessage(error, tx('تعذر تغيير المتغير الأساسي', 'Could not change the main variant')), 'error');
  }
};

const remove = async (variant) => {
  const ok = await dialog.confirm(
    tx(`سيتم حذف المتغير (${variantOptionsText(variant) || '#' + variant.id}) نهائيًا.`, `The variant (${variantOptionsText(variant) || '#' + variant.id}) will be deleted permanently.`),
    { type: 'error', title: tx('حذف المتغير؟', 'Delete the variant?'), confirmText: tx('حذف', 'Delete') },
  );
  if (!ok) return;
  try {
    await adminCatalogService.deleteVariant(props.productId, variant.id);
    emit('notify', tx('تم حذف المتغير', 'Variant deleted'));
    await load();
    emit('changed');
  } catch (error) {
    emit('notify', apiErrorMessage(error, tx('تعذر حذف المتغير', 'Could not delete the variant')), 'error');
  }
};
</script>

<template>
  <section class="variants-panel" data-testid="variants-panel">
    <header class="variants-head">
      <div>
        <h4>{{ tx('متغيرات المنتج', 'Product variants') }}</h4>
        <p>{{ tx('كل متغير له سعر ومخزون وخيارات وصور خاصة به. العميل يختارها داخل صفحة المنتج.', 'Each variant has its own price, stock, options and pictures. Customers choose them on the product page.') }}</p>
      </div>
      <button type="button" class="variants-add" :disabled="loading || Boolean(editing)" data-testid="variant-add" @click="startAdd">+ {{ tx('إضافة متغير', 'Add variant') }}</button>
    </header>

    <p v-if="loading" class="variants-note">{{ tx('جارٍ التحميل...', 'Loading...') }}</p>

    <ul v-else class="variants-list">
      <li v-for="variant in variants" :key="variant.id" class="variant-row" :class="{ inactive: variant.is_active === false }" :data-testid="`variant-row-${variant.id}`">
        <div class="variant-main">
          <strong>{{ variantOptionsText(variant) || tx('بدون خيارات', 'No options') }}</strong>
          <span v-if="variant.is_main" class="variant-badge main">{{ tx('الأساسي', 'Main') }}</span>
          <span v-if="variant.is_active === false" class="variant-badge off">{{ tx('غير نشط', 'Inactive') }}</span>
        </div>
        <div class="variant-meta">
          <span>{{ tx('السعر', 'Price') }}: <b>{{ variant.price }}</b> {{ currency }}</span>
          <span v-if="variant.has_discount">{{ tx('بعد العرض', 'After offer') }}: <b>{{ variant.final_price }}</b></span>
          <span :class="{ low: Number(variant.number) <= 0 }">{{ tx('المخزون', 'Stock') }}: <b>{{ variant.number }}</b></span>
          <span class="variant-id">#{{ variant.id }}</span>
        </div>
        <div class="variant-actions">
          <button type="button" class="link" :disabled="Boolean(editing)" @click="startEdit(variant)">{{ tx('تعديل', 'Edit') }}</button>
          <button v-if="!variant.is_main" type="button" class="link" @click="makeMain(variant)">{{ tx('تعيين كأساسي', 'Make main') }}</button>
          <button v-if="!variant.is_main" type="button" class="link danger" @click="remove(variant)">{{ tx('حذف', 'Delete') }}</button>
        </div>
      </li>
      <li v-if="!variants.length" class="variants-note">{{ tx('لا توجد متغيرات بعد.', 'No variants yet.') }}</li>
    </ul>

    <div v-if="editing" class="variant-form" data-testid="variant-form" @keydown.enter.prevent="save">
      <h5>{{ editing.id ? tx('تعديل المتغير', 'Edit variant') : tx('متغير جديد', 'New variant') }}</h5>
      <div class="variant-grid">
        <label>
          <span>{{ tx('السعر', 'Price') }} ({{ currency }}) *</span>
          <input v-model="editing.price" type="number" step="0.01" min="0" required data-testid="variant-price" />
        </label>
        <label v-if="!editing.id">
          <span>{{ tx('المخزون', 'Stock') }} *</span>
          <input v-model="editing.number" type="number" min="0" required data-testid="variant-stock" />
        </label>
        <label v-for="attribute in usableAttributes" :key="attribute.name">
          <span>{{ attribute.label || attribute.name }}</span>
          <select v-model="editing.selection[attribute.name]" :data-testid="`variant-attr-${attribute.name}`">
            <option value="">—</option>
            <option v-for="value in attribute.values" :key="value.id" :value="value.id">{{ value.label }}</option>
          </select>
        </label>
        <label class="variant-files">
          <span>{{ tx('صور المتغير', 'Variant pictures') }}</span>
          <input type="file" accept="image/*" multiple @change="pickFiles" />
        </label>
      </div>
      <div class="variant-checks">
        <label><input v-model="editing.is_active" type="checkbox" /> {{ tx('نشط', 'Active') }}</label>
        <label v-if="editing.id"><input v-model="editing.is_main" type="checkbox" /> {{ tx('المتغير الأساسي', 'Main variant') }}</label>
      </div>
      <p v-if="editing.id" class="variants-note">{{ tx('لتغيير المخزون استخدم «تعديل المخزون» من صفحة المخزون.', 'To change the stock use “Adjust stock” on the Inventory page.') }}</p>
      <div class="variant-form-actions">
        <button type="button" class="primary" :disabled="saving" data-testid="variant-save" @click="save">{{ saving ? tx('جارٍ الحفظ...', 'Saving...') : tx('حفظ المتغير', 'Save variant') }}</button>
        <button type="button" class="ghost" :disabled="saving" @click="cancel">{{ tx('إلغاء', 'Cancel') }}</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.variants-panel { margin-top: 28px; padding-top: 22px; border-top: 1px solid #f1f5f9; }
.variants-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.variants-head h4 { margin: 0 0 4px; font-size: 1rem; font-weight: 800; color: #111827; }
.variants-head p { margin: 0; font-size: 0.8rem; color: #6b7280; line-height: 1.5; }
.variants-add { flex-shrink: 0; border: 1px dashed #660033; background: #fff; color: #660033; border-radius: 10px; padding: 9px 14px; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.variants-add:disabled { opacity: 0.45; cursor: not-allowed; }
.variants-note { margin: 8px 0; font-size: 0.8rem; color: #6b7280; list-style: none; }
.variants-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.variant-row { display: grid; gap: 8px; padding: 12px 14px; border: 1px solid #edf0f4; border-radius: 12px; background: #fafbfc; }
.variant-row.inactive { opacity: 0.65; }
.variant-main { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.9rem; color: #111827; }
.variant-badge { padding: 2px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
.variant-badge.main { background: #ecfdf5; color: #047857; }
.variant-badge.off { background: #f3f4f6; color: #6b7280; }
.variant-meta { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.8rem; color: #4b5563; }
.variant-meta .low b { color: #dc2626; }
.variant-id { color: #9ca3af; direction: ltr; }
.variant-actions { display: flex; flex-wrap: wrap; gap: 14px; }
.link { border: none; background: none; padding: 0; font-family: inherit; font-size: 0.8rem; font-weight: 700; color: #660033; cursor: pointer; }
.link.danger { color: #dc2626; }
.link:disabled { opacity: 0.4; cursor: not-allowed; }
.variant-form { margin-top: 14px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; }
.variant-form h5 { margin: 0 0 12px; font-size: 0.9rem; font-weight: 800; }
.variant-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.variant-grid label { display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #374151; }
.variant-grid input, .variant-grid select { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-family: inherit; font-size: 0.9rem; background: #fafafa; }
.variant-files { grid-column: 1 / -1; }
.variant-checks { display: flex; gap: 18px; margin-top: 12px; font-size: 0.85rem; }
.variant-checks label { display: inline-flex; align-items: center; gap: 6px; }
.variant-form-actions { display: flex; gap: 10px; margin-top: 14px; }
.primary { border: none; border-radius: 10px; padding: 10px 18px; background: #660033; color: #fff; font-family: inherit; font-weight: 700; cursor: pointer; }
.primary:disabled { opacity: 0.6; cursor: wait; }
.ghost { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 18px; background: #fff; color: #374151; font-family: inherit; font-weight: 700; cursor: pointer; }
@media (max-width: 640px) { .variants-head { flex-direction: column; } }
</style>
