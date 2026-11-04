<template>
  <div class="returns-page">
    <!-- Header -->
    <header class="page-head">
      <div class="head-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
        </svg>
      </div>
      <div class="head-text">
        <h1 class="head-title">{{ tx('المرتجعات والاستردادات', 'Returns & Refunds') }}</h1>
        <p class="head-subtitle">{{ tx('إدارة طلبات استرجاع المنتجات واسترداد المبالغ', 'Manage product return requests and refunds') }}</p>
      </div>
    </header>

    <!-- Stats -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-inner">
          <div class="stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          </div>
          <div class="stat-text">
            <p class="stat-value">{{ returns.length }}</p>
            <p class="stat-label">{{ tx('إجمالي الطلبات', 'Total requests') }}</p>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-inner">
          <div class="stat-icon pending">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <div class="stat-text">
            <p class="stat-value">{{ pendingCount }}</p>
            <p class="stat-label">{{ tx('قيد المراجعة', 'Pending review') }}</p>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-inner">
          <div class="stat-icon approved">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div class="stat-text">
            <p class="stat-value">{{ approvedCount }}</p>
            <p class="stat-label">{{ tx('تمت الموافقة', 'Approved') }}</p>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-inner">
          <div class="stat-icon refunded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
          </div>
          <div class="stat-text">
            <p class="stat-value"><RiyalAmount :value="refundedTotal" /></p>
            <p class="stat-label">{{ tx('مبالغ مستردة', 'Refunded amounts') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="filters-card">
      <div class="filters-row">
        <div class="search-field">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="tx('بحث برقم الإرجاع أو رقم الطلب...', 'Search by return number or order number...')"
          />
        </div>
        <div class="status-select">
          <select v-model="statusFilter" class="status-select-input" :aria-label="tx('الحالة', 'Status')">
            <option value="">{{ tx('جميع الحالات', 'All statuses') }}</option>
            <option v-for="status in STATUSES" :key="status" :value="status">{{ statusLabel(status) }}</option>
          </select>
          <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>
    </section>

    <!-- Table -->
    <section class="table-card">
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>{{ tx('جاري التحميل...', 'Loading...') }}</p>
      </div>

      <div v-else-if="error" class="state-box error">
        <p>{{ error }}</p>
        <button class="btn-retry" type="button" @click="fetchReturns">{{ tx('إعادة المحاولة', 'Retry') }}</button>
      </div>

      <div v-else-if="filteredReturns.length === 0" class="state-box">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        <p>{{ returns.length === 0 ? tx('لا توجد طلبات إرجاع', 'No return requests') : tx('لا توجد نتائج مطابقة', 'No matching results') }}</p>
      </div>

      <template v-else>
        <div class="table-scroll">
          <table class="returns-table">
            <thead>
              <tr>
                <th>{{ tx('رقم الإرجاع', 'Return no.') }}</th>
                <th>{{ tx('رقم الطلب', 'Order no.') }}</th>
                <th>{{ tx('المنتجات', 'Products') }}</th>
                <th>{{ tx('المبلغ', 'Amount') }}</th>
                <th>{{ tx('الحالة', 'Status') }}</th>
                <th>{{ tx('التاريخ', 'Date') }}</th>
                <th>{{ tx('الإجراءات', 'Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ret in pagedReturns" :key="ret.id">
                <td><span class="return-number">{{ returnLabel(ret) }}</span></td>
                <td><bdi class="cell-text">{{ orderLabel(ret) }}</bdi></td>
                <td>
                  <div class="products-cell">
                    <div class="thumbs">
                      <div v-for="(thumb, index) in thumbsFor(ret)" :key="index" class="thumb">
                        <img v-if="thumb" :src="thumb" :alt="ret.productName" loading="lazy" />
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                    </div>
                    <span class="products-count">{{ productCount(ret) }} {{ tx('منتج', productCount(ret) === 1 ? 'item' : 'items') }}</span>
                  </div>
                </td>
                <td><span class="cell-text amount"><RiyalAmount :value="ret.refundAmount" /></span></td>
                <td><ReturnStatusBadge :status="ret.status" /></td>
                <td><span class="date-text">{{ formatDate(ret.date) }}</span></td>
                <td>
                  <div class="row-actions">
                    <button class="icon-btn view" type="button" :title="tx('عرض التفاصيل', 'View details')" :aria-label="tx('عرض التفاصيل', 'View details')" @click="openDetails(ret.id)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <template v-if="ret.status === 'pending'">
                      <button class="icon-btn approve" type="button" :title="tx('قبول', 'Approve')" :aria-label="tx('قبول', 'Approve')" @click="handleApprove(ret.id)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      </button>
                      <button class="icon-btn reject" type="button" :title="tx('رفض', 'Reject')" :aria-label="tx('رفض', 'Reject')" @click="openRejectModal(ret.id)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="table-footer">
          <span class="footer-info">{{ tx('عرض', 'Showing') }} {{ rangeStart }} - {{ rangeEnd }} {{ tx('من', 'of') }} {{ filteredReturns.length }}</span>
          <div class="pagination">
            <button class="page-btn" type="button" :disabled="page === 1" :aria-label="tx('السابق', 'Previous')" @click="page--">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline :points="isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'" /></svg>
            </button>
            <button v-for="n in totalPages" :key="n" class="page-btn" :class="{ active: n === page }" type="button" @click="page = n">{{ n }}</button>
            <button class="page-btn" type="button" :disabled="page === totalPages" :aria-label="tx('التالي', 'Next')" @click="page++">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline :points="isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'" /></svg>
            </button>
          </div>
        </footer>
      </template>
    </section>

    <ReturnRejectModal v-model="showRejectModal" :busy="rejecting" @confirm="handleReject" />
  </div>
</template>

<script setup>
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import returnsService from '../services/returnsService';
import { useDialog } from '../composables/useDialog';
import ReturnStatusBadge from '../components/ReturnStatusBadge.vue';
import ReturnRejectModal from '../components/ReturnRejectModal.vue';
import RiyalAmount from '../components/RiyalAmount.vue';

const PAGE_SIZE = 10;
const STATUSES = ['pending', 'approved', 'rejected', 'refunded'];

const { tx, locale } = useAdminText();
const router = useRouter();
const dialog = useDialog();

const isRtl = computed(() => locale.value !== 'en');

const returns = ref([]);
const loading = ref(false);
const error = ref('');
const showRejectModal = ref(false);
const rejecting = ref(false);
const selectedReturnId = ref(null);
const searchQuery = ref('');
const statusFilter = ref('');
const page = ref(1);

const pendingCount = computed(() => returns.value.filter(r => r.status === 'pending').length);
const approvedCount = computed(() => returns.value.filter(r => r.status === 'approved').length);
// Approving a return credits the customer, so approved and refunded both count as money returned.
const refundedTotal = computed(() => returns.value
  .filter(r => r.status === 'approved' || r.status === 'refunded')
  .reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0));

const filteredReturns = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return returns.value.filter((ret) => {
    if (statusFilter.value && ret.status !== statusFilter.value) return false;
    if (!query) return true;
    return [returnLabel(ret), orderLabel(ret)]
      .some(value => String(value ?? '').toLowerCase().includes(query));
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredReturns.value.length / PAGE_SIZE)));
const pagedReturns = computed(() => filteredReturns.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const rangeStart = computed(() => (filteredReturns.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0));
const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, filteredReturns.value.length));

watch([searchQuery, statusFilter], () => { page.value = 1; });
watch(totalPages, (pages) => { if (page.value > pages) page.value = pages; });

const statusLabel = (status) => ({
  pending: tx('قيد المراجعة', 'Pending review'),
  approved: tx('تمت الموافقة', 'Approved'),
  rejected: tx('مرفوض', 'Rejected'),
  refunded: tx('تم الاسترجاع', 'Refunded'),
}[status] || status);

function returnLabel(ret) {
  const number = String(ret.returnNumber ?? ret.id ?? '');
  return /^RET-/i.test(number) ? number : `RET-${number}`;
}

function orderLabel(ret) {
  const number = String(ret.orderNumber || ret.orderId || '').replace(/^#/, '');
  if (!number) return '—';
  return /^\d+$/.test(number) ? `#${number}` : number;
}

const productCount = (ret) => (ret.items?.length || 1);

const thumbsFor = (ret) => {
  const images = ret.items?.length
    ? ret.items.map(item => item.productImage)
    : [ret.productImage];
  return images.slice(0, 2).reverse();
};

const formatDate = (date) => (date ? String(date).slice(0, 10) : '—');

const openDetails = (id) => router.push(`/admin/returns/${id}`);

let fetchToken = 0;

const fetchReturns = async () => {
  const token = ++fetchToken;
  loading.value = true;
  error.value = '';
  try {
    const list = await returnsService.listAll();
    returns.value = list;
    loading.value = false;
    // Product images are not on /v1/returns; they come from the linked orders, filled in as they arrive.
    await returnsService.attachOrders(list, (updated) => {
      if (token === fetchToken) returns.value = updated;
    });
  } catch (err) {
    console.error('Failed to fetch returns:', err);
    error.value = apiErrorMessage(err, 'فشل تحميل طلبات الإرجاع');
  } finally {
    loading.value = false;
  }
};

const handleApprove = async (id) => {
  const confirmed = await dialog.confirm('هل أنت متأكد من قبول هذا الطلب؟ سيتم إضافة المبلغ إلى رصيد العميل.', {
    title: 'قبول طلب الإرجاع',
    confirmText: 'قبول الطلب',
  });
  if (!confirmed) return;

  try {
    await returnsService.updateStatus(id, {
      status: 'approved'
    });
    fetchReturns();
    dialog.alert('تم قبول طلب الإرجاع بنجاح', { type: 'success', title: 'قبول طلب الإرجاع' });
  } catch (err) {
    dialog.alert(apiErrorMessage(err, 'فشل قبول الطلب'), { type: 'error', title: 'قبول طلب الإرجاع' });
  }
};

const openRejectModal = (id) => {
  selectedReturnId.value = id;
  showRejectModal.value = true;
};

const handleReject = async (reason) => {
  rejecting.value = true;
  try {
    await returnsService.updateStatus(selectedReturnId.value, {
      status: 'rejected',
      admin_notes: reason
    });
    showRejectModal.value = false;
    selectedReturnId.value = null;
    fetchReturns();
    dialog.alert('تم رفض طلب الإرجاع', { type: 'success', title: 'رفض طلب الإرجاع' });
  } catch (err) {
    dialog.alert(apiErrorMessage(err, 'فشل رفض الطلب'), { type: 'error', title: 'رفض طلب الإرجاع' });
  } finally {
    rejecting.value = false;
  }
};

onMounted(() => {
  fetchReturns();
});
</script>

<style scoped>
.returns-page {
  --rt-text: #111827;
  --rt-body: #374151;
  --rt-muted: #6b7280;
  --rt-border: #e5e7eb;
  --rt-row-border: #f3f4f6;
  --rt-card: #ffffff;
  --rt-field: #ffffff;
  --rt-head: #f9fafb;
  --rt-hover: #f3f4f6;
  --rt-primary: #660033;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
  color: var(--rt-body);
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}

:global(.dark) .returns-page {
  --rt-text: #f1f5f9;
  --rt-body: #cbd5e1;
  --rt-muted: #94a3b8;
  --rt-border: #334155;
  --rt-row-border: #334155;
  --rt-card: #1e293b;
  --rt-field: #0f172a;
  --rt-head: #1e293b;
  --rt-hover: rgba(148, 163, 184, 0.08);
  --rt-primary: #f1f5f9;
}

/* Header */
.page-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.head-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: 10px;
  background: var(--rt-hover);
  color: var(--rt-primary);
}

.head-title {
  margin: 0 0 0.2rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--rt-text);
}

.head-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--rt-muted);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.25rem;
  border: 1px solid var(--rt-border);
  border-radius: 10px;
  background: var(--rt-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.stat-inner {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 10px;
}

.stat-icon.total { background: #f3f4f6; color: #660033; }
.stat-icon.pending { background: #fffbeb; color: #d97706; }
.stat-icon.approved { background: #eff6ff; color: #3b82f6; }
.stat-icon.refunded { background: #ecfdf5; color: #059669; }

.stat-text {
  min-width: 0;
}

.stat-value {
  margin: 0 0 0.2rem;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--rt-text);
}

.stat-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--rt-muted);
}

/* Filters */
.filters-card {
  padding: 1rem;
  border: 1px solid var(--rt-border);
  border-radius: 10px;
  background: var(--rt-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.search-field {
  position: relative;
  flex: 1;
  min-width: 0;
}

.search-icon {
  position: absolute;
  top: 50%;
  inset-inline-start: 1rem;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input,
.status-select-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--rt-border);
  border-radius: 8px;
  background: var(--rt-field);
  color: var(--rt-body);
  font-family: inherit;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input {
  padding: 0.5rem 1rem;
  padding-inline-start: 2.8rem;
}

.search-input::placeholder {
  color: #9ca3af;
}

.status-select {
  position: relative;
  flex: none;
  width: 176px;
}

.status-select-input {
  padding: 0.5rem 1rem;
  padding-inline-end: 2.5rem;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.select-chevron {
  position: absolute;
  top: 50%;
  inset-inline-end: 1rem;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input:focus,
.status-select-input:focus {
  border-color: var(--rt-primary);
}

/* Table card */
.table-card {
  overflow: hidden;
  border: 1px solid var(--rt-border);
  border-radius: 10px;
  background: var(--rt-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.table-scroll {
  overflow-x: auto;
}

.returns-table {
  width: 100%;
  border-collapse: collapse;
}

.returns-table th {
  padding: 1rem;
  background: var(--rt-head);
  border-bottom: 1px solid var(--rt-row-border);
  text-align: start;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--rt-muted);
  white-space: nowrap;
}

.returns-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--rt-row-border);
  vertical-align: middle;
  font-size: 0.85rem;
  color: var(--rt-body);
}

.returns-table tbody tr:last-child td {
  border-bottom: 0;
}

.returns-table tbody tr:hover td {
  background: var(--rt-hover);
}

.return-number {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  background: var(--rt-hover);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--rt-primary);
  white-space: nowrap;
}

.cell-text {
  font-size: 0.85rem;
  color: var(--rt-body);
  white-space: nowrap;
}

.cell-text.amount {
  font-weight: 800;
  color: var(--rt-text);
}

.date-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--rt-muted);
  white-space: nowrap;
}

.products-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.thumbs {
  display: flex;
  align-items: center;
}

.thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  overflow: hidden;
  border: 2px solid var(--rt-card);
  border-radius: 6px;
  background: #f3f4f6;
  color: #9ca3af;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.thumb + .thumb {
  margin-inline-start: -12px;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.products-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn.view:hover { color: #660033; background: #f3f4f6; }
.icon-btn.approve:hover { color: #059669; background: #ecfdf5; }
.icon-btn.reject:hover { color: #dc2626; background: #fef2f2; }

/* Footer */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-top: 1px solid var(--rt-row-border);
  background: var(--rt-head);
}

.footer-info {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--rt-muted);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.6rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--rt-muted);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled):not(.active) {
  background: var(--rt-hover);
  color: var(--rt-text);
}

.page-btn.active {
  background: #660033;
  color: #ffffff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* States */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  padding: 4rem 1.5rem;
  color: var(--rt-muted);
  font-size: 0.85rem;
}

.state-box p {
  margin: 0;
}

.state-box.error {
  color: #dc2626;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--rt-border);
  border-top-color: #660033;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-retry {
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 8px;
  background: #660033;
  color: #ffffff;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .status-select {
    width: 100%;
  }

  .table-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
