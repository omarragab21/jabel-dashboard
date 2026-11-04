<template>
  <div class="reviews-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <div class="title-with-icon">
          <h2 class="page-title">{{ tx('تقييمات المنتجات', 'Product Reviews') }}</h2>
          <div class="tag-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>
        <p class="page-subtitle">{{ tx('إدارة ومراجعة تقييمات العملاء للمنتجات', 'Manage and review customer product ratings') }}</p>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper pink">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('إجمالي التقييمات', 'Total Reviews') }}</span>
          <h3 class="stat-value">{{ reviews.length }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper orange">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('بانتظار المراجعة', 'Pending Review') }}</span>
          <h3 class="stat-value">{{ pendingReviewsCount }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('تقييمات منشورة', 'Published Reviews') }}</span>
          <h3 class="stat-value">{{ approvedReviewsCount }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20V14"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('متوسط التقييم', 'Average Rating') }}</span>
          <h3 class="stat-value">{{ averageRating }}<small>/5</small></h3>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('بحث باسم العميل أو المنتج أو التعليق...', 'Search by customer, product, or comment...')" class="search-input" />
      </div>

      <div class="filter-select">
        <select v-model="statusFilter" class="form-select">
          <option value="">{{ tx('كل الحالات', 'All Statuses') }}</option>
          <option value="pending">{{ tx('بانتظار المراجعة', 'Pending Review') }}</option>
          <option value="approved">{{ tx('منشور', 'Published') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="filter-select">
        <select v-model="ratingFilter" class="form-select">
          <option value="">{{ tx('كل التقييمات', 'All Ratings') }}</option>
          <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="String(n)">{{ n }} {{ n === 1 ? tx('نجمة', 'star') : tx('نجوم', 'stars') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-name text-right">{{ tx('المنتج', 'Product') }}</th>
            <th class="col-customer">{{ tx('العميل', 'Customer') }}</th>
            <th class="col-rating">{{ tx('التقييم', 'Rating') }}</th>
            <th class="col-comment text-right">{{ tx('التعليق', 'Comment') }}</th>
            <th class="col-date">{{ tx('التاريخ', 'Date') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="7">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredReviews.length === 0" class="state-row"><td colspan="7">{{ tx('لا توجد تقييمات مطابقة', 'No matching reviews') }}</td></tr>
          <template v-else>
            <tr v-for="review in filteredReviews" :key="review.id" class="data-row">
              <td class="col-name text-right">
                <span class="offer-name">{{ productName(review) }}</span>
              </td>
              <td class="col-customer">{{ customerName(review) }}</td>
              <td class="col-rating">
                <div class="rating-stars" :title="`${review.rating || 0}/5`">
                  <svg v-for="i in 5" :key="i" width="14" height="14" viewBox="0 0 24 24" :class="{ filled: i <= Number(review.rating) }" stroke="currentColor" stroke-width="1.6">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
              </td>
              <td class="col-comment text-right">
                <p class="review-comment-text" :title="review.comment">{{ review.comment || '—' }}</p>
              </td>
              <td class="col-date">{{ formatDate(review.created_at) }}</td>
              <td class="col-status">
                <span :class="['status-badge-table', review.is_approved ? 'active' : 'scheduled']">
                  {{ review.is_approved ? tx('منشور', 'Published') : tx('بانتظار المراجعة', 'Pending Review') }}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button v-if="!review.is_approved" class="action-btn approve-btn" @click="approveReview(review)" :title="tx('موافقة ونشر', 'Approve and Publish')" :aria-label="tx('موافقة ونشر', 'Approve and Publish')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <button class="action-btn view-btn" @click="openView(review)" :title="tx('عرض', 'View')" :aria-label="tx('عرض', 'View')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn delete-btn" @click="confirmDelete(review)" :title="tx('حذف', 'Delete')" :aria-label="tx('حذف', 'Delete')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" v-if="viewedReview" @click.self="closeView">
      <div class="modal-content form-content">
        <button class="modal-close" @click="closeView" :aria-label="tx('إغلاق', 'Close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header">
          <div class="header-icon-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <h3 class="modal-title-main">{{ tx('تفاصيل التقييم', 'Review Details') }}</h3>
          <p class="modal-subtitle-main">{{ tx('عرض البيانات فقط', 'View-only details') }}</p>
        </div>

        <div class="review-details">
          <div class="detail-row">
            <span class="detail-label">{{ tx('المنتج', 'Product') }}</span>
            <span class="detail-value">{{ productName(viewedReview) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ tx('العميل', 'Customer') }}</span>
            <span class="detail-value">{{ customerName(viewedReview) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ tx('التقييم', 'Rating') }}</span>
            <div class="rating-stars">
              <svg v-for="i in 5" :key="i" width="18" height="18" viewBox="0 0 24 24" :class="{ filled: i <= Number(viewedReview.rating) }" stroke="currentColor" stroke-width="1.6">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span class="rating-number">{{ viewedReview.rating || 0 }}/5</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ tx('التاريخ', 'Date') }}</span>
            <span class="detail-value">{{ formatDate(viewedReview.created_at) || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ tx('الحالة', 'Status') }}</span>
            <span :class="['status-badge-table', viewedReview.is_approved ? 'active' : 'scheduled']">
              {{ viewedReview.is_approved ? tx('منشور', 'Published') : tx('بانتظار المراجعة', 'Pending Review') }}
            </span>
          </div>
          <div class="detail-block">
            <span class="detail-label">{{ tx('التعليق', 'Comment') }}</span>
            <p class="comment-full">{{ viewedReview.comment || tx('لا يوجد تعليق', 'No comment') }}</p>
          </div>
        </div>

        <div class="form-footer-btns view-footer">
          <button type="button" class="btn-cancel-form" @click="closeView">{{ tx('إغلاق', 'Close') }}</button>
          <button v-if="!viewedReview.is_approved" type="button" class="btn-submit-form" :disabled="isApproving" @click="approveReview(viewedReview)">
            {{ isApproving ? tx('جاري النشر...', 'Publishing...') : tx('موافقة ونشر', 'Approve and Publish') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div class="modal-overlay" v-if="deleteTarget" @click.self="cancelDelete">
      <div class="modal-content delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-review-title">
        <div class="delete-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/>
          </svg>
        </div>
        <div class="delete-copy">
          <h2 id="delete-review-title">{{ tx('تأكيد حذف التقييم', 'Confirm Review Deletion') }}</h2>
          <p>{{ tx('هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to delete this review? This action cannot be undone.') }}</p>
        </div>
        <div class="delete-footer">
          <button class="btn-cancel-form" type="button" :disabled="isDeleting" @click="cancelDelete">{{ tx('إلغاء', 'Cancel') }}</button>
          <button class="btn-delete-confirm" type="button" :disabled="isDeleting" @click="executeDelete">
            <span v-if="isDeleting" class="delete-spinner" aria-hidden="true"></span>
            {{ isDeleting ? tx('جاري الحذف...', 'Deleting...') : tx('حذف التقييم', 'Delete Review') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" :class="[alertType, { show: showAlert }]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <path v-if="alertType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline v-if="alertType === 'success'" points="22 4 12 14.01 9 11.01"/>
        <circle v-if="alertType === 'error'" cx="12" cy="12" r="10"/><line v-if="alertType === 'error'" x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import adminManagementService from '../application/adminManagementService';
import { useAdminText } from '../composables/useAdminText';

const { tx, locale } = useAdminText();

const reviews = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('');
const ratingFilter = ref('');

const viewedReview = ref(null);
const deleteTarget = ref(null);
const isDeleting = ref(false);
const isApproving = ref(false);

const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');
const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

const pendingReviewsCount = computed(() => reviews.value.filter((r) => !r.is_approved).length);
const approvedReviewsCount = computed(() => reviews.value.filter((r) => r.is_approved).length);
const averageRating = computed(() => {
  const rated = reviews.value.filter((r) => Number(r.rating) > 0);
  if (!rated.length) return '0.0';
  return (rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length).toFixed(1);
});

const productName = (review) => review.product?.name_i18n?.ar || review.product?.name || (review.product_id ? `منتج #${review.product_id}` : '—');
const customerName = (review) => review.customer?.name || '—';

const filteredReviews = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return reviews.value.filter((r) => {
    const matchesSearch = !q
      || customerName(r).toLowerCase().includes(q)
      || productName(r).toLowerCase().includes(q)
      || (r.comment || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter.value === ''
      || (statusFilter.value === 'approved' ? r.is_approved : !r.is_approved);
    const matchesRating = ratingFilter.value === '' || String(Math.round(Number(r.rating))) === ratingFilter.value;
    return matchesSearch && matchesStatus && matchesRating;
  });
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
};

const fetchReviews = async () => {
  loading.value = true;
  try {
    reviews.value = await adminManagementService.listReviews({});
  } catch {
    triggerAlert('فشل تحميل التقييمات', 'error');
  } finally {
    loading.value = false;
  }
};

const openView = (review) => { viewedReview.value = review; };
const closeView = () => { if (!isApproving.value) viewedReview.value = null; };

const approveReview = async (review) => {
  if (isApproving.value) return;
  isApproving.value = true;
  try {
    await adminManagementService.updateReview(review.id, { is_approved: 1 });
    triggerAlert('تمت الموافقة على التقييم بنجاح');
    viewedReview.value = null;
    await fetchReviews();
  } catch {
    triggerAlert('فشل الموافقة على التقييم', 'error');
  } finally {
    isApproving.value = false;
  }
};

const confirmDelete = (review) => { deleteTarget.value = review; };
const cancelDelete = () => { if (!isDeleting.value) deleteTarget.value = null; };
const executeDelete = async () => {
  if (!deleteTarget.value || isDeleting.value) return;
  const target = deleteTarget.value;
  isDeleting.value = true;
  try {
    await adminManagementService.deleteReview(target.id);
    reviews.value = reviews.value.filter((r) => r.id !== target.id);
    deleteTarget.value = null;
    triggerAlert('تم حذف التقييم بنجاح');
  } catch (err) {
    triggerAlert(apiErrorMessage(err, 'فشل حذف التقييم'), 'error');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(fetchReviews);
</script>

<style scoped>
.reviews-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem;
}

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.title-with-icon { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }
.tag-icon-wrapper { background: #f3f4f6; color: #660033; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 0; }

/* Stats Cards */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.stat-icon-wrapper { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-icon-wrapper.pink { background: #f3f4f6; color: #660033; }
.stat-icon-wrapper.orange { background: #fff7ed; color: #ea580c; }
.stat-icon-wrapper.green { background: #ecfdf5; color: #10b981; }
.stat-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
.stat-info { display: flex; flex-direction: column; gap: 0.2rem; }
.stat-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; }
.stat-value { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }
.stat-value small { font-size: 0.8rem; font-weight: 600; color: #9ca3af; margin-right: 2px; }

/* Filters */
.filters-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.search-box { flex: 1; min-width: 250px; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 0.75rem 2.8rem 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; }
.search-input:focus { border-color: #660033; }
.filter-select { position: relative; display: flex; align-items: center; min-width: 150px; }
.form-select { width: 100%; padding: 0.75rem 0.75rem 0.75rem 2.2rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #374151; appearance: none; outline: none; }
.filter-select .select-icon { position: absolute; left: 0.75rem; color: #9ca3af; pointer-events: none; }

/* Table */
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto; margin-top: 0.5rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1.1rem 0.75rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; text-align: center; }
.data-table th { background: #f9fafb; font-size: 0.75rem; font-weight: 700; color: #6b7280; white-space: nowrap; }
.data-table td { font-size: 0.82rem; color: #374151; }
.data-row:hover td { background: #f3f4f6; }
.state-row td { padding: 3rem 1rem; color: #6b7280; }
.text-right { text-align: right !important; }
.offer-name { font-weight: 700; color: #111827; }

.rating-stars { display: inline-flex; align-items: center; gap: 2px; }
.rating-stars svg { fill: none; color: #d1d5db; }
.rating-stars svg.filled { fill: #fbbf24; color: #f59e0b; }
.rating-number { font-size: 0.8rem; font-weight: 700; color: #374151; margin-right: 0.4rem; }

.review-comment-text { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; color: #6b7280; }

/* Status Badges */
.status-badge-table { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
.status-badge-table.active { background: #ecfdf5; color: #059669; }
.status-badge-table.scheduled { background: #fff7ed; color: #ea580c; }

/* Actions */
.actions-group { display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
.action-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
.approve-btn { background: #ecfdf5; color: #059669; }
.view-btn { background: #f3f4f6; color: #660033; }
.delete-btn { background: #fef2f2; color: #dc2626; }
.action-btn:hover { opacity: 0.8; transform: translateY(-1px); }

/* View modal */
.form-content { max-width: 560px; padding: 0; max-height: 95vh; overflow-y: auto; }
.form-header { text-align: center; padding: 2rem 2rem 1.25rem; position: relative; }
.header-icon-main { width: 50px; height: 50px; background: #f3f4f6; color: #660033; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.modal-title-main { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0; }
.modal-subtitle-main { font-size: 0.85rem; color: #9ca3af; margin-top: 0.4rem; }
.review-details { padding: 0 2.5rem; display: flex; flex-direction: column; }
.detail-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid #f3f4f6; }
.detail-block { padding: 0.85rem 0; }
.detail-label { font-size: 0.8rem; font-weight: 700; color: #6b7280; }
.detail-value { font-size: 0.88rem; font-weight: 700; color: #111827; }
.comment-full { margin: 0.6rem 0 0; padding: 0.9rem 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.88rem; line-height: 1.8; color: #374151; white-space: pre-wrap; word-break: break-word; }

/* Footer Btns */
.form-footer-btns { margin-top: 2rem; display: flex; gap: 1rem; }
.view-footer { padding: 0 2.5rem 2.5rem; }
.btn-cancel-form { flex: 1; padding: 0.85rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; }
.btn-submit-form { flex: 2; padding: 0.85rem; border-radius: 10px; border: none; background: #660033; color: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-submit-form:hover:not(:disabled) { background: #4d0026; }
.btn-submit-form:disabled { opacity: 0.6; }

/* Delete Modal */
.delete-modal { max-width: 460px; padding: 28px; text-align: center; }
.delete-icon { width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626; background: #fef2f2; }
.delete-copy h2 { margin: 0 0 8px; color: #111827; font-size: 1.2rem; }
.delete-copy p { margin: 0; color: #6b7280; line-height: 1.7; font-size: 0.92rem; }
.delete-footer { display: flex; gap: 1rem; padding: 24px 0 0; }
.delete-footer button { min-height: 44px; }
.btn-delete-confirm { background: #dc2626; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; flex: 1; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-delete-confirm:hover { background: #b91c1c; }
.btn-delete-confirm:disabled, .btn-cancel-form:disabled { opacity: 0.6; cursor: not-allowed; }
.delete-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.45); border-top-color: white; border-radius: 50%; animation: delete-spin 0.7s linear infinite; }
@keyframes delete-spin { to { transform: rotate(360deg); } }

/* Modals Shared */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(4px); }
.modal-content { background: #fff; border-radius: 20px; width: 100%; position: relative; box-shadow: 0 25px 70px rgba(0,0,0,0.25); }
.modal-close { position: absolute; top: 1.5rem; left: 1.5rem; background: #f3f4f6; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; }

/* Alerts */

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .review-details { padding: 0 1.25rem; }
  .view-footer { padding: 0 1.25rem 1.5rem; }
}
</style>
