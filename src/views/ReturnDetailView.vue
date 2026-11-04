<template>
  <div class="return-detail-page">
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>{{ tx('جاري التحميل...', 'Loading...') }}</p>
    </div>

    <div v-else-if="error || !ret" class="state-box error">
      <p>{{ error || tx('لم يتم العثور على طلب الإرجاع', 'Return request not found') }}</p>
      <div class="state-actions">
        <button class="btn-outline" type="button" @click="goBack">{{ tx('العودة للمرتجعات', 'Back to returns') }}</button>
        <button class="btn-retry" type="button" @click="fetchReturn">{{ tx('إعادة المحاولة', 'Retry') }}</button>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <header class="page-head">
        <div class="head-main">
          <button class="back-btn" type="button" :title="tx('رجوع', 'Back')" :aria-label="tx('رجوع', 'Back')" @click="goBack">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <template v-if="isRtl"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></template>
              <template v-else><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></template>
            </svg>
          </button>
          <div class="head-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </div>
          <div class="head-text">
            <div class="head-title-row">
              <h1 class="head-title">{{ tx('طلب الاسترجاع', 'Return request') }} {{ returnLabel }}</h1>
              <ReturnStatusBadge :status="ret.status" size="md" />
            </div>
            <p class="head-subtitle">{{ tx('الطلب الأصلي:', 'Original order:') }} <bdi>{{ orderLabel }}</bdi> | <bdi>{{ formatDate(ret.date) }}</bdi></p>
          </div>
        </div>

        <div v-if="ret.status === 'pending'" class="head-actions">
          <button class="btn-approve" type="button" :disabled="busy" @click="handleApprove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            {{ tx('موافقة', 'Approve') }}
          </button>
          <button class="btn-reject" type="button" :disabled="busy" @click="showRejectModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            {{ tx('رفض', 'Reject') }}
          </button>
        </div>
      </header>

      <div class="detail-grid">
        <!-- Main column -->
        <div class="column">
          <section class="card">
            <div class="card-head"><h3>{{ tx('المنتجات المسترجعة', 'Returned products') }}</h3></div>
            <div class="table-scroll">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>{{ tx('المنتج', 'Product') }}</th>
                    <th>{{ tx('الكمية', 'Quantity') }}</th>
                    <th>{{ tx('السعر', 'Price') }}</th>
                    <th>{{ tx('الإجمالي', 'Total') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in displayItems" :key="item.key || index">
                    <td>
                      <div class="product-cell">
                        <div class="product-thumb">
                          <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
                          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                        <div class="product-texts">
                          <span class="product-name">{{ item.name }}</span>
                          <span v-if="item.condition" class="product-meta">{{ tx('الحالة:', 'Condition:') }} {{ conditionLabel(item.condition) }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="cell-text">{{ item.quantity }}</td>
                    <td class="cell-text"><RiyalAmount :value="item.unitPrice" /></td>
                    <td class="cell-text amount"><RiyalAmount :value="item.total" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h3>{{ tx('سبب الاسترجاع', 'Return reason') }}</h3></div>
            <div class="card-body stack">
              <p class="reason-text">{{ ret.reason || '—' }}</p>
              <div v-if="itemReasons.length" class="note-box">
                <p v-for="(line, index) in itemReasons" :key="index" class="note-text">{{ line }}</p>
              </div>
              <div v-if="ret.adminNotes" class="note-box">
                <p class="note-label">{{ tx('ملاحظة الإدارة', 'Admin note') }}</p>
                <p class="note-text">{{ ret.adminNotes }}</p>
              </div>
            </div>
          </section>
        </div>

        <!-- Side column -->
        <div class="column">
          <section class="card">
            <div class="card-head"><h3>{{ tx('معلومات العميل', 'Customer information') }}</h3></div>
            <div class="card-body">
              <div class="customer-row">
                <div class="customer-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div class="customer-texts">
                  <p class="customer-name">{{ ret.customerName }}</p>
                  <p class="customer-email">{{ ret.customerEmail }}</p>
                  <p v-if="ret.customerPhone" class="customer-email ltr">{{ ret.customerPhone }}</p>
                </div>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h3>{{ tx('تفاصيل الاسترجاع', 'Return details') }}</h3></div>
            <div class="card-body stack">
              <div class="detail-row">
                <span class="detail-label">{{ tx('مبلغ الاسترجاع', 'Refund amount') }}</span>
                <span class="detail-amount"><RiyalAmount :value="ret.refundAmount" /></span>
              </div>
              <div v-if="refundMethod" class="detail-row">
                <span class="detail-label">{{ tx('طريقة الاسترجاع', 'Refund method') }}</span>
                <span class="detail-value">{{ refundMethod }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">{{ tx('التاريخ', 'Date') }}</span>
                <bdi class="detail-value">{{ formatDate(ret.date) }}</bdi>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>

    <ReturnRejectModal v-model="showRejectModal" :busy="busy" @confirm="handleReject" />
  </div>
</template>

<script setup>
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import returnsService from '../services/returnsService';
import { useDialog } from '../composables/useDialog';
import ReturnStatusBadge from '../components/ReturnStatusBadge.vue';
import ReturnRejectModal from '../components/ReturnRejectModal.vue';
import RiyalAmount from '../components/RiyalAmount.vue';

const { tx, locale } = useAdminText();
const route = useRoute();
const router = useRouter();
const dialog = useDialog();

const isRtl = computed(() => locale.value !== 'en');

const ret = ref(null);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const showRejectModal = ref(false);

const returnLabel = computed(() => {
  const number = String(ret.value?.returnNumber ?? ret.value?.id ?? '');
  return /^RET-/i.test(number) ? number : `RET-${number}`;
});

const orderLabel = computed(() => {
  const number = String(ret.value?.orderNumber || ret.value?.orderId || '').replace(/^#/, '');
  if (!number) return '—';
  return /^\d+$/.test(number) ? `#${number}` : number;
});

const refundMethod = computed(() => {
  const raw = ret.value?.refund_method ?? ret.value?.refundMethod ?? ret.value?.refund_to;
  return raw ? String(raw) : '';
});

const unitPriceOf = (item) => {
  if (item.unitPrice > 0) return item.unitPrice;
  return (Number(item.refundAmount) || 0) / Math.max(1, Number(item.quantity) || 1);
};

const itemName = (item) => item.productNames?.[locale.value === 'en' ? 'en' : 'ar'] || item.productName;

const displayItems = computed(() => {
  const current = ret.value;
  if (!current) return [];
  if (current.items?.length) {
    return current.items.map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = unitPriceOf(item);
      return {
        key: item.orderItemId || item.id,
        name: itemName(item),
        image: item.productImage,
        condition: item.condition && item.condition !== '—' ? item.condition : '',
        quantity,
        unitPrice,
        total: Number(item.refundAmount) || unitPrice * quantity,
      };
    });
  }
  const refund = Number(current.refundAmount) || 0;
  return [{
    key: current.id,
    name: current.productName,
    image: current.productImage,
    condition: '',
    quantity: 1,
    unitPrice: refund,
    total: refund,
  }];
});

const itemReasons = computed(() => (ret.value?.items || [])
  .map(item => item.reason)
  .filter(reason => reason && reason !== '—' && reason !== ret.value.reason));

const conditionLabel = (condition) => {
  const labels = {
    unopened: ['غير مفتوح', 'Unopened'],
    opened: ['تم فتحه', 'Opened'],
    damaged: ['تالف', 'Damaged'],
  }[String(condition || '').toLowerCase()];
  return labels ? tx(...labels) : condition;
};

const formatDate = (date) => (date ? String(date).slice(0, 10) : '—');

const goBack = () => router.push('/admin/returns');

const fetchReturn = async () => {
  loading.value = true;
  error.value = '';
  try {
    ret.value = await returnsService.getById(route.params.id);
  } catch (err) {
    try {
      const all = await returnsService.listAll();
      ret.value = all.find(item => String(item.id) === String(route.params.id)) || null;
    } catch (listErr) {
      console.error('Failed to fetch return:', err, listErr);
      error.value = apiErrorMessage(listErr?.response ? listErr : err, 'فشل تحميل طلب الإرجاع');
    }
  } finally {
    loading.value = false;
  }
};

const handleApprove = async () => {
  const confirmed = await dialog.confirm('هل أنت متأكد من قبول هذا الطلب؟ سيتم إضافة المبلغ إلى رصيد العميل.', {
    title: 'قبول طلب الإرجاع',
    confirmText: 'قبول الطلب',
  });
  if (!confirmed) return;

  busy.value = true;
  try {
    await returnsService.updateStatus(ret.value.id, { status: 'approved' });
    await fetchReturn();
    dialog.alert('تم قبول طلب الإرجاع بنجاح', { type: 'success', title: 'قبول طلب الإرجاع' });
  } catch (err) {
    dialog.alert(apiErrorMessage(err, 'فشل قبول الطلب'), { type: 'error', title: 'قبول طلب الإرجاع' });
  } finally {
    busy.value = false;
  }
};

const handleReject = async (reason) => {
  busy.value = true;
  try {
    await returnsService.updateStatus(ret.value.id, { status: 'rejected', admin_notes: reason });
    showRejectModal.value = false;
    await fetchReturn();
    dialog.alert('تم رفض طلب الإرجاع', { type: 'success', title: 'رفض طلب الإرجاع' });
  } catch (err) {
    dialog.alert(apiErrorMessage(err, 'فشل رفض الطلب'), { type: 'error', title: 'رفض طلب الإرجاع' });
  } finally {
    busy.value = false;
  }
};

onMounted(fetchReturn);
</script>

<style scoped>
.return-detail-page {
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

:global(.dark) .return-detail-page {
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
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.head-main {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--rt-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--rt-hover);
  color: var(--rt-text);
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

.head-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.head-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--rt-text);
}

.head-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--rt-muted);
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-approve,
.btn-reject,
.btn-outline,
.btn-retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height: 36px;
  padding: 0 0.9rem;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve {
  border: 1px solid #10b981;
  background: #10b981;
  color: #ffffff;
}

.btn-approve:hover:not(:disabled) {
  border-color: #059669;
  background: #059669;
}

.btn-reject {
  border: 1px solid #dc2626;
  background: var(--rt-card);
  color: #dc2626;
}

.btn-reject:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-outline {
  border: 1px solid var(--rt-border);
  background: var(--rt-card);
  color: var(--rt-body);
}

.btn-outline:hover {
  background: var(--rt-head);
}

.btn-retry {
  border: 1px solid #660033;
  background: #660033;
  color: #ffffff;
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Layout */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 363px;
  gap: 1.5rem;
  align-items: start;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.card {
  overflow: hidden;
  border: 1px solid var(--rt-border);
  border-radius: 10px;
  background: var(--rt-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.card-head {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--rt-border);
  background: var(--rt-head);
}

.card-head h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--rt-text);
}

.card-body {
  padding: 1.5rem;
}

.card-body.stack {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.table-scroll {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid var(--rt-row-border);
  background: var(--rt-head);
  text-align: start;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--rt-muted);
  white-space: nowrap;
}

.items-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--rt-row-border);
  vertical-align: middle;
}

.items-table tbody tr:last-child td {
  border-bottom: 0;
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

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.product-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--rt-border);
  border-radius: 8px;
  background: #f3f4f6;
  color: #9ca3af;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.product-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--rt-text);
}

.product-meta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rt-muted);
}

.reason-text {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.6;
  color: var(--rt-body);
}

.note-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0.8rem 1rem;
  border: 1px solid var(--rt-border);
  border-radius: 8px;
  background: var(--rt-head);
}

.note-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #9ca3af;
}

.note-text {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.6;
  color: var(--rt-body);
}

/* Side cards */
.customer-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.customer-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 8px;
  background: var(--rt-hover);
  color: var(--rt-primary);
}

.customer-texts {
  min-width: 0;
}

.customer-name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--rt-text);
}

.customer-email {
  margin: 0;
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rt-muted);
  text-overflow: ellipsis;
}

.customer-email.ltr {
  direction: ltr;
  text-align: start;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--rt-muted);
}

.detail-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--rt-text);
}

.detail-amount {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--rt-text);
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

.state-actions {
  display: flex;
  gap: 0.5rem;
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

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .card-body {
    padding: 1rem;
  }

  .card-head,
  .items-table th,
  .items-table td {
    padding-inline: 1rem;
  }
}
</style>
