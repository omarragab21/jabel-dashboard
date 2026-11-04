<template>
  <div class="discounts-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <div class="tag-icon-wrapper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
        <div>
          <h2 class="page-title">{{ tx('أكواد الخصم', 'Discount Codes') }}</h2>
          <p class="page-subtitle">{{ tx('إدارة أكواد الخصم والعروض الترويجية', 'Manage discount codes and promotions') }}</p>
        </div>
      </div>
      <button class="add-btn" data-testid="add-code" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة كود جديد', 'Add new code') }}
      </button>
    </div>

    <!-- Search -->
    <div class="search-card">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن كود...', 'Search for a code...')" class="search-input" data-testid="search" />
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-code">{{ tx('الكود', 'Code') }}</th>
            <th>{{ tx('نوع الخصم', 'Discount type') }}</th>
            <th>{{ tx('قيمة الخصم', 'Discount value') }}</th>
            <th>{{ tx('الحد الأدنى', 'Minimum') }}</th>
            <th>{{ tx('الاستخدام', 'Usage') }}</th>
            <th>{{ tx('تاريخ البداية', 'Start date') }}</th>
            <th>{{ tx('تاريخ النهاية', 'End date') }}</th>
            <th>{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="9">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredOffers.length === 0" class="state-row"><td colspan="9">{{ tx('لا توجد أكواد خصم مطابقة', 'No matching discount codes found') }}</td></tr>
          <template v-else>
            <tr v-for="offer in filteredOffers" :key="offer.id" class="data-row" :data-code="offer.code">
              <td class="col-code">
                <div class="code-cell">
                  <span class="code-badge">{{ offer.code || '-' }}</span>
                  <button v-if="offer.code" class="copy-tiny" type="button" :title="tx('نسخ الكود', 'Copy code')" @click.stop="copyText(offer.code)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </td>
              <td class="muted">{{ formatType(offer.type) }}</td>
              <td class="value-cell">{{ formatValue(offer) }}</td>
              <td>{{ offer.minimum_amount ? formatMoney(offer.minimum_amount) : '—' }}</td>
              <td class="col-used">
                <div class="usage">
                  <div class="usage-bar-bg" v-if="offer.max_uses">
                    <div class="usage-bar-fill" :style="{ width: Math.min(100, Number(offer.usage_percentage) || 0) + '%' }"></div>
                  </div>
                  <span class="usage-text">{{ offer.total_uses || 0 }}<template v-if="offer.max_uses">/{{ offer.max_uses }}</template></span>
                </div>
              </td>
              <td class="muted">{{ formatDate(offer.start_date) }}</td>
              <td class="muted">{{ formatDate(offer.end_date) }}</td>
              <td>
                <span :class="['status-badge-table', offer.status]">{{ formatStatus(offer.status) }}</span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn delete-btn" type="button" data-testid="delete-code" @click="confirmDelete(offer)" :title="tx('حذف', 'Delete')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                  <button class="action-btn view-btn" type="button" data-testid="view-code" @click="openViewModal(offer)" :title="tx('عرض', 'View')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Add / View / Edit -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="showFormModal = false">
      <div class="modal-content form-content" role="dialog" aria-modal="true">
        <button class="modal-close" type="button" @click="showFormModal = false" :aria-label="tx('إغلاق', 'Close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header">
          <h3 class="modal-title-main">{{ isView ? tx('تفاصيل كود الخصم', 'Discount code details') : (isEdit ? tx('تعديل كود الخصم', 'Edit discount code') : tx('إضافة كود خصم جديد', 'Add a new discount code')) }}</h3>
          <p class="modal-subtitle-main">{{ isView ? tx('عرض البيانات فقط — للتعديل اضغط تعديل', 'Read-only view — press Edit to make changes') : (isEdit ? tx('عدّل تفاصيل الكود', 'Update the code details') : tx('أدخل تفاصيل الكود الجديد', 'Enter the new code details')) }}</p>
        </div>

        <form @submit.prevent="submitForm" class="offer-form">
          <fieldset class="form-fieldset" :disabled="isView">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="dc-code">{{ tx('الكود', 'Code') }}</label>
                <input id="dc-code" type="text" v-model="form.code" class="form-control ltr-text code-input" autocomplete="off" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="dc-value">{{ tx('قيمة الخصم', 'Discount value') }}</label>
                <div class="input-unit">
                  <input id="dc-value" type="number" step="0.01" min="0.01" :max="form.type === 'percentage' ? 100 : undefined" v-model="form.value" class="form-control" required />
                  <span class="unit">{{ form.type === 'percentage' ? '%' : cur }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="dc-type">{{ tx('نوع الخصم', 'Discount type') }}</label>
                <div class="select-wrapper">
                  <select id="dc-type" v-model="form.type" class="form-control">
                    <option value="percentage">{{ tx('نسبة مئوية', 'Percentage') }}</option>
                    <option value="fixed">{{ tx('قيمة ثابتة', 'Fixed amount') }}</option>
                  </select>
                  <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="dc-min">{{ tx('الحد الأدنى للشراء', 'Minimum purchase') }}</label>
                <div class="input-unit">
                  <input id="dc-min" type="number" step="0.01" min="0" v-model="form.min_order_value" class="form-control" />
                  <span class="unit">{{ cur }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="dc-maxd">{{ tx('الحد الأقصى للخصم', 'Maximum discount') }}</label>
                <div class="input-unit">
                  <input id="dc-maxd" type="number" step="0.01" min="0" v-model="form.max_discount" class="form-control" :disabled="form.type !== 'percentage'" :title="form.type !== 'percentage' ? tx('يُستخدم مع النسبة المئوية فقط', 'Only used with a percentage discount') : ''" />
                  <span class="unit">{{ cur }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="dc-uses">{{ tx('الحد الأقصى للاستخدام', 'Maximum uses') }}</label>
                <input id="dc-uses" type="number" step="1" min="1" inputmode="numeric" v-model="form.max_uses" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label" for="dc-start">{{ tx('تاريخ البداية', 'Start date') }}</label>
                <input id="dc-start" type="date" lang="en-GB" v-model="form.start_date" class="form-control date-control" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="dc-end">{{ tx('تاريخ الانتهاء', 'End date') }}</label>
                <input id="dc-end" type="date" lang="en-GB" v-model="form.end_date" class="form-control date-control" />
              </div>

              <div class="form-group">
                <label class="form-label" for="dc-status">{{ tx('الحالة', 'Status') }}</label>
                <div class="select-wrapper">
                  <select id="dc-status" v-model="form.is_active" class="form-control">
                    <option :value="true">{{ tx('نشط', 'Active') }}</option>
                    <option :value="false">{{ tx('غير نشط', 'Inactive') }}</option>
                  </select>
                  <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>
          </fieldset>

          <div class="lang-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
              <div class="i18n-toggle" role="tablist" aria-label="Language" dir="ltr">
                <button type="button" class="i18n-btn" :class="{ active: activeLang === 'en' }" @click="activeLang = 'en'">English</button>
                <button type="button" class="i18n-btn" :class="{ active: activeLang === 'ar' }" @click="activeLang = 'ar'">العربية</button>
              </div>
            </div>

          <fieldset class="form-fieldset" :disabled="isView">
            <div class="form-group">
              <label class="form-label" for="dc-desc">{{ tx('وصف الكود', 'Code description') }}</label>
              <input v-show="activeLang === 'ar'" id="dc-desc" type="text" v-model="form.description_ar" class="form-control" placeholder="مثال: خصم 25% على الطلبات فوق 100 د.أ" />
              <input v-show="activeLang === 'en'" type="text" v-model="form.description_en" class="form-control" placeholder="e.g. 25% off on orders over 100 JOD" dir="ltr" />
            </div>
          </fieldset>

          <div class="form-footer-btns">
            <button type="button" class="btn-cancel-form" @click="showFormModal = false">{{ isView ? tx('إغلاق', 'Close') : tx('إلغاء', 'Cancel') }}</button>
            <button v-if="isView" type="button" class="btn-submit-form" @click="openEditModal(viewedOffer)">{{ tx('تعديل', 'Edit') }}</button>
            <button v-else type="submit" class="btn-submit-form" :disabled="isSubmitting">
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEdit ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة الكود', 'Add code')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div class="modal-overlay" v-if="deleteTarget" @click.self="cancelDelete">
      <div class="modal-content delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-offer-title">
        <h2 id="delete-offer-title">{{ tx('تأكيد الحذف', 'Confirm deletion') }}</h2>
        <p>{{ tx(`هل أنت متأكد من حذف كود الخصم "${deleteTarget.code}"؟ لا يمكن التراجع عن هذا الإجراء.`, `Are you sure you want to delete the discount code "${deleteTarget.code}"? This action cannot be undone.`) }}</p>
        <div class="delete-footer">
          <button class="btn-delete-confirm" type="button" data-testid="confirm-delete" :disabled="isDeleting" @click="executeDelete">
            <span v-if="isDeleting" class="delete-spinner" aria-hidden="true"></span>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            {{ isDeleting ? tx('جاري الحذف...', 'Deleting...') : tx('حذف الكود', 'Delete code') }}
          </button>
          <button class="btn-cancel-form" type="button" :disabled="isDeleting" @click="cancelDelete">{{ tx('إلغاء', 'Cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" data-testid="toast" :class="[alertType, { show: showAlert }]">
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
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import adminCatalogService from '../application/adminCatalogService';
import { toDiscountPayload } from '../domain/catalog/adminCatalog';

const { tx, locale } = useAdminText();
const { cur } = useCurrencyLabel();

// States
const offers = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const isSubmitting = ref(false);

// Modals
const showFormModal = ref(false);
const isEdit = ref(false);
const isView = ref(false);
const viewedOffer = ref(null);
const currentId = ref(null);
const deleteTarget = ref(null);
const isDeleting = ref(false);

// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.

const formLang = () => (locale.value === 'en' ? 'en' : 'ar');

const activeLang = ref(formLang());

const initialForm = {
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    type: 'percentage',
    value: '',
    code: '',
    min_order_value: '',
    max_discount: '',
    max_uses: '',
    start_date: '',
    end_date: '',
    no_end_date: false,
    min_order_enabled: false,
    is_active: true
};
const form = ref({ ...initialForm });

const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

// Utils
const formatPrice = (p) => Number(p).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatMoney = (p) => `${formatPrice(p)} ${cur.value}`;
const formatDate = (d) => {
    if (!d) return '-';
    if (d.length <= 10) return d;
    return new Date(d).toISOString().split('T')[0];
};

const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

const formatType = (t) => {
    const map = {
        'percentage': ['نسبة مئوية', 'Percentage'],
        'fixed': ['قيمة ثابتة', 'Fixed amount']
    };
    return map[t] ? tx(...map[t]) : t;
};

const formatValue = (offer) => {
    if (offer.type === 'percentage') return formatPrice(offer.value) + '%';
    if (offer.type === 'fixed') return formatMoney(offer.value);
    return '-';
};

const formatStatus = (s) => {
    const map = {
        'active': ['نشط', 'Active'],
        'paused': ['متوقف', 'Paused'],
        'expired': ['منتهي', 'Expired'],
        'scheduled': ['مجدول', 'Scheduled']
    };
    return map[s] ? tx(...map[s]) : s;
};

const copyText = (txt) => {
  navigator.clipboard.writeText(txt);
  triggerAlert('تم نسخ الكود بنجاح');
};

// Fetch Data
const fetchOffers = async () => {
  loading.value = true;
  try {
    offers.value = await adminCatalogService.listDiscountCodes({ include_inactive: 1, show_all: 1 });
  } catch {
    offers.value = [];
    triggerAlert('فشل تحميل أكواد الخصم من الخادم', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOffers();
});

// Filtering
const filteredOffers = computed(() => {
  return offers.value.filter(o => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return true;
    return [o.code, o.name_i18n?.ar, o.name_i18n?.en, o.name, o.description]
      .some((field) => String(field ?? '').toLowerCase().includes(q));
  });
});

// Actions
const openAddModal = () => {
    isEdit.value = false;
    isView.value = false;
    currentId.value = null;
    form.value = { ...initialForm };
    activeLang.value = formLang();
    showFormModal.value = true;
};

// Maps a listed discount code back to the form shape the payload builder expects.
const toForm = (offer) => {
    const nameObj = offer.name_i18n && typeof offer.name_i18n === 'object' ? offer.name_i18n : null;
    const descObj = offer.description_i18n && typeof offer.description_i18n === 'object' ? offer.description_i18n : null;
    return {
        ...initialForm,
        ...offer,
        name_ar: nameObj?.ar ?? offer.name ?? '',
        name_en: nameObj?.en ?? '',
        description_ar: descObj?.ar ?? offer.description ?? '',
        description_en: descObj?.en ?? '',
        min_order_value: offer.minimum_amount ?? '',
        max_discount: offer.max_discount ?? '',
        max_uses: offer.max_uses ?? '',
        // formatDate shows "-" for a missing date; the form needs an empty value.
        start_date: offer.start_date ? formatDate(offer.start_date) : '',
        end_date: offer.end_date ? formatDate(offer.end_date) : '',
        no_end_date: false,
    };
};

const openEditModal = (offer) => {
    isEdit.value = true;
    isView.value = false;
    currentId.value = offer.id;
    form.value = toForm(offer);
    activeLang.value = formLang();
    showFormModal.value = true;
};

const openViewModal = (offer) => {
    openEditModal(offer);
    viewedOffer.value = offer;
    isView.value = true;
};

const validateOfferForm = (f) => {
    const value = Number(f.value);
    if (!String(f.code || '').trim()) return 'كود الخصم مطلوب';
    if (!Number.isFinite(value) || value <= 0) return 'قيمة الخصم يجب أن تكون أكبر من صفر';
    if (f.type === 'percentage' && value > 100) return 'نسبة الخصم لا يمكن أن تتجاوز 100%';
    if (!f.start_date) return 'تاريخ البدء مطلوب';
    if (f.end_date && f.start_date && f.end_date < f.start_date) return 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء';
    for (const [field, label] of [['min_order_value', 'الحد الأدنى للطلب'], ['max_discount', 'الحد الأقصى للخصم']]) {
        if (f[field] !== '' && f[field] != null && Number(f[field]) < 0) return `${label} لا يمكن أن يكون سالباً`;
    }
    if (f.max_uses !== '' && f.max_uses != null && (!Number.isInteger(Number(f.max_uses)) || Number(f.max_uses) < 1)) {
        return 'الحد الأقصى للاستخدام يجب أن يكون عدداً صحيحاً أكبر من صفر';
    }
    return '';
};

const submitForm = async () => {
    const validationError = validateOfferForm(form.value);
    if (validationError) {
        triggerAlert(validationError, 'error');
        return;
    }

    isSubmitting.value = true;
    try {
        // The design has no name field; a code without a name is listed under its code.
        const code = String(form.value.code || '').trim();
        const payload = toDiscountPayload({ ...form.value, name_ar: form.value.name_ar || code, name_en: form.value.name_en || code });
        if (isEdit.value) {
            await adminCatalogService.updateDiscountCode(currentId.value, payload);
            triggerAlert('تم تحديث كود الخصم بنجاح');
        } else {
            await adminCatalogService.createDiscountCode(payload);
            triggerAlert('تم إنشاء كود الخصم بنجاح');
        }
        showFormModal.value = false;
        fetchOffers();
    } catch (error) {
        const errorData = error.response?.data;
        let msg = errorData?.message || 'فشل حفظ البيانات';
        if (errorData?.errors) {
            // Pick first validation error if exists
            const firstErr = Object.values(errorData.errors)[0][0];
            msg = firstErr;
        }
        triggerAlert(msg, 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const confirmDelete = (offer) => {
    deleteTarget.value = offer;
};

const cancelDelete = () => {
    if (!isDeleting.value) deleteTarget.value = null;
};

const executeDelete = async () => {
    if (!deleteTarget.value || isDeleting.value) return;

    const target = deleteTarget.value;
    isDeleting.value = true;
    try {
        await adminCatalogService.deleteDiscountCode(target.id);
        offers.value = offers.value.filter((offer) => offer.id !== target.id);
        deleteTarget.value = null;
        triggerAlert('تم حذف كود الخصم بنجاح');
    } catch (err) {
        const message = apiErrorMessage(err, 'فشل حذف كود الخصم. حاول مرة أخرى.');
        triggerAlert(message, 'error');
    } finally {
        isDeleting.value = false;
    }
};
</script>

<style scoped>
.discounts-page { display: flex; flex-direction: column; gap: 1.25rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem; }

/* Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.header-titles { display: flex; align-items: center; gap: 0.9rem; }
.tag-icon-wrapper { background: #f6e9ef; color: #660033; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; line-height: 1.3; }
.page-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0.1rem 0 0; }
.add-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #660033; color: #fff; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.add-btn:hover { background: #4d0026; }

/* Search */
.search-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.search-box { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #6b7280; pointer-events: none; }
.search-input { width: 100%; box-sizing: border-box; padding: 0.7rem 2.9rem 0.7rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.85rem; outline: none; background: #fff; }
.search-input:focus { border-color: #660033; }

/* Table */
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1.05rem 0.9rem; border-bottom: 1px solid #e5e7eb; vertical-align: middle; text-align: right; white-space: nowrap; }
.data-table th { font-size: 0.75rem; font-weight: 700; color: #6b7280; background: #fff; }
.data-table td { font-size: 0.82rem; color: #1f2937; }
.data-table tbody tr:last-child td { border-bottom: 0; }
.data-row:hover td { background: #fafafa; }
.state-row td { text-align: center; color: #6b7280; padding: 2.5rem; }
.col-code { padding-right: 1.25rem !important; }
.col-actions { width: 1%; }
.muted { color: #6b7280 !important; }

.code-cell { display: flex; align-items: center; gap: 0.6rem; }
.code-badge { background: #f3f4f6; padding: 0.25rem 0.6rem; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; font-weight: 600; color: #111827; direction: ltr; }
.copy-tiny { background: none; border: none; color: #6b7280; cursor: pointer; padding: 0.35rem; border-radius: 6px; display: flex; align-items: center; transition: 0.15s; }
.copy-tiny:hover, .copy-tiny:focus-visible { background: #660033; color: #fff; outline: none; }
.value-cell { font-weight: 700; color: #660033 !important; }

.usage { display: flex; align-items: center; gap: 0.6rem; justify-content: flex-start; }
.usage-bar-bg { width: 64px; height: 6px; background: #e5e7eb; border-radius: 10px; overflow: hidden; direction: ltr; }
.usage-bar-fill { height: 100%; background: #660033; border-radius: 10px; }
.usage-text { font-size: 0.8rem; color: #374151; direction: ltr; }

.status-badge-table { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
.status-badge-table.active { background: #ecfdf5; color: #059669; }
.status-badge-table.paused { background: #f3f4f6; color: #4b5563; }
.status-badge-table.expired { background: #fef2f2; color: #dc2626; }
.status-badge-table.scheduled { background: #eff6ff; color: #2563eb; }

.actions-group { display: flex; align-items: center; gap: 0.5rem; }
.action-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: 0.15s; }
.view-btn { color: #660033; }
.delete-btn { color: #dc2626; }
.action-btn:hover { background: #f3f4f6; }
.delete-btn:hover { background: #fef2f2; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: #fff; border-radius: 12px; width: 100%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.modal-close { position: absolute; top: 1.4rem; left: 1.4rem; background: transparent; color: #6b7280; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: #f3f4f6; }
.form-content { max-width: 600px; max-height: 95vh; overflow-y: auto; }
.form-header { padding: 1.5rem 1.5rem 1rem; text-align: right; }
.modal-title-main { font-size: 1.15rem; font-weight: 800; color: #111827; margin: 0; }
.modal-subtitle-main { font-size: 0.82rem; color: #6b7280; margin: 0.25rem 0 0; }
.offer-form { padding: 0.5rem 1.5rem 1.5rem; }
.form-fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.1rem; }
.form-group { display: flex; flex-direction: column; min-width: 0; }
.form-label { font-size: 0.8rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem; text-align: right; }
.form-control { width: 100%; box-sizing: border-box; height: 44px; padding: 0 0.9rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: inherit; font-size: 0.85rem; color: #111827; background: #f9fafb; outline: none; transition: border-color 0.15s, background 0.15s; }
.form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.12); }
.form-control:disabled { color: #9ca3af; background: #f3f4f6; cursor: not-allowed; }
.form-fieldset:disabled .form-control { color: #111827; background: #f9fafb; cursor: default; }
.ltr-text { direction: ltr; text-align: left; }
.code-input { text-transform: uppercase; letter-spacing: 0.04em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.date-control { direction: ltr; text-align: right; }

.input-unit { position: relative; }
.input-unit .form-control { padding-left: 3.2rem; }
.input-unit .unit { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: #6b7280; pointer-events: none; }
.select-wrapper { position: relative; }
.select-wrapper select { appearance: none; padding-left: 2.2rem; cursor: pointer; }
.select-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; }

.lang-row { display: flex; align-items: center; gap: 0.6rem; margin: 1.25rem 0 0.9rem; color: #6b7280; }
.i18n-toggle { display: inline-flex; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
.i18n-btn { border: none; background: transparent; padding: 0.35rem 0.85rem; font-weight: 700; font-size: 0.78rem; cursor: pointer; color: #6b7280; font-family: inherit; }
.i18n-btn.active { background: #660033; color: #fff; }

.form-footer-btns { margin-top: 1.5rem; display: flex; gap: 0.6rem; justify-content: flex-end; }
.btn-cancel-form { padding: 0.65rem 1.1rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.btn-cancel-form:hover { background: #f9fafb; }
.btn-submit-form { padding: 0.65rem 1.4rem; border-radius: 8px; border: none; background: #660033; color: #fff; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.btn-submit-form:hover:not(:disabled) { background: #4d0026; }
.btn-submit-form:disabled { opacity: 0.6; cursor: not-allowed; }

/* Delete */
.delete-modal { max-width: 500px; padding: 1.5rem; text-align: right; }
.delete-modal h2 { margin: 0 0 0.5rem; color: #111827; font-size: 1.1rem; font-weight: 800; }
.delete-modal p { margin: 0; color: #6b7280; line-height: 1.7; font-size: 0.88rem; }
.delete-footer { display: flex; gap: 0.6rem; margin-top: 1.25rem; justify-content: flex-start; }
.btn-delete-confirm { background: #ef4444; color: #fff; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; }
.btn-delete-confirm:hover { background: #dc2626; }
.btn-delete-confirm:disabled, .btn-cancel-form:disabled { opacity: 0.6; cursor: not-allowed; }
.delete-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.45); border-top-color: #fff; border-radius: 50%; animation: delete-spin 0.7s linear infinite; }
@keyframes delete-spin { to { transform: rotate(360deg); } }

/* Alerts */

@media (max-width: 768px) {
  .page-header { flex-wrap: wrap; }
  .form-grid { grid-template-columns: 1fr; }
  .form-footer-btns { justify-content: stretch; }
  .form-footer-btns button { flex: 1; }
}
</style>
