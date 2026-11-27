<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import adminCatalogService from '../application/adminCatalogService';
import { apiErrorMessage } from '../utils/apiMessage';
import { normalizeHexColor } from '../constants/colors';
import { useAdminText } from '../composables/useAdminText';
import {
  MAX_VARIANTS, activeGroups, applyToAll, combinationCount, removeRow, rowLabel, setMainRow, syncVariantRows, variantSummary,
} from '../domain/catalog/variantMatrix';

// Builds a product's variants from its attributes. The admin turns on the attributes that differ between the
// variants (Colour, Size...), ticks the values of each, and every combination becomes a row with its own price,
// stock and pictures. When adding, the first row (or the one marked main) is sent with the product and the rest are
// added to it. When editing, the rows start as the product's saved variants (they carry an `id`): their stock is
// changed in Inventory, the main variant cannot be removed, and new combinations become new variants.
const props = defineProps({
  // [{ id, name, label, type, values: [{ id, label, color, name_ar, name_en }] }] from the attributes endpoint.
  attributes: { type: Array, default: () => [] },
  currency: { type: String, default: '' },
  // Pictures chosen for the product itself: they belong to the main variant.
  mainImages: { type: Array, default: () => [] },
  // { key, field } of the row the form refused to save, so it is scrolled to and focused.
  problem: { type: Object, default: null },
  // The main variant is the product itself, so its status is the product's status (set in the info tab).
  mainActive: { type: Boolean, default: true },
  // Editing a product that already exists (its saved variants are the first rows).
  editing: { type: Boolean, default: false },
  // The variant saved with the product itself (the product's own id): it can never be removed.
  lockedId: { type: [Number, String], default: null },
});
const emit = defineEmits(['notify', 'reload-attributes']);
// { groups, rows, excluded, defaults, archive } — kept by the page so it can save, summarise and validate it.
// `archive`: saved variants hidden for a moment (a value un-ticked); ticking it again brings the same variant back.
const state = defineModel({ type: Object, required: true });

const { tx, locale } = useAdminText();

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // the API refuses a variant picture over 5 MB
const MAX_ROW_IMAGES = 5;

const attrTitle = (attribute = {}) => (locale.value === 'en'
  ? (attribute.translations?.en?.name || attribute.name_en || attribute.name || attribute.label)
  : (attribute.label || attribute.name));
const valTitle = (value = {}) => (locale.value === 'en'
  ? (value.name_en || value.translations?.en?.name || value.label)
  : (value.name_ar || value.label));

const swatch = (attribute, value) => (attribute?.type === 'color' ? (value?.hex || normalizeHexColor(value?.color)) : null);

// ── state helpers ────────────────────────────────────────────────────────────
const attributeById = computed(() => new Map(props.attributes.map((attribute) => [String(attribute.id), attribute])));
const optionById = computed(() => {
  const map = new Map();
  props.attributes.forEach((attribute) => (attribute.values || []).forEach((value) => map.set(String(value.id), { attribute, value })));
  return map;
});
const groupOf = (attributeId) => state.value.groups.find((group) => String(group.attributeId) === String(attributeId));
const isOn = (attributeId) => Boolean(groupOf(attributeId));
const isTicked = (attributeId, optionId) => Boolean(groupOf(attributeId)?.options.some((option) => String(option.id) === String(optionId)));
const tickedCount = (attributeId) => groupOf(attributeId)?.options.length || 0;

