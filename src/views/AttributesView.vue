<template>
  <div class="attributes-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <h2 class="page-title">{{ tx('خصائص المنتجات', 'Product Attributes') }}</h2>
        <p class="page-subtitle">{{ tx('إدارة القيم المتاحة ضمن خصائص المنتجات المعرفة مسبقاً', 'Manage predefined product attributes and values') }}</p>
      </div>
      <button class="header-add-btn" type="button" @click="openAttributeModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة خاصية', 'Add Attribute') }}
      </button>
    </div>

    <!-- Add Attribute Modal -->
    <div class="modal-overlay" v-if="showAttributeModal" @click.self="closeAttributeModal">
      <div class="modal-content form-modal">
        <button class="modal-close" @click="closeAttributeModal">×</button>
        <div class="form-header"><div class="modal-heading-row"><div v-if="!editingAttributeId" class="header-icon-main"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><h3 class="modal-title-main">{{ editingAttributeId ? tx('تعديل خاصية منتج', 'Edit Product Attribute') : tx('إضافة خاصية منتج', 'Add Product Attribute') }}</h3></div><p class="modal-subtitle-main">{{ editingAttributeId ? tx('عدّل اسم الخاصية — القيم تُدار من زر إدارة القيم', 'Edit the attribute name; values are managed separately') : tx('أضف الخاصية ثم أضف قيمها من زر إدارة القيم. أي قيمة بكود لون تظهر كدائرة لون تلقائياً', 'Add the attribute, then add its values. Any value with a color code shows as a color circle automatically') }}</p></div>
        <form class="value-form" @submit.prevent="submitAttribute">
          <div class="form-group"><label class="form-label">{{ tx('الاسم بالعربي', 'Name (Arabic)') }} *</label><input v-model="attributeForm.name_ar" class="form-control" required :placeholder="tx('مثال: اللون', 'Example: Color')" /></div>
          <div class="form-group"><label class="form-label">{{ tx('الاسم بالإنجليزية', 'Name (English)') }} *</label><input v-model="attributeForm.name_en" class="form-control" required placeholder="Example: Color" /></div>
          <label class="core-toggle" data-testid="attribute-core-toggle">
            <input type="checkbox" v-model="attributeForm.is_core" />
            <span class="core-toggle-text">
              <strong>{{ tx('خاصية أساسية', 'Core attribute') }}</strong>
              <small>{{ tx('تظهر أولًا عند إضافة منتج، ولازم تختار لها قيمة واحدة أو «غير متوفر». مثل: اللون، الحجم، السعة.', 'Shown first when adding a product; one value (or «Not available») must be picked. E.g. colour, size, capacity.') }}</small>
            </span>
          </label>
          <div class="form-actions">
            <button class="btn-cancel" type="button" @click="closeAttributeModal">{{ tx('إلغاء', 'Cancel') }}</button>
            <button class="btn-submit" type="submit" :disabled="isSubmitting">{{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (editingAttributeId ? tx('حفظ التعديلات', 'Save changes') : tx('حفظ الخاصية', 'Save attribute')) }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-name">{{ tx('الخاصية', 'Attribute') }}</th>
            <th class="col-values">{{ tx('القيم المتوفرة', 'Available values') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row">
            <td colspan="4">{{ tx('جاري التحميل...', 'Loading...') }}</td>
          </tr>
          <tr v-else-if="attributes.length === 0" class="state-row">
            <td colspan="4">{{ tx('لا توجد خصائص مضافة مسبقاً', 'No attributes added yet') }}</td>
          </tr>
          <template v-else>
            <tr v-for="attr in attributes" :key="attr.id" class="data-row">
              <td class="col-name">
                <div class="attr-name-cell">
                  <div class="attr-text">
                    <span class="attr-title">{{ attributeName(attr) }} <span v-if="isCore(attr)" class="core-badge" data-testid="core-badge">{{ tx('أساسية', 'Core') }}</span></span>
                    <span v-if="!isEnglish" class="attr-desc">{{ secondaryAttributeName(attr) }}</span>
                  </div>
                </div>
              </td>
              <td class="col-values">
                <div class="values-chips">
                  <!-- Show up to 5 values -->
                  <span v-for="val in attr.values.slice(0, 5)" :key="val.id" class="value-chip" :class="{ 'inactive-chip': !val.is_active }">
                    <span v-if="colorOf(val)" class="color-dot" :style="{ background: colorOf(val) }"></span>
                    <span class="value-chip-labels"><span>{{ valueName(val) }}</span><small v-if="!isEnglish && secondaryValueName(val)">{{ secondaryValueName(val) }}</small></span>
                  </span>
                  <span v-if="attr.values.length > 5" class="value-chip more-chip">
                    +{{ attr.values.length - 5 }}
                  </span>
                  <span v-if="attr.values.length === 0" class="no-values-text">{{ tx('لا توجد قيم يرجى الإضافة', 'No values; please add one') }}</span>
                </div>
              </td>
              <td class="col-status">
                <span class="status-badge" :class="attr.is_active ? 'active' : 'inactive'">
                  {{ attr.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn view-btn" @click="openManageModal(attr)" :title="tx('إدارة القيم', 'Manage values')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                  <button class="action-btn edit-btn" @click="openEditAttributeModal(attr)" :title="tx('تعديل الخاصية', 'Edit attribute')" :aria-label="tx('تعديل الخاصية', 'Edit attribute')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn add-value-btn" @click="openAddValueModal(attr)" :title="tx('إضافة قيمة جديدة', 'Add value')" :aria-label="tx('إضافة قيمة جديدة', 'Add value')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <button class="action-btn delete-btn" @click="deleteAttributeItem(attr)" :title="tx('حذف الخاصية', 'Delete attribute')" :aria-label="tx('حذف الخاصية', 'Delete attribute')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <!-- Add/Edit Value Modal -->
    <div class="modal-overlay" v-if="showValueModal" @click.self="closeValueModal">
      <div class="modal-content form-modal">
        <button class="modal-close" @click="closeValueModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header"><h3 class="modal-title-main">{{ isEditingValue ? tx('تعديل قيمة خاصية', 'Edit Attribute Value') : tx('إضافة قيمة جديدة', 'Add New Value') }}</h3><p class="modal-subtitle-main">{{ tx('أدخل اسم القيمة بالعربي والإنجليزي ليتم حفظها في الـ API', 'Enter the Arabic and English value names to save them to the API') }}</p></div>
        
        <form @submit.prevent="submitValue" class="value-form">
          
          <!-- Binding (Readonly) -->
          <div class="form-group">
            <label class="form-label">{{ tx('الارتباط', 'Attribute') }} <span class="req">*</span></label>
            <div class="readonly-input">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>{{ attributeName(selectedAttribute) }}<template v-if="!isEnglish"> ({{ secondaryAttributeName(selectedAttribute) }})</template></span>
            </div>
          </div>

          <!-- Value code: a color code (#hex or rgb) turns the value into a color circle -->
          <div class="form-group">
            <label class="form-label">{{ tx('قيمة الخيار (اختياري)', 'Option value (optional)') }}</label>
            <div class="color-picker-wrapper">
              <span class="color-preview" :class="{ empty: !valueColor }" :style="valueColor ? { background: valueColor } : {}"></span>
              <input type="text" v-model="valueForm.color" class="form-control color-text-input" placeholder="#660033 / rgb(102, 0, 51)" dir="ltr" />
              <input type="color" :value="valueColor || '#000000'" class="color-picker-input" @input="valueForm.color = $event.target.value" />
            </div>
            <span class="help-text">{{ valueColor ? tx('هذه القيمة لون، وستظهر كدائرة لون.', 'This value is a color and will show as a color circle.') : tx('لو كتبت كود لون (Hex أو RGB) تظهر القيمة كدائرة لون، وغير ذلك تُحفظ كما هي.', 'Type a color code (Hex or RGB) to show a color circle; anything else is saved as typed.') }}</span>
          </div>

          <!-- Bilingual Value Names -->
          <div class="form-group">
            <label class="form-label">{{ tx('اسم القيمة بالعربي', 'Value name (Arabic)') }} <span class="req">*</span></label>
            <input type="text" v-model="valueForm.name_ar" class="form-control" :placeholder="tx('مثال: أسود ملكي أو 90 سم', 'Example: Royal Black or 90 cm')" required />
          </div>
          <div class="form-group">
            <label class="form-label">{{ tx('اسم القيمة بالإنجليزية', 'Value name (English)') }} <span class="req">*</span></label>
            <input type="text" v-model="valueForm.name_en" class="form-control" placeholder="Example: Royal Black or 90 cm" dir="ltr" required />
          </div>

          <!-- Status -->
          <div class="form-group">
            <label class="form-label">{{ tx('الحالة', 'Status') }}</label>
            <div class="select-wrapper">
              <select v-model="valueForm.is_active" class="form-control">
                <option :value="true">{{ tx('نشط', 'Active') }}</option>
                <option :value="false">{{ tx('غير نشط', 'Inactive') }}</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="select-icon"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeValueModal">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEditingValue ? tx('تحديث القيمة', 'Update value') : tx('إضافة القيمة', 'Add value')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Manage Values Modal -->
    <div class="modal-overlay" v-if="showManageModal" @click.self="closeManageModal">
      <div class="modal-content manage-content">
        <button class="modal-close" @click="closeManageModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <h3 class="modal-title">{{ tx('القيم الخاصة بـ:', 'Values for:') }} {{ attributeName(selectedAttribute) }}</h3>
        <p class="modal-subtitle">{{ tx('عرض القيم المتاحة ليتم تعيينها لخيارات المنتجات', 'Manage values available for product options') }}</p>
        
        <div class="manage-list">
          <div class="manage-list-empty" v-if="selectedAttribute?.values?.length === 0">
            {{ tx('لا توجد قيم حالياً. استخدم الزر الخاص بالإضافة من الجدول.', 'No values yet. Use the add button from the table.') }}
          </div>
          
          <div v-for="val in selectedAttribute?.values" :key="val.id" class="manage-item">
            <div class="manage-item-info">
              <span class="status-dot" :class="val.is_active ? 'active-dot' : 'inactive-dot'"></span>
              <span class="manage-item-labels"><span class="manage-item-label">{{ valueName(val) }}</span><small v-if="!isEnglish && secondaryValueName(val)">{{ secondaryValueName(val) }}</small></span>
              <div v-if="colorOf(val)" class="manage-item-color" :style="{ background: colorOf(val) }"></div>
            </div>
            
            <div class="manage-item-actions">
              <button class="manage-btn edit-val-btn" @click="editValueItem(val)" :title="tx('تعديل', 'Edit')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="manage-btn delete-val-btn" @click="deleteValueItem(val)" :title="tx('حذف', 'Delete')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="manage-footer">
          <button class="btn-cancel" @click="closeManageModal">{{ tx('إغلاق', 'Close') }}</button>
        </div>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" :class="[alertType, { show: showAlert }]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <path v-if="alertType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline v-if="alertType === 'success'" points="22 4 12 14.01 9 11.01"/>
        <circle v-if="alertType === 'error'" cx="12" cy="12" r="10"/><line v-if="alertType === 'error'" x1="12" y1="8" x2="12" y2="12"/><line v-if="alertType === 'error'" x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdminText } from '../composables/useAdminText';
import productAttributeService from '../services/productAttributeService';
import { parseColorCode } from '../domain/catalog/adminCatalog';
import { loadSavedCoreIds, resolveCoreIds, saveCoreIds } from '../services/coreAttributes';

const { locale } = useI18n();
const { tx } = useAdminText();
const isEnglish = computed(() => locale.value === 'en');

const attributeName = (attribute) => {
  if (!attribute) return '';
  return isEnglish.value
    ? attribute.translations?.en?.name || attribute.name_en || attribute.name || attribute.label
    : attribute.translations?.ar?.name || attribute.name_ar || attribute.label || attribute.name;
};

const secondaryAttributeName = (attribute) => {
  if (!attribute) return '';
  return isEnglish.value
    ? attribute.translations?.ar?.name || attribute.name_ar || attribute.label || ''
    : attribute.translations?.en?.name || attribute.name_en || attribute.name || '';
};

const valueName = (value) => {
  if (!value) return '';
  return isEnglish.value
    ? value.name_en || value.translations?.en?.name || value.label || value.name_ar
    : value.name_ar || value.translations?.ar?.name || value.label || value.name_en;
};

const secondaryValueName = (value) => {
  if (!value) return '';
  return isEnglish.value
    ? value.name_ar || value.translations?.ar?.name || value.label || ''
    : value.name_en || value.translations?.en?.name || value.label || '';
};

const attributes = ref([]);
const loading = ref(false);

const selectedAttribute = ref(null);

// Forms
const showValueModal = ref(false);
const isEditingValue = ref(false);
const isSubmitting = ref(false);
const currentEditValueId = ref(null);
const valueForm = ref({
  name_ar: '',
  name_en: '',
  label: '',
  color: '',
  is_active: true
});

const showManageModal = ref(false);
const showAttributeModal = ref(false);
const attributeForm = ref({ name_ar: '', name_en: '', label_ar: '', label_en: '', type: 'text', is_active: true, sort_order: 1 });

// Alerts
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');
const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

// Core attributes («أساسية»): ids saved in the settings API (core_attribute_ids).
const savedCoreIds = ref(null);
const coreIds = computed(() => resolveCoreIds(savedCoreIds.value, attributes.value));
const isCore = (attr) => coreIds.value.includes(String(attr.id));
const loadCoreIds = async () => {
  try { savedCoreIds.value = await loadSavedCoreIds(); } catch { /* falls back to colour / capacity / size */ }
};
const setCore = async (attrId, makeCore) => {
  const id = String(attrId);
  const current = coreIds.value;
  if (makeCore === current.includes(id)) return;
  savedCoreIds.value = await saveCoreIds(makeCore ? [...current, id] : current.filter((item) => item !== id));
};

const fetchAttributes = async () => {
  loading.value = true;
  try {
    const [list] = await Promise.all([productAttributeService.list(), savedCoreIds.value === null ? loadCoreIds() : null]);
    attributes.value = list;
    
    // update selectedAttribute if its open
    if (selectedAttribute.value) {
      const updated = attributes.value.find(a => a.id === selectedAttribute.value.id);
      if (updated) {
        selectedAttribute.value = updated;
      }
    }
  } catch {
    triggerAlert('فشل جلب الخصائص', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAttributes();
});

// A value is a color when its code is one (#hex / rgb); there is no separate "color" attribute type to pick.
const colorOf = (val) => parseColorCode(val?.color);
const valueColor = computed(() => parseColorCode(valueForm.value.color));

// Value Form Actions
const openAddValueModal = (attr) => {
  selectedAttribute.value = attr;
  isEditingValue.value = false;
  currentEditValueId.value = null;
  valueForm.value = { name_ar: '', name_en: '', label: '', color: '', is_active: true };
  showValueModal.value = true;
};

const closeValueModal = () => {
  showValueModal.value = false;
  selectedAttribute.value = null;
};

const editingAttributeId = ref(null);

const openEditAttributeModal = (attr) => {
  editingAttributeId.value = attr.id;
  attributeForm.value = {
    name_ar: attr.translations?.ar?.name || attr.name || '',
    name_en: attr.translations?.en?.name || attr.name || '',
    // Kept as it is: the type is no longer chosen by hand.
    type: attr.type === 'color' ? 'color' : 'text',
    is_core: isCore(attr),
  };
  showAttributeModal.value = true;
};

const openAttributeModal = () => {
  editingAttributeId.value = null;
  attributeForm.value = { name_ar: '', name_en: '', label_ar: '', label_en: '', type: 'text', is_active: true, sort_order: attributes.value.length + 1, is_core: false };
  showAttributeModal.value = true;
};

const closeAttributeModal = () => { showAttributeModal.value = false; };

const submitAttribute = async () => {
  isSubmitting.value = true;
  try {
    const { is_core: makeCore, ...attributeFields } = attributeForm.value;
    let savedId = editingAttributeId.value;
    if (editingAttributeId.value) {
      await productAttributeService.update(editingAttributeId.value, attributeFields);
    } else {
      const created = await productAttributeService.create({
        ...attributeFields,
        label_ar: attributeFields.label_ar || `اختر ${attributeFields.name_ar}`,
        label_en: attributeFields.label_en || `Select ${attributeFields.name_en}`,
      });
      savedId = created?.id ?? null;
    }
    if (savedId) {
      try {
        await setCore(savedId, Boolean(makeCore));
      } catch (error) {
        triggerAlert(apiErrorMessage(error, 'تم حفظ الخاصية، لكن تعذر حفظ كونها أساسية'), 'error');
      }
    }
    const wasEdit = Boolean(editingAttributeId.value);
    closeAttributeModal();
    await fetchAttributes();
    triggerAlert(wasEdit ? 'تم تحديث الخاصية بنجاح' : 'تم إضافة الخاصية بنجاح');
  } catch (error) {
    triggerAlert(apiErrorMessage(error, 'تعذر حفظ الخاصية'), 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const submitValue = async () => {
  if (!selectedAttribute.value) return;
  isSubmitting.value = true;
  try {
    const nameAr = String(valueForm.value.name_ar || '').trim();
    const nameEn = String(valueForm.value.name_en || '').trim();
    if (!nameAr || !nameEn) {
      triggerAlert('اسم القيمة بالعربي والإنجليزي مطلوب', 'error');
      return;
    }
    const payload = { ...valueForm.value, name_ar: nameAr, name_en: nameEn, label: nameAr };
    if (!payload.color) payload.color = null;

    if (isEditingValue.value) {
      await productAttributeService.updateValue(selectedAttribute.value.id, currentEditValueId.value, payload);
      triggerAlert('تم تحديث القيمة بنجاح');
    } else {
      await productAttributeService.createValue(selectedAttribute.value.id, payload);
      triggerAlert('تم إضافة القيمة بنجاح');
    }
    const attr = selectedAttribute.value;
    closeValueModal();
    // The first color value makes the attribute a color one on the server too (the storefront reads that type).
    if (parseColorCode(payload.color) && attr.type !== 'color') {
      await productAttributeService.update(attr.id, {
        name_ar: attr.translations?.ar?.name || attr.name || '',
        name_en: attr.translations?.en?.name || attr.name || '',
        type: 'color',
      }).catch(() => {});
    }
    // Keep the manage modal/list in sync with the server before showing success.
    await fetchAttributes();
  } catch (error) {
    const msg = apiErrorMessage(error, 'حدث خطأ أثناء الحفظ');
    triggerAlert(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Manage Values Modal Actions
const openManageModal = (attr) => {
  selectedAttribute.value = attr;
  showManageModal.value = true;
};

const closeManageModal = () => {
  showManageModal.value = false;
  selectedAttribute.value = null;
};

const editValueItem = (val) => {
  // Can open the form over the manage modal
  // Close the manage layer first so it cannot intercept the edit form controls.
  showManageModal.value = false;
  isEditingValue.value = true;
  currentEditValueId.value = val.id;
  valueForm.value = {
    name_ar: val.name_ar || val.translations?.ar?.name || val.label || '',
    name_en: val.name_en || val.translations?.en?.name || val.label || '',
    label: val.label || '',
    color: val.color || '',
    is_active: val.is_active
  };
  showValueModal.value = true;
};

const deleteAttributeItem = async (attr) => {
  if (!confirm(`هل أنت متأكد من حذف الخاصية "${attr.name}"؟`)) return;

  try {
    await productAttributeService.delete(attr.id);
    await fetchAttributes();
    const stillExists = attributes.value.some((item) => Number(item.id) === Number(attr.id));
    if (stillExists) {
      triggerAlert('تعذر حذف الخاصية. تم تسجيل تذكرة لمراجعة خطأ Backend.', 'error');
      return;
    }
    triggerAlert('تم حذف الخاصية بنجاح');
  } catch (error) {
    await fetchAttributes();
    triggerAlert(apiErrorMessage(error, 'تعذر حذف الخاصية. تم تسجيل تذكرة لمراجعة خطأ Backend.'), 'error');
  }
};

const deleteValueItem = async (val) => {
  if (confirm(`هل أنت متأكد من إزالة القيمة "${val.label}"؟`)) {
    try {
      await productAttributeService.deleteValue(selectedAttribute.value.id, val.id);
      const attributeId = selectedAttribute.value.id;
      selectedAttribute.value.values = selectedAttribute.value.values.filter((item) => String(item.id) !== String(val.id));
      await fetchAttributes();
      const refreshed = attributes.value.find((attribute) => Number(attribute.id) === Number(attributeId));
      const stillExists = refreshed?.values?.some((item) => String(item.id) === String(val.id));
      if (stillExists) {
        triggerAlert('تعذر حذف قيمة الخاصية. تم تسجيل تذكرة لمراجعة خطأ Backend.', 'error');
        return;
      }
      triggerAlert('تم إزالة القيمة بنجاح');
    } catch (error) {
      const msg = apiErrorMessage(error, 'تعذر إزالة القيمة');
      await fetchAttributes();
      triggerAlert(msg, 'error');
    }
  }
};

</script>

<style scoped>
.core-toggle { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafafa; cursor: pointer; margin-bottom: 1rem; }
.core-toggle input { margin-top: 3px; accent-color: #660033; width: 16px; height: 16px; flex-shrink: 0; }
.core-toggle-text { display: flex; flex-direction: column; gap: 3px; }
.core-toggle-text strong { font-size: 0.9rem; color: #111827; }
.core-toggle-text small { font-size: 0.75rem; color: #6b7280; line-height: 1.5; }
.core-badge { display: inline-block; margin-inline-start: 6px; padding: 1px 8px; border-radius: 999px; background: #660033; color: #fff; font-size: 0.68rem; font-weight: 700; vertical-align: middle; }
:global(.dark) .core-toggle { background: #1e293b; border-color: #334155; }
:global(.dark) .core-toggle-text strong { color: #e2e8f0; }

.attributes-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  direction: inherit;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  padding-bottom: 2rem;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.2rem;
}
.page-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
}
.add-btn,
.header-add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #660033;
  color: #fff;
  border: none;
  padding: 0.65rem 1.1rem;
  border-radius: 8px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover,
.header-add-btn:hover {
  background: #4d0026;
}

/* Table */
.table-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 1.1rem;
  text-align: right; /* RTL */
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.data-table th {
  background: #f9fafb;
  font-size: 0.78rem;
  font-weight: 700;
  color: #6b7280;
  white-space: nowrap;
}
.data-table td {
  font-size: 0.85rem;
  color: #374151;
}
.data-table tr:last-child td { border-bottom: none; }
.data-row:hover td { background: #fafafa; }
.state-row td { text-align: center; color: #6b7280; padding: 2rem; }

/* Columns alignment */
.col-name { text-align: right; width: 35%; }
.col-values { text-align: right; width: 40%; }
.col-status { text-align: center; width: 10%; }
.col-actions { text-align: left; width: 15%; padding-left: 1.5rem !important; }

.attr-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.attr-text {
  display: flex;
  flex-direction: column;
}
.attr-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.2rem;
}
.attr-desc {
  font-size: 0.75rem;
  color: #9ca3af;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.inactive { background: #f3f4f6; color: #4b5563; }

.values-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.value-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
}
.value-chip-labels {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
}
.value-chip-labels small {
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 500;
  direction: ltr;
}
.inactive-chip {
  opacity: 0.6;
  text-decoration: line-through;
}
.color-dot {
  width: 14px; height: 14px; border-radius: 50%; display: inline-block;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset;
}
.more-chip {
  background: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}
.no-values-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

.actions-group {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* items on left for RTL table */
  gap: 0.5rem;
}
.action-btn {
  width: 28px; height: 28px;
  border-radius: 6px; border: none; background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #9ca3af; transition: all 0.2s;
}
.action-btn:hover { background: #f3f4f6; color: #111827; }
.action-btn.add-value-btn { color: #660033; }
.action-btn.add-value-btn:hover { background: #f3f4f6; color: #660033; }
.view-btn { color: #f59e0b; }
.view-btn:hover { background: #fef3c7; color: #d97706; }
.delete-btn { color: #dc2626; }
.delete-btn:hover { background: #fef2f2; color: #b91c1c; }

/* Modals */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal-content {
  background: #fff; border-radius: 12px; width: 100%; max-width: 480px;
  padding: 2rem; position: relative; max-height: 90vh; overflow-y: auto;
}
.modal-close {
  position: absolute; top: 1.2rem; left: 1.2rem;
  background: none; border: none; color: #9ca3af; cursor: pointer;
  transition: color 0.2s;
}
.modal-close:hover { color: #111827; }
.modal-title { font-size: 1.2rem; font-weight: 800; color: #111827; text-align: center; margin-bottom: 0.2rem; }
.modal-subtitle { font-size: 0.8rem; color: #6b7280; text-align: center; margin-bottom: 1.5rem; }

.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #374151; margin-bottom: 0.4rem; text-align: right; }
.req { color: #dc2626; }
.form-control {
  width: 100%; padding: 0.65rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 8px;
  font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #1f2937; outline: none; transition: border-color 0.2s; text-align: right;
}
.form-control:focus { border-color: #660033; box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06); }

.select-wrapper { position: relative; display: flex; align-items: center; }
.select-wrapper .form-control { appearance: none; padding-left: 2rem; cursor: pointer; }
.select-wrapper .select-icon { position: absolute; left: 0.8rem; color: #9ca3af; pointer-events: none; }

.readonly-input {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.8rem;
  background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; color: #6b7280; font-size: 0.85rem; font-weight: 600;
}

.color-picker-wrapper {
  display: flex; gap: 0.5rem; align-items: center;
}
.color-text-input { flex: 1; direction: ltr; text-align: left; }
.color-preview { width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.15); }
.color-preview.empty { background: repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 10px 10px; }
.color-picker-input {
  width: 42px; height: 38px; padding: 0; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer;
}
.help-text { display: block; margin-top: 0.3rem; font-size: 0.7rem; color: #9ca3af; }

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
}
.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #660033;
  color: #ffffff;
  border: 1px solid #660033;
  padding: 6px 14px;
  border-radius: 6px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  min-width: 90px;
}
.btn-submit:hover:not(:disabled) {
  background: #4d0026;
  border-color: #4d0026;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Manage Modal List */
.manage-list {
  display: flex; flex-direction: column; gap: 0.5rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; background: #fafafa;
  max-height: 300px; overflow-y: auto; margin-bottom: 1.5rem;
}
.manage-list-empty { padding: 2rem; text-align: center; color: #9ca3af; font-size: 0.85rem; }
.manage-item {
  display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 0.6rem 0.8rem;
  border: 1px solid #f3f4f6; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.manage-item-info { display: flex; align-items: center; gap: 0.6rem; }
.manage-item-labels { display: flex; flex-direction: column; gap: 0.1rem; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.active-dot { background: #10b981; }
.inactive-dot { background: #d1d5db; }
.manage-item-label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.manage-item-labels small { color: #6b7280; font-size: 0.7rem; direction: ltr; }
.manage-item-color { width: 18px; height: 18px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.1); }
.manage-item-actions { display: flex; align-items: center; gap: 0.3rem; }
.manage-btn {
  background: none; border: none; color: #9ca3af; cursor: pointer; padding: 0.3rem; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
}
.edit-val-btn:hover { background: #eff6ff; color: #2563eb; }
.delete-val-btn:hover { background: #fef2f2; color: #dc2626; }

.manage-footer {
  display: flex;
  justify-content: flex-end;
}
.btn-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 6px 14px;
  border-radius: 6px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  min-width: 70px;
}
.btn-cancel:hover {
  background: #e5e7eb;
  color: #111827;
}

/* Alert */
.alert-icon { flex-shrink: 0; }

/* ===== Unified form-modal design (matches "إنشاء عرض جديد") ===== */
.modal-overlay:has(.form-modal) { z-index: 1000; backdrop-filter: blur(4px); }
.modal-content.form-modal { max-width: 650px; padding: 0; border-radius: 20px; box-shadow: 0 25px 70px rgba(0,0,0,0.25); max-height: 95vh; overflow-y: auto; }
.modal-content.form-modal.form-content { max-width: 700px; }
.form-modal .modal-close { top: 1.5rem; left: 1.5rem; background: #f3f4f6; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; color: #9ca3af; font-size: 1.2rem; line-height: 1; }
.form-modal .form-header { text-align: center; padding: 2rem 2rem 1.5rem 2rem; position: relative; }
.form-modal .modal-heading-row { display: flex; align-items: center; justify-content: center; gap: 0.65rem; direction: inherit; }
.form-modal .header-icon-main { width: 38px; height: 38px; background: #f3f4f6; color: #660033; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.form-modal .modal-title-main { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0; }
.form-modal .modal-subtitle-main { font-size: 0.85rem; color: #9ca3af; margin-top: 0.4rem; }
.form-modal .cat-form, .form-modal .prod-form, .form-modal .value-form { padding: 0 2.5rem 2.5rem 2.5rem; }
.form-modal .i18n-toggle { display: flex; width: fit-content; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; margin: 0 auto 1.1rem; }
.form-modal .i18n-btn { padding: 0.4rem 0.9rem; font-weight: 800; font-size: 0.85rem; min-width: 96px; font-family: 'IBM Plex Sans Arabic', sans-serif; }
.form-modal .modal-tabs { margin: 0 2.5rem 1.5rem; }
.form-modal .form-group { margin-bottom: 1.5rem; }
.form-modal .form-label { font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem; }
.form-modal .form-control { padding: 0.8rem 1rem; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; transition: 0.2s; }
.form-modal .form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(0,0,0,0.08); }
.form-modal .image-upload-box, .form-modal .upload-box { border: 2px dashed #e5e7eb; border-radius: 12px; background: #f9fafb; }
.form-modal .image-upload-box:hover, .form-modal .upload-box:hover { border-color: #660033; background: #fff; }
.form-modal .form-actions { margin-top: 2rem; display: flex; gap: 1rem; justify-content: stretch; align-items: stretch; }
.form-modal .btn-cancel { flex: 1; width: auto; padding: 0.85rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.form-modal .btn-submit { flex: 2; width: auto; min-width: 0; padding: 0.85rem; border-radius: 10px; border: none; background: #660033; color: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.form-modal .btn-submit:hover:not(:disabled) { background: #4d0026; }
.form-modal .btn-submit:disabled { opacity: 0.6; }
@media (max-width: 600px) { .form-modal .cat-form, .form-modal .prod-form, .form-modal .value-form { padding: 0 1.25rem 1.5rem; } .form-modal .modal-tabs { margin: 0 1.25rem 1.5rem; } }
</style>
