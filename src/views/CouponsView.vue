<template>
  <div class="coupons-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <div class="title-with-icon">
          <h2 class="page-title">{{ tx('أكواد الخصم', 'Discount Codes') }}</h2>
          <div class="tag-icon-wrapper">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
             </svg>
          </div>
        </div>
        <p class="page-subtitle">{{ tx('إدارة أكواد الخصم والعروض الترويجية', 'Manage discount codes and promotions') }}</p>
      </div>
      <button class="add-btn" @click="openAddModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة كود جديد', 'Add Discount Code') }}
      </button>
    </div>

    <!-- Search Row -->
    <div class="search-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن كود...', 'Search codes...')" class="search-input" />
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-code text-right">{{ tx('الكود', 'Code') }}</th>
            <th class="col-type">{{ tx('نوع الخصم', 'Discount type') }}</th>
            <th class="col-value">{{ tx('قيمة الخصم', 'Discount value') }}</th>
            <th class="col-min">{{ tx('الحد الأدنى', 'Minimum') }}</th>
            <th class="col-used">{{ tx('الاستخدام', 'Usage') }}</th>
            <th class="col-start">{{ tx('تاريخ البداية', 'Start date') }}</th>
            <th class="col-end">{{ tx('تاريخ النهاية', 'End date') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="9">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredCoupons.length === 0" class="state-row"><td colspan="9">{{ tx('لا توجد أكواد خصم', 'No discount codes found') }}</td></tr>
          <template v-else>
            <tr v-for="coupon in filteredCoupons" :key="coupon.id" class="data-row">
              <td class="col-code text-right">
                <div class="code-cell">
                  <span class="coupon-code">{{ coupon.code }}</span>
                  <button class="copy-btn" @click="copyCode(coupon.code)" :title="tx('نسخ', 'Copy')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  </button>
                </div>
              </td>
              <td class="col-type">
                {{ coupon.type === 'percentage' ? 'نسبة مئوية' : 'قيمة ثابتة' }}
              </td>
              <td class="col-value font-bold" :class="coupon.type === 'percentage' ? 'text-pink' : 'text-blue'">
                {{ coupon.type === 'percentage' ? coupon.value + '%' : formatPrice(coupon.value) + ' ' + cur }}
              </td>
              <td class="col-min">
                {{ formatPrice(coupon.minimum_amount) }} {{ cur }}
              </td>
              <td class="col-used">
                <div class="progress-container">
                  <div class="progress-stats">
                    <span>{{ coupon.used_count || 0 }} / {{ coupon.usage_limit || '∞' }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: getProgressWidth(coupon) + '%' }"></div>
                  </div>
                </div>
              </td>
              <td class="col-start">{{ formatDate(coupon.start_date) }}</td>
              <td class="col-end">{{ formatDate(coupon.end_date) }}</td>
              <td class="col-status">
                <span :class="['status-badge-table', getStatusClass(coupon)]">
                  {{ getStatusText(coupon) }}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn edit-btn" @click="openEditModal(coupon)" :title="tx('تعديل', 'Edit')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  </button>
                   <button class="action-btn delete-btn" @click="confirmDelete(coupon)" :title="tx('حذف', 'Delete')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                  <button class="action-btn view-btn" @click="openViewModal(coupon)" :title="tx('عرض', 'View')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal (Figma Exact) -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="showFormModal = false">
      <div class="modal-content form-content">
        <button class="modal-close" @click="showFormModal = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header">
            <h3 class="modal-title-main">{{ isEdit ? tx('تعديل كود الخصم', 'Edit Discount Code') : tx('إضافة كود خصم جديد', 'Add New Discount Code') }}</h3>
            <p class="modal-subtitle-main">{{ isEdit ? tx('عدّل تفاصيل الكود', 'Edit code details') : tx('أدخل تفاصيل الكود الجديد', 'Enter the new code details') }}</p>
        </div>

        <form @submit.prevent="submitForm" class="coupon-form">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">{{ tx('الكود', 'Code') }} <span class="req">*</span></label>
                    <input type="text" v-model="form.code" class="form-control" placeholder="أدخل الكود (مثلاً: SAVE20)" required />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('قيمة الخصم', 'Discount value') }} <span class="req">*</span></label>
                    <input type="number" step="0.01" v-model="form.value" class="form-control" placeholder="0.00" required />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('نوع الخصم', 'Discount type') }} <span class="req">*</span></label>
                    <select v-model="form.type" class="form-control select-control" required>
                      <option value="percentage">{{ tx('نسبة مئوية', 'Percentage') }}</option>
                      <option value="fixed">{{ tx('قيمة ثابتة', 'Fixed amount') }}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('الحد الأدنى للشراء', 'Minimum purchase') }}</label>
                    <input type="number" step="0.01" v-model="form.minimum_amount" class="form-control" placeholder="0.00" />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('الحد الأقصى للخصم', 'Maximum discount') }}</label>
                    <input type="number" step="0.01" v-model="form.max_discount" class="form-control" placeholder="0.00" />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('عدد المرات المسموح بالاستخدام', 'Usage limit') }}</label>
                    <input type="number" v-model="form.usage_limit" class="form-control" placeholder="مثلاً: 100" />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('تاريخ البدء', 'Start date') }} <span class="req">*</span></label>
                    <input type="date" lang="en-GB" v-model="form.start_date" class="form-control date-input" required />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ tx('تاريخ الانتهاء', 'End date') }} <span class="req">*</span></label>
                    <input type="date" lang="en-GB" v-model="form.end_date" class="form-control date-input" required />
                </div>

                <div class="form-group full-width">
                    <label class="form-label">{{ tx('الحالة', 'Status') }}</label>
                  <select v-model="form.is_active" class="form-control select-control">
                    <option :value="true">{{ tx('نشط', 'Active') }}</option>
                    <option :value="false">{{ tx('غير نشط', 'Inactive') }}</option>
                  </select>
                </div>
            </div>

            <div class="form-footer-actions">
                <button type="button" class="btn-cancel" @click="showFormModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
                <button type="submit" class="btn-submit" :disabled="isSubmitting">
                    {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEdit ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة الكود', 'Add code')) }}
                </button>
            </div>
        </form>
      </div>
    </div>

    <!-- View Modal (Figma Exact) -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false;">
      <div class="modal-content view-card-modal">
        <button class="modal-close-simple" @click="showViewModal = false;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        
        <div class="view-modal-header">
            <h3 class="view-modal-title">{{ tx('تفاصيل كود الخصم', 'Discount Code Details') }}</h3>
            <p class="view-modal-subtitle">{{ tx('معلومات كاملة عن الكود', 'Complete code information') }}</p>
        </div>

        <div class="code-display-box">
            <span class="label-tiny">{{ tx('الكود', 'Code') }}</span>
            <h2 class="display-code-text">{{ viewCoupon?.code }}</h2>
        </div>

        <div class="view-details-grid">
            <div class="detail-item">
                <span class="detail-label">{{ tx('قيمة الخصم', 'Discount value') }}</span>
                <span class="detail-val">{{ viewCoupon?.type === 'percentage' ? viewCoupon.value + '%' : formatPrice(viewCoupon.value) + ' ' + cur }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">نوع الخصم</span>
                <span class="detail-val">{{ viewCoupon?.type === 'percentage' ? 'نسبة مئوية' : 'قيمة ثابتة' }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الحد الأدنى</span>
                <span class="detail-val">{{ formatPrice(viewCoupon?.minimum_amount) }} {{ cur }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الحد الأقصى</span>
                <span class="detail-val">{{ formatPrice(viewCoupon?.max_discount || 0) }} {{ cur }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">عدد المرات</span>
                <span class="detail-val">{{ viewCoupon?.usage_limit || '∞' }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">مرات الاستخدام</span>
                <span class="detail-val">{{ viewCoupon?.used_count || 0 }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">تاريخ البدء</span>
                <span class="detail-val ltr-text">{{ formatDate(viewCoupon?.start_date) }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">تاريخ الانتهاء</span>
                <span class="detail-val ltr-text">{{ formatDate(viewCoupon?.end_date) }}</span>
            </div>
        </div>

        <div class="view-modal-footer">
            <button class="btn-footer-close" @click="showViewModal = false">إغلاق</button>
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
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import api from '../config/axios';

const { tx } = useAdminText();
const { cur } = useCurrencyLabel();

// States
const coupons = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const isSubmitting = ref(false);

// Modals
const showViewModal = ref(false);
const showFormModal = ref(false);
const viewCoupon = ref(null);
const isEdit = ref(false);
const editingId = ref(null);

const form = ref({
    code: '',
    name: 'Coupon Name', // Default name as backend requires it but UI doesn't show field
    type: 'percentage',
    value: '',
    minimum_amount: '',
    max_discount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true
});

const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

// Utils
const formatPrice = (p) => Number(p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => {
    if (!d) return '-';
    // If it's already YYYY-MM-DD (10 chars), return it as is
    if (d.length <= 10) return d;
    return new Date(d).toISOString().split('T')[0];
};

const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

const getProgressWidth = (coupon) => {
    if (!coupon.usage_limit) return 0;
    return (coupon.used_count / coupon.usage_limit) * 100;
};

const getStatusText = (coupon) => {
    const today = new Date().toISOString().split('T')[0];
    if (!coupon.is_active) return 'غير نشط';
    if (coupon.end_date < today) return 'منتهي';
    return 'نشط';
};

const getStatusClass = (coupon) => {
    const today = new Date().toISOString().split('T')[0];
    if (!coupon.is_active) return 'inactive'; // Gray
    if (coupon.end_date < today) return 'expired'; // Red
    return 'active'; // Green
};

const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    triggerAlert('تم نسخ الكود بنجاح');
};

// Fetch Data
const fetchCoupons = async () => {
  loading.value = true;
  try {
    const res = await api.get('/dashboard/coupons');
    coupons.value = res.data.data;
  } catch (err) {
    triggerAlert('فشل تحميل بيانات الأكواد', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCoupons();
});

// Filtering
const filteredCoupons = computed(() => {
  return coupons.value.filter(c => {
    return c.code.toLowerCase().includes(searchQuery.value.toLowerCase());
  });
});

// Modals Setup
const openViewModal = (coupon) => {
  viewCoupon.value = coupon;
  showViewModal.value = true;
};

const openAddModal = () => {
  isEdit.value = false;
  editingId.value = null;
  form.value = { 
    code: '', 
    name: 'عروض الموسم', 
    type: 'percentage', 
    value: '', 
    minimum_amount: '', 
    max_discount: '', 
    usage_limit: '', 
    start_date: '', 
    end_date: '', 
    is_active: true 
  };
  showFormModal.value = true;
};

const openEditModal = (coupon) => {
  isEdit.value = true;
  editingId.value = coupon.id;
  form.value = {
    code: coupon.code || '',
    name: coupon.name || 'عروض الموسم',
    type: coupon.type || 'percentage',
    value: coupon.value || '',
    minimum_amount: coupon.minimum_amount || '',
    max_discount: coupon.max_discount || '',
    usage_limit: coupon.usage_limit || '',
    start_date: formatDate(coupon.start_date),
    end_date: formatDate(coupon.end_date),
    is_active: !!coupon.is_active
  };
  showFormModal.value = true;
};

const submitForm = async () => {
    isSubmitting.value = true;
    try {
        if (isEdit.value) {
            await api.put(`/dashboard/coupons/${editingId.value}`, form.value);
            triggerAlert('تم تعديل كود الخصم بنجاح');
        } else {
            await api.post('/dashboard/coupons', form.value);
            triggerAlert('تم إضافة كود الخصم بنجاح');
        }
        showFormModal.value = false;
        fetchCoupons();
    } catch (error) {
        const msg = apiErrorMessage(error, 'حدث خطأ أثناء الحفظ');
        triggerAlert(msg, 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const confirmDelete = async (coupon) => {
  if (confirm(`هل أنت متأكد من حذف كود الخصم "${coupon.code}"؟`)) {
    try {
      await api.delete(`/dashboard/coupons/${coupon.id}`);
      triggerAlert('تم حذف الكود بنجاح');
      fetchCoupons();
    } catch (err) {
      triggerAlert('فشل حذف الكود', 'error');
    }
  }
};
</script>

<style scoped>
.coupons-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 2rem;
}

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.title-with-icon { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }
.tag-icon-wrapper { background: #f3f4f6; color: #660033; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 0; }

.add-btn {
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
.add-btn:hover { background: #4d0026; }

/* Search Row */
.search-row { display: flex; width: 100%; }
.search-box { flex: 1; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 0.75rem 2.8rem 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; transition: 0.2s; }
.search-input:focus { border-color: #660033; }

/* Table */
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1.1rem 0.75rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; text-align: center; font-size: 0.8rem; }
.data-table th { background: #f9fafb; font-size: 0.72rem; font-weight: 700; color: #6b7280; white-space: nowrap; }
.data-table td { color: #374151; }
.data-row:hover td { background: #f3f4f6; }
.state-row td { text-align: center; color: #6b7280; padding: 3rem; }

.text-right { text-align: right !important; }
.font-bold { font-weight: 700; }
.text-pink { color: #660033; }
.text-blue { color: #2563eb; }
.ltr-text { direction: ltr; }

.code-cell { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; }
.coupon-code { font-weight: 800; color: #111827; }
.copy-btn { background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; padding: 2px; transition: 0.2s; }
.copy-btn:hover { color: #660033; }

/* Progress Bar */
.progress-container { width: 120px; margin: 0 auto; }
.progress-stats { font-size: 0.65rem; color: #6b7280; margin-bottom: 4px; font-weight: 600; }
.progress-bar-bg { width: 100%; height: 6px; background: #f3f4f6; border-radius: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #660033; border-radius: 10px; }

.status-badge-table {
  display: inline-block; padding: 0.2rem 0.8rem; border-radius: 6px; font-size: 0.68rem; font-weight: 700;
}
.status-badge-table.active { background: #ecfdf5; color: #10b981; }
.status-badge-table.expired { background: #fee2e2; color: #ef4444; }
.status-badge-table.inactive { background: #f3f4f6; color: #9ca3af; }

.actions-group { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.action-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; cursor: pointer; transition: 0.2s;
}
.edit-btn { background: #eff6ff; color: #2563eb; }
.edit-btn:hover { background: #dbeafe; }
.view-btn { background: #f3f4f6; color: #660033; }
.view-btn:hover { background: #e5e7eb; }
.delete-btn { background: #fef2f2; color: #dc2626; }
.delete-btn:hover { background: #fee2e2; }

/* Modals Shared */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(4px);
}
.modal-content {
  background: #fff; border-radius: 16px; width: 100%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

/* FORM MODAL */
.form-content { max-width: 600px; padding: 2.5rem; }
.form-header { text-align: center; margin-bottom: 2rem; }
.modal-title-main { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0; }
.modal-subtitle-main { font-size: 0.85rem; color: #9ca3af; margin-top: 0.4rem; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.form-group.full-width { grid-column: span 2; }
.form-label { display: block; font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 0.5rem; text-align: right; }
.form-control { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; transition: 0.2s; outline: none; }
.form-control:focus { border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }
.select-control { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: left 1rem center; }

.form-footer-actions { margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-start; }
.btn-cancel { padding: 0.75rem 1.75rem; background: #fff; color: #4b5563; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; }
.btn-submit { padding: 0.75rem 2rem; background: #660033; color: #fff; border: none; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; transition: 0.22s; }
.btn-submit:hover:not(:disabled) { background: #4d0026; }

.modal-close { position: absolute; top: 1.25rem; left: 1.25rem; background: none; border: none; cursor: pointer; }

/* VIEW MODAL (FIGMA) */
.view-card-modal { max-width: 550px; padding: 2.5rem; text-align: center; }
.modal-close-simple { position: absolute; top: 1.25rem; left: 1.25rem; background: none; border: none; cursor: pointer; }
.code-display-box { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; position: relative; }
.label-tiny { position: absolute; top: 0.5rem; right: 1rem; font-size: 0.65rem; color: #660033; font-weight: 800; text-transform: uppercase; }
.display-code-text { font-size: 1.8rem; font-weight: 900; color: #660033; margin: 0; letter-spacing: 1px; }

.view-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 2rem; text-align: right; }
.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-label { font-size: 0.75rem; color: #9ca3af; font-weight: 600; }
.detail-val { font-size: 0.95rem; font-weight: 700; color: #111827; }

.view-modal-footer { margin-top: 2.5rem; }
.btn-footer-close { width: 100%; padding: 0.8rem; background: #660033; color: #fff; border: none; border-radius: 10px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; }

/* Alerts */
</style>