// A new set of groups regenerates the rows; what was typed for a combination that still exists is kept.
const commitGroups = (groups, extra = {}) => {
  const order = new Map(props.attributes.map((attribute, index) => [String(attribute.id), index]));
  const sorted = [...groups].sort((a, b) => (order.get(String(a.attributeId)) ?? 0) - (order.get(String(b.attributeId)) ?? 0));
  const next = { ...state.value, ...extra, groups: sorted };
  const archive = next.archive || [];
  next.rows = syncVariantRows(sorted, state.value.rows, { defaults: next.defaults, excluded: next.excluded, archive });
  // saved variants that left the rows wait in the archive, the ones that came back leave it
  const left = state.value.rows.filter((row) => row.existing && !next.rows.some((kept) => kept.key === row.key));
  next.archive = [...archive.filter((row) => !next.rows.some((kept) => kept.key === row.key) && !left.some((gone) => gone.key === row.key)), ...left];
  state.value = next;
};
const setRows = (rows) => { state.value = { ...state.value, rows }; };
const patchRow = (key, patch) => setRows(state.value.rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

const toggleAttribute = (attribute) => {
  if (isOn(attribute.id)) {
    commitGroups(state.value.groups.filter((group) => String(group.attributeId) !== String(attribute.id)));
    return;
  }
  commitGroups([...state.value.groups, { attributeId: attribute.id, name: attrTitle(attribute), options: [] }]);
};

const toggleOption = (attribute, value) => {
  const group = groupOf(attribute.id);
  if (!group) return;
  const has = isTicked(attribute.id, value.id);
  const options = has
    ? group.options.filter((option) => String(option.id) !== String(value.id))
    : [...group.options, { id: value.id, label: valTitle(value), color: swatch(attribute, value) }];
  const groups = state.value.groups.map((item) => (item === group ? { ...group, options } : item));
  if (!has && combinationCount(groups) > MAX_VARIANTS) {
    emit('notify', tx(`الحد الأقصى ${MAX_VARIANTS} متغير. قلّل عدد القيم المختارة.`, `At most ${MAX_VARIANTS} variants. Choose fewer values.`), 'error');
    return;
  }
  // Un-ticking a value that was removed by hand earlier is not needed any more.
  commitGroups(groups);
};

const tickAll = (attribute) => {
  const group = groupOf(attribute.id);
  if (!group) return;
  const all = (attribute.values || []).filter((value) => value.is_active !== false);
  const full = all.length > 0 && all.every((value) => isTicked(attribute.id, value.id));
  const options = full ? [] : all.map((value) => ({ id: value.id, label: valTitle(value), color: swatch(attribute, value) }));
  const groups = state.value.groups.map((item) => (item === group ? { ...group, options } : item));
  if (combinationCount(groups) > MAX_VARIANTS) {
    emit('notify', tx(`الحد الأقصى ${MAX_VARIANTS} متغير. قلّل عدد القيم المختارة.`, `At most ${MAX_VARIANTS} variants. Choose fewer values.`), 'error');
    return;
  }
  commitGroups(groups);
};

// ── rows ─────────────────────────────────────────────────────────────────────
const rows = computed(() => state.value.rows);
const activeGroupList = computed(() => activeGroups(state.value.groups));
const total = computed(() => combinationCount(state.value.groups));
const summary = computed(() => variantSummary(rows.value.map((row) => (row.is_main ? { ...row, is_active: props.mainActive } : row))));
const formula = computed(() => activeGroupList.value.map((group) => group.options.length).join(' × '));
const hiddenCount = computed(() => Math.max(0, total.value - rows.value.length));

const labelOfOption = (option) => {
  const found = optionById.value.get(String(option.id));
  return found ? valTitle(found.value) : option.label;
};
const dotOfOption = (option) => {
  const found = optionById.value.get(String(option.id));
  return found ? swatch(found.attribute, found.value) : option.color;
};

const makeMain = (row) => setRows(setMainRow(rows.value, row.key));
// The main variant and the one saved with the product stay when editing (the API cannot delete them).
const isLocked = (row) => props.editing && (row.is_main || (props.lockedId !== null && String(row.id) === String(props.lockedId)));
const dropRow = (row) => {
  if (isLocked(row)) {
    emit('notify', tx('المتغير الأساسي لا يمكن حذفه. عيّن متغيرًا آخر كأساسي أولًا.', 'The main variant cannot be removed. Make another variant the main one first.'), 'error');
    return;
  }
  if (rows.value.length <= 1) {
    emit('notify', tx('يجب أن يبقى متغير واحد على الأقل. ألغِ تفعيل الخاصية إذا أردت منتجًا بدون متغيرات.', 'At least one variant must stay. Turn the attribute off for a product without variants.'), 'error');
    return;
  }
  const archive = row.existing ? [...(state.value.archive || []).filter((saved) => saved.key !== row.key), row] : state.value.archive || [];
  state.value = { ...state.value, rows: removeRow(rows.value, row.key), excluded: [...new Set([...state.value.excluded, row.key])], archive };
};
const restoreRows = () => commitGroups(state.value.groups, { excluded: [] });

// Price / stock for every row at once; new rows made later start from the same values.
const bulk = ref({ price: '', number: '' });
const applyBulk = (field) => {
  const value = bulk.value[field];
  if (value === '' || !(Number(value) >= 0)) {
    emit('notify', field === 'price' ? tx('اكتب سعرًا صحيحًا', 'Enter a valid price') : tx('اكتب مخزونًا صحيحًا', 'Enter a valid stock'), 'error');
    return;
  }
  if (field === 'number' && !Number.isInteger(Number(value))) {
    emit('notify', tx('المخزون لازم يكون رقمًا صحيحًا', 'Stock must be a whole number'), 'error');
    return;
  }
  // The stock of a saved variant is changed in Inventory, so "stock for all" only fills the new rows.
  const filled = applyToAll(rows.value, field, value).map((row, index) => (field === 'number' && rows.value[index].existing ? rows.value[index] : row));
  state.value = { ...state.value, rows: filled, defaults: { ...state.value.defaults, [field]: value } };
};

// ── pictures of a variant ────────────────────────────────────────────────────
const urls = new WeakMap();
const urlList = new Set();
const urlFor = (file) => {
  if (!urls.has(file)) {
    const url = URL.createObjectURL(file);
    urls.set(file, url);
    urlList.add(url);
  }
  return urls.get(file);
};
onBeforeUnmount(() => urlList.forEach((url) => URL.revokeObjectURL(url)));

const pickFiles = (row, event) => {
  const picked = [...(event.target.files || [])];
  event.target.value = '';
  const room = MAX_ROW_IMAGES - (row.files || []).length;
  const accepted = picked.filter((file) => file.size <= MAX_IMAGE_BYTES).slice(0, Math.max(0, room));
  if (accepted.length < picked.length) {
    emit('notify', tx(`الصورة لازم تكون أقل من 5 ميجا، وحد أقصى ${MAX_ROW_IMAGES} صور لكل متغير.`, `Each picture must be under 5 MB, up to ${MAX_ROW_IMAGES} per variant.`), 'error');
  }
  if (accepted.length) patchRow(row.key, { files: [...(row.files || []), ...accepted] });
};
const dropFile = (row, index) => patchRow(row.key, { files: row.files.filter((_, i) => i !== index) });

// ── a new value for an attribute, added without leaving the form ─────────────
const adding = ref(null); // { attributeId, name_ar, name_en, value_code }
const addingBusy = ref(false);
let pendingTick = null;
const openAdd = (attribute) => { adding.value = { attributeId: attribute.id, name_ar: '', name_en: '', value_code: attribute.type === 'color' ? '#660033' : '' }; };
const saveValue = async (attribute) => {
  const form = adding.value;
  if (!form || addingBusy.value) return;
  if (!form.name_ar.trim() || !form.name_en.trim()) {
    emit('notify', tx('اكتب اسم القيمة بالعربي والإنجليزي', 'Enter the value name in Arabic and English'), 'error');
    return;
  }
  addingBusy.value = true;
  try {
    const created = await adminCatalogService.createAttributeOption(attribute.id, {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      ...(form.value_code ? { value_code: form.value_code } : {}),
    });
    pendingTick = { attributeId: attribute.id, optionId: created?.id };
    adding.value = null;
    emit('reload-attributes');
    emit('notify', tx('تمت إضافة القيمة', 'Value added'));
  } catch (error) {
    emit('notify', apiErrorMessage(error, tx('تعذر إضافة القيمة', 'Could not add the value')), 'error');
  } finally {
    addingBusy.value = false;
  }
};
// Once the attributes list has been reloaded the new value exists: tick it.
watch(() => props.attributes, () => {
  if (!pendingTick) return;
  const { attributeId, optionId } = pendingTick;
  const attribute = attributeById.value.get(String(attributeId));
  const value = attribute?.values?.find((item) => String(item.id) === String(optionId));
  if (!attribute || !value) return;
  pendingTick = null;
  if (isOn(attribute.id) && !isTicked(attribute.id, value.id)) toggleOption(attribute, value);
});

// ── a row the form refused to save ───────────────────────────────────────────
watch(() => props.problem, async (problem) => {
  if (!problem) return;
  await nextTick();
  const input = document.querySelector(`[data-vb-row="${problem.key}"] [data-vb-field="${problem.field}"]`);
  input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input?.focus();
});
const isProblem = (row, field) => props.problem?.key === row.key && props.problem?.field === field;
</script>

<template>
  <section class="vb" data-testid="variant-builder">
    <!-- 1. the attributes the variants differ by -->
    <div class="vb-card">
      <header class="vb-head">
        <span class="vb-step">1</span>
        <div>
          <h4>{{ tx('اختر الخصائص والقيم', 'Choose the attributes and values') }}</h4>
          <p>{{ tx('فعّل الخاصية التي تختلف بها المتغيرات (مثل اللون والمقاس) وحدد قيمها. كل تركيبة بين القيم تتحول إلى متغير له سعر ومخزون خاصان به.', 'Turn on the attributes the variants differ by (such as colour and size) and tick their values. Every combination of the values becomes a variant with its own price and stock.') }}</p>
        </div>
      </header>

      <div v-if="!attributes.length" class="vb-empty">
        {{ tx('لا توجد خصائص مسجلة بعد.', 'No attributes are registered yet.') }}
        <router-link :to="{ name: 'Attributes' }">{{ tx('إضافة خاصية', 'Add an attribute') }}</router-link>
      </div>

      <ul v-else class="vb-attrs">
        <li v-for="attribute in attributes" :key="attribute.id" class="vb-attr" :class="{ on: isOn(attribute.id) }" :data-testid="`vb-attr-${attribute.id}`">
          <div class="vb-attr-top">
            <label class="vb-switch">
              <input type="checkbox" :checked="isOn(attribute.id)" :data-testid="`vb-attr-toggle-${attribute.id}`" @change="toggleAttribute(attribute)" />
              <span class="vb-switch-track"><span class="vb-switch-thumb"></span></span>
              <span class="vb-attr-name">{{ attrTitle(attribute) }}</span>
            </label>
            <span v-if="isOn(attribute.id)" class="vb-attr-count" :class="{ zero: !tickedCount(attribute.id) }">
              {{ tickedCount(attribute.id) ? tx(`${tickedCount(attribute.id)} قيمة`, `${tickedCount(attribute.id)} selected`) : tx('اختر قيمة واحدة على الأقل', 'Pick at least one value') }}
            </span>
          </div>

          <div v-if="isOn(attribute.id)" class="vb-values">
            <button
              v-for="value in attribute.values"
              :key="value.id"
              type="button"
              class="vb-chip"
              :class="{ active: isTicked(attribute.id, value.id) }"
              :aria-pressed="isTicked(attribute.id, value.id)"
              :data-testid="`vb-value-${value.id}`"
              @click="toggleOption(attribute, value)"
            >
              <span v-if="swatch(attribute, value)" class="vb-dot" :style="{ background: swatch(attribute, value) }"></span>
              <span>{{ valTitle(value) }}</span>
              <svg v-if="isTicked(attribute.id, value.id)" class="vb-tick" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
            <span v-if="!attribute.values?.length" class="vb-muted">{{ tx('لا توجد قيم لهذه الخاصية بعد.', 'This attribute has no values yet.') }}</span>

            <button v-if="attribute.values?.length > 1" type="button" class="vb-link" @click="tickAll(attribute)">
              {{ attribute.values.every((value) => isTicked(attribute.id, value.id)) ? tx('إلغاء الكل', 'Clear all') : tx('تحديد الكل', 'Select all') }}
            </button>
            <button v-if="!adding || adding.attributeId !== attribute.id" type="button" class="vb-chip vb-chip-add" :data-testid="`vb-add-value-${attribute.id}`" @click="openAdd(attribute)">+ {{ tx('قيمة جديدة', 'New value') }}</button>
          </div>

          <form v-if="adding && adding.attributeId === attribute.id" class="vb-add" @submit.prevent="saveValue(attribute)">
            <input v-model="adding.name_ar" type="text" dir="rtl" :placeholder="tx('الاسم بالعربي', 'Arabic name')" data-testid="vb-new-ar" />
            <input v-model="adding.name_en" type="text" dir="ltr" :placeholder="tx('الاسم بالإنجليزي', 'English name')" data-testid="vb-new-en" />
            <input v-if="attribute.type === 'color'" v-model="adding.value_code" type="color" class="vb-color" :title="tx('اللون', 'Colour')" />
            <button type="submit" class="vb-btn primary" :disabled="addingBusy" data-testid="vb-new-save">{{ addingBusy ? tx('جارٍ الحفظ...', 'Saving...') : tx('إضافة', 'Add') }}</button>
            <button type="button" class="vb-btn" :disabled="addingBusy" @click="adding = null">{{ tx('إلغاء', 'Cancel') }}</button>
          </form>
        </li>
      </ul>
    </div>

    <!-- 2. the variants that come out of the chosen values -->
    <div class="vb-card">
      <header class="vb-head">
        <span class="vb-step">2</span>
        <div>
          <h4>{{ tx('المتغيرات الناتجة', 'Generated variants') }}</h4>
          <p v-if="rows.length && editing">{{ tx('هذه متغيرات المنتج الحالية. عدّل السعر والحالة، وأضف تركيبات جديدة بتفعيل قيم، أو احذف متغيرًا. يُعدَّل المخزون من «إدارة المخزون».', 'These are the product’s current variants. Change the price and status, add combinations by ticking values, or remove a variant. Stock is changed in “Inventory”.') }}</p>
          <p v-else-if="rows.length">{{ tx('حدد السعر والمخزون لكل متغير. المتغير الأساسي هو الذي يظهر أولًا للعميل وتُنسَب إليه صور المنتج.', 'Set the price and stock of every variant. The main variant is the one customers see first and it carries the product pictures.') }}</p>
          <p v-else>{{ tx('عند اختيار القيم تُولَّد المتغيرات هنا تلقائيًا.', 'Once you tick values, the variants appear here automatically.') }}</p>
        </div>
      </header>

      <div v-if="!rows.length" class="vb-none" data-testid="vb-none">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
        <strong>{{ tx('منتج بدون متغيرات', 'A product without variants') }}</strong>
        <span v-if="editing">{{ tx('ليس لهذا المنتج متغيرات. سعره ومخزونه في الخانتين أعلاه. إذا فعّلت خاصية وحددت قيمها، تُضاف التركيبات الجديدة كمتغيرات للمنتج.', 'This product has no variants: its price and stock are in the fields above. Turn on an attribute and tick values to add variants to it.') }}</span>
        <span v-else>{{ tx('سيُحفظ كمنتج واحد بالسعر والمخزون المكتوبين أعلاه. فعّل خاصية أعلاه إذا أردت لونًا أو مقاسًا أو غيرهما.', 'It is saved as one product with the price and stock entered above. Turn on an attribute above for colours, sizes and so on.') }}</span>
      </div>

      <template v-else>
        <div class="vb-formula" data-testid="vb-formula">
          <span v-for="group in activeGroupList" :key="group.attributeId" class="vb-formula-part">
            <b>{{ group.options.length }}</b> {{ attrTitle(attributeById.get(String(group.attributeId)) || group) }}
          </span>
          <span class="vb-formula-eq">= <b data-testid="vb-count">{{ rows.length }}</b> {{ tx('متغير', 'variants') }}</span>
          <span v-if="activeGroupList.length > 1" class="vb-formula-note">({{ formula }})</span>
          <button v-if="hiddenCount > 0" type="button" class="vb-link" @click="restoreRows">{{ editing ? tx(`استرجاع / إضافة ${hiddenCount} تركيبة`, `Restore / add ${hiddenCount} combinations`) : tx(`استرجاع ${hiddenCount} محذوف`, `Restore ${hiddenCount} removed`) }}</button>
        </div>

        <div class="vb-bulk">
          <label>
            <span>{{ tx('سعر للكل', 'Price for all') }} ({{ currency }})</span>
            <input v-model="bulk.price" type="number" min="0" step="0.01" placeholder="0.00" data-testid="vb-bulk-price" @keydown.enter.prevent="applyBulk('price')" />
          </label>
          <button type="button" class="vb-btn" data-testid="vb-bulk-price-apply" @click="applyBulk('price')">{{ tx('تطبيق', 'Apply') }}</button>
          <label>
            <span>{{ tx('مخزون للكل', 'Stock for all') }}</span>
            <input v-model="bulk.number" type="number" min="0" step="1" placeholder="0" data-testid="vb-bulk-stock" @keydown.enter.prevent="applyBulk('number')" />
          </label>
          <button type="button" class="vb-btn" data-testid="vb-bulk-stock-apply" @click="applyBulk('number')">{{ tx('تطبيق', 'Apply') }}</button>
        </div>

        <div class="vb-table-wrap">
          <table class="vb-table">
            <thead>
              <tr>
                <th class="c-variant">{{ tx('المتغير', 'Variant') }}</th>
                <th class="c-price">{{ tx('السعر', 'Price') }} ({{ currency }}) <span class="req">*</span></th>
                <th class="c-stock">{{ tx('المخزون', 'Stock') }} <span class="req">*</span></th>
                <th class="c-pics">{{ tx('الصور', 'Pictures') }}</th>
                <th class="c-on">{{ tx('نشط', 'Active') }}</th>
                <th class="c-act"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.key" :class="{ main: row.is_main, off: row.is_active === false }" :data-vb-row="row.key" :data-testid="`vb-row-${row.key}`">
                <td class="c-variant">
                  <div class="vb-opts">
                    <span v-for="option in row.options" :key="option.id" class="vb-opt">
                      <span v-if="dotOfOption(option)" class="vb-dot" :style="{ background: dotOfOption(option) }"></span>{{ labelOfOption(option) }}
                    </span>
                    <span v-if="row.is_main" class="vb-main-badge">{{ tx('الأساسي', 'Main') }}</span>
                  </div>
                </td>
                <td class="c-price">
                  <input :value="row.price" type="number" min="0" step="0.01" placeholder="0.00" :class="{ bad: isProblem(row, 'price') }" data-vb-field="price" data-testid="vb-price" :aria-label="tx('السعر', 'Price')" @input="patchRow(row.key, { price: $event.target.value })" />
                </td>
                <td class="c-stock">
                  <input :value="row.number" type="number" min="0" step="1" placeholder="0" :disabled="Boolean(row.existing)" :title="row.existing ? tx('يُعدَّل المخزون من «إدارة المخزون»', 'Stock is changed in “Inventory”') : ''" :class="{ bad: isProblem(row, 'number'), locked: row.existing }" data-vb-field="number" data-testid="vb-stock" :aria-label="tx('المخزون', 'Stock')" @input="patchRow(row.key, { number: $event.target.value })" />
                </td>
                <td class="c-pics">
                  <div v-if="row.is_main" class="vb-pics">
                    <span v-for="(src, index) in mainImages.slice(0, 3)" :key="`m${index}`" class="vb-thumb"><img :src="src" alt="" /></span>
                    <span v-if="mainImages.length > 3" class="vb-more">+{{ mainImages.length - 3 }}</span>
                    <span v-if="!mainImages.length" class="vb-muted">{{ tx('صور المنتج', 'Product pictures') }}</span>
                  </div>
                  <div v-else class="vb-pics">
                    <span v-for="(src, index) in (row.images || []).slice(0, 3)" :key="`s${index}`" class="vb-thumb"><img :src="src" alt="" /></span>
                    <span v-for="(file, index) in row.files" :key="index" class="vb-thumb">
                      <img :src="urlFor(file)" alt="" />
                      <button type="button" class="vb-thumb-x" :aria-label="tx('حذف الصورة', 'Remove picture')" @click="dropFile(row, index)">✕</button>
                    </span>
                    <label v-if="(row.files || []).length < MAX_ROW_IMAGES" class="vb-upload" :title="tx('إضافة صور لهذا المتغير', 'Add pictures to this variant')">
                      <input type="file" accept="image/*" multiple @change="pickFiles(row, $event)" />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </label>
                  </div>
                </td>
                <td class="c-on">
                  <label class="vb-switch small" :title="row.is_main ? tx('حالة المتغير الأساسي هي حالة المنتج (من تبويب المعلومات)', 'The main variant follows the product status (Information tab)') : ''">
                    <input type="checkbox" :checked="row.is_main ? mainActive : row.is_active !== false" :disabled="row.is_main" :aria-label="tx('نشط', 'Active')" @change="patchRow(row.key, { is_active: $event.target.checked })" />
                    <span class="vb-switch-track"><span class="vb-switch-thumb"></span></span>
                  </label>
                </td>
                <td class="c-act">
                  <div class="vb-acts">
                    <button type="button" class="vb-star" :class="{ on: row.is_main }" :disabled="row.is_main || (editing && row.id == null)" :title="row.is_main ? tx('المتغير الأساسي', 'Main variant') : (editing && row.id == null) ? tx('احفظ المتغير الأول ثم عيّنه أساسيًا', 'Save the variant first, then make it the main one') : tx('تعيين كمتغير أساسي', 'Make this the main variant')" :aria-pressed="row.is_main" data-testid="vb-make-main" @click="makeMain(row)">
                      <svg width="15" height="15" viewBox="0 0 24 24" :fill="row.is_main ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </button>
                    <button type="button" class="vb-del" :disabled="isLocked(row)" :title="isLocked(row) ? tx('المتغير الأساسي لا يمكن حذفه', 'The main variant cannot be removed') : tx('حذف هذا المتغير', 'Remove this variant')" data-testid="vb-remove" @click="dropRow(row)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="vb-foot">
          {{ tx(`${summary.count} متغير · ${summary.active} نشط · إجمالي المخزون ${summary.stock}`, `${summary.count} variants · ${summary.active} active · total stock ${summary.stock}`) }}
          <template v-if="rows.length && rowLabel(rows[0])"> · {{ tx('الأساسي:', 'Main:') }} {{ rowLabel(rows.find((row) => row.is_main) || rows[0]) }}</template>
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.vb { display: flex; flex-direction: column; gap: 18px; }
.vb-card { border: 1px solid var(--border-color, #e5e7eb); border-radius: 16px; background: var(--bg-card, #fff); padding: 18px; }
.vb-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; }
.vb-head h4 { margin: 0 0 4px; font-size: 1rem; font-weight: 800; color: var(--text-main, #111827); }
.vb-head p { margin: 0; font-size: 0.8rem; line-height: 1.6; color: var(--text-muted, #6b7280); }
.vb-step { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 10px; background: var(--primary, #660033); color: #fff; font-weight: 800; font-size: 0.9rem; display: inline-flex; align-items: center; justify-content: center; }
.vb-empty { padding: 16px; border: 1px dashed var(--border-color, #e5e7eb); border-radius: 12px; font-size: 0.85rem; color: var(--text-muted, #6b7280); display: flex; gap: 10px; align-items: center; }
.vb-empty a { color: var(--primary, #660033); font-weight: 700; }

.vb-attrs { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.vb-attr { border: 1px solid var(--border-color, #e5e7eb); border-radius: 14px; padding: 12px 14px; transition: border-color 0.15s, background 0.15s; }
.vb-attr.on { border-color: var(--primary, #660033); background: color-mix(in srgb, var(--primary, #660033) 4%, transparent); }
.vb-attr-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.vb-attr-name { font-weight: 800; font-size: 0.92rem; color: var(--text-main, #111827); }
.vb-attr-count { font-size: 0.75rem; font-weight: 700; color: var(--primary, #660033); background: color-mix(in srgb, var(--primary, #660033) 10%, transparent); padding: 3px 10px; border-radius: 999px; }
.vb-attr-count.zero { color: #b45309; background: #fef3c7; }
.vb-values { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.vb-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--input-border, #d1d5db); background: var(--bg-card, #fff); color: var(--text-main, #374151); font-family: inherit; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.vb-chip:hover { border-color: var(--primary, #660033); }
.vb-chip.active { background: var(--primary, #660033); border-color: var(--primary, #660033); color: #fff; }
.vb-chip-add { border-style: dashed; color: var(--primary, #660033); background: transparent; }
.vb-tick { flex: 0 0 auto; }
.vb-dot { width: 13px; height: 13px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.18); flex: 0 0 auto; display: inline-block; }
.vb-muted { font-size: 0.78rem; color: var(--text-muted, #6b7280); }
.vb-link { border: none; background: none; padding: 0 4px; font-family: inherit; font-size: 0.78rem; font-weight: 700; color: var(--primary, #660033); cursor: pointer; }
.vb-add { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
.vb-add input[type='text'] { flex: 1 1 150px; min-width: 0; padding: 9px 12px; border: 1px solid var(--input-border, #d1d5db); border-radius: 10px; background: var(--input-bg, #fff); color: var(--text-main, #111827); font-family: inherit; font-size: 0.85rem; }
.vb-color { width: 40px; height: 38px; padding: 2px; border: 1px solid var(--input-border, #d1d5db); border-radius: 10px; background: var(--input-bg, #fff); cursor: pointer; }
.vb-btn { border: 1px solid var(--input-border, #d1d5db); border-radius: 10px; padding: 9px 16px; background: var(--bg-card, #fff); color: var(--text-main, #374151); font-family: inherit; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
.vb-btn.primary { background: var(--primary, #660033); border-color: var(--primary, #660033); color: #fff; }
.vb-btn:disabled { opacity: 0.55; cursor: wait; }

/* switch */
.vb-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; }
.vb-switch input { position: absolute; opacity: 0; pointer-events: none; }
.vb-switch-track { position: relative; width: 38px; height: 22px; border-radius: 999px; background: #d1d5db; transition: background 0.15s; flex: 0 0 auto; }
.vb-switch-thumb { position: absolute; top: 3px; inset-inline-start: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); transition: inset-inline-start 0.15s; }
.vb-switch input:checked + .vb-switch-track { background: var(--primary, #660033); }
.vb-switch input:checked + .vb-switch-track .vb-switch-thumb { inset-inline-start: 19px; }
.vb-switch input:focus-visible + .vb-switch-track { outline: 2px solid var(--primary, #660033); outline-offset: 2px; }
.vb-switch.small .vb-switch-track { width: 34px; height: 20px; }
.vb-switch.small .vb-switch-thumb { width: 14px; height: 14px; }
.vb-switch.small input:checked + .vb-switch-track .vb-switch-thumb { inset-inline-start: 17px; }

/* generated variants */
.vb-none { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 26px 16px; border: 1px dashed var(--border-color, #e5e7eb); border-radius: 14px; color: var(--text-muted, #6b7280); font-size: 0.82rem; line-height: 1.6; }
.vb-none strong { color: var(--text-main, #111827); font-size: 0.92rem; }
.vb-formula { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-bottom: 14px; font-size: 0.85rem; color: var(--text-main, #374151); }
.vb-formula-part { padding: 5px 12px; border-radius: 999px; background: var(--table-header-bg, #f3f4f6); }
.vb-formula-part b, .vb-formula-eq b { color: var(--primary, #660033); }
.vb-formula-eq { font-weight: 700; }
.vb-formula-note { color: var(--text-muted, #6b7280); direction: ltr; }
.vb-bulk { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; padding: 12px 14px; margin-bottom: 14px; border-radius: 12px; background: var(--table-header-bg, #f9fafb); }
.vb-bulk label { display: flex; flex-direction: column; gap: 5px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted, #4b5563); }
.vb-bulk input { width: 120px; padding: 8px 10px; border: 1px solid var(--input-border, #d1d5db); border-radius: 9px; background: var(--input-bg, #fff); color: var(--text-main, #111827); font-family: inherit; }
.vb-table-wrap { overflow-x: auto; border: 1px solid var(--border-color, #e5e7eb); border-radius: 12px; }
.vb-table { width: 100%; border-collapse: collapse; min-width: 560px; }
.vb-table th { padding: 10px 8px; text-align: start; font-size: 0.72rem; font-weight: 800; color: var(--text-muted, #6b7280); background: var(--table-header-bg, #f9fafb); white-space: nowrap; }
.vb-table td { padding: 8px; border-top: 1px solid var(--table-border, #f1f5f9); vertical-align: middle; }
.vb-table th.c-price, .vb-table th.c-stock { width: 1%; }
.vb-table th.c-on, .vb-table th.c-act { width: 1%; }
.vb-table tr.main td { background: color-mix(in srgb, #10b981 6%, transparent); }
.vb-table tr.off td { opacity: 0.6; }
.vb-table td.c-price input, .vb-table td.c-stock input { width: 92px; padding: 8px 8px; border: 1px solid var(--input-border, #d1d5db); border-radius: 9px; background: var(--input-bg, #fff); color: var(--text-main, #111827); font-family: inherit; font-size: 0.88rem; }
.vb-table td input:focus { outline: none; border-color: var(--primary, #660033); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #660033) 14%, transparent); }
.vb-table td input.locked { background: var(--table-header-bg, #f3f4f6); color: var(--text-muted, #6b7280); cursor: not-allowed; }
.vb-table td input.bad { border-color: #dc2626; background: #fef2f2; }
.vb-opts { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.vb-opt { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; background: var(--table-header-bg, #f3f4f6); font-size: 0.82rem; font-weight: 700; color: var(--text-main, #111827); }
.vb-main-badge { padding: 2px 9px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; background: #ecfdf5; color: #047857; }
.vb-pics { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.vb-thumb { position: relative; width: 34px; height: 34px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color, #e5e7eb); flex: 0 0 auto; }
.vb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vb-thumb-x { position: absolute; inset: 0; border: none; background: rgba(0, 0, 0, 0.55); color: #fff; font-size: 0.7rem; cursor: pointer; opacity: 0; transition: opacity 0.12s; }
.vb-thumb:hover .vb-thumb-x, .vb-thumb-x:focus-visible { opacity: 1; }
.vb-more { font-size: 0.75rem; font-weight: 700; color: var(--text-muted, #6b7280); }
.vb-upload { position: relative; width: 34px; height: 34px; border-radius: 8px; border: 1px dashed var(--primary, #660033); color: var(--primary, #660033); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.vb-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
.c-act { white-space: nowrap; }
.vb-acts { display: flex; align-items: center; gap: 2px; }
.vb-del, .vb-star { border: none; background: none; cursor: pointer; padding: 6px; border-radius: 8px; display: inline-flex; }
.vb-del { color: #dc2626; }
.vb-del:hover:not(:disabled) { background: #fef2f2; }
.vb-del:disabled { color: #d1d5db; cursor: not-allowed; }
.vb-star { color: #9ca3af; }
.vb-star:hover:not(:disabled) { color: #d97706; background: #fffbeb; }
.vb-star.on { color: #d97706; cursor: default; }
.vb-foot { margin: 12px 2px 0; font-size: 0.78rem; color: var(--text-muted, #6b7280); }
.req { color: #dc2626; }
@media (max-width: 640px) { .vb-card { padding: 14px; } .vb-bulk input { width: 100%; } }
</style>
