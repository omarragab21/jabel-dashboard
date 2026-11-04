<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import RiyalAmount from '../components/RiyalAmount.vue';
import StockAdjustDialog from '../components/StockAdjustDialog.vue';
import { adminInventoryService } from '../application/adminInventoryService';
import {
  MOVEMENT_TYPES, dayOf, movementReasonText, movementTypeLabel, stockBarPercent, stockStatus, stockStatusLabel, timeOf, toMovementQuery,
} from '../domain/inventory/inventory';

const { tx, locale } = useAdminText();
const route = useRoute();
const productId = computed(() => route.params.id);

const product = ref(null);
const notFound = ref(false);
const loadError = ref(false);
const loading = ref(true);

const report = ref(null);
const historyLoading = ref(false);
const historyError = ref(false);
const filters = ref({ type: '', direction: '', from: '', to: '' });
const page = ref(1);
const rangeInvalid = computed(() => toMovementQuery(filters.value) === null);

const nameOf = (item) => item?.name_i18n?.[locale.value] || item?.name_i18n?.ar || item?.name_i18n?.en || item?.name || '';
const image = computed(() => (Array.isArray(product.value?.images) && product.value.images[0]) || '/brand/tijara-logo.png');
const stock = computed(() => Number(product.value?.stock) || 0);
const status = computed(() => stockStatus(stock.value));
const signed = (n) => (n > 0 ? `+${n}` : String(n));

const loadProduct = async () => {
  loading.value = true;
  notFound.value = false;
  loadError.value = false;
  try {
    product.value = await adminInventoryService.getProduct(productId.value);
  } catch (error) {
    if (error?.response?.status === 404) notFound.value = true;
    else loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const loadHistory = async () => {
  const query = toMovementQuery({ ...filters.value, page: page.value });
  if (!query) return;
  historyLoading.value = true;
  historyError.value = false;
  try {
    report.value = await adminInventoryService.productMovements(productId.value, query);
  } catch (error) {
    if (error?.response?.status === 404) notFound.value = true;
    else historyError.value = true;
  } finally {
    historyLoading.value = false;
  }
};

watch(filters, () => {
  if (page.value !== 1) page.value = 1;
  else loadHistory();
}, { deep: true });
watch(page, loadHistory);
watch(productId, () => { page.value = 1; loadProduct(); loadHistory(); });

const adjustMode = ref('add');
const adjustTarget = ref(null);
const openAdjust = (mode) => {
  adjustMode.value = mode;
  adjustTarget.value = { id: product.value.id, name: nameOf(product.value), stock: stock.value };
};
const toastText = ref('');
let toastTimer;
const onAdjusted = ({ stock: next }) => {
  const diff = Math.abs(next - stock.value);
  product.value = { ...product.value, stock: next, number: next };
  toastText.value = adjustMode.value === 'remove'
    ? tx(`تم خصم ${diff}. المتوفر الآن ${next}`, `Removed ${diff}. Now ${next} in stock`)
    : tx(`تمت إضافة ${diff}. المتوفر الآن ${next}`, `Added ${diff}. Now ${next} in stock`);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastText.value = ''; }, 4000);
  adjustTarget.value = null;
  if (page.value !== 1) page.value = 1;
  else loadHistory();
};

onMounted(() => { loadProduct(); loadHistory(); });
</script>

<template>
  <div class="inventory-product" data-testid="inventory-product">
    <router-link :to="{ name: 'Inventory' }" class="back-link" data-testid="back-to-inventory">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      {{ tx('إدارة المخزون', 'Inventory') }}
    </router-link>

    <div v-if="loading" class="state-card"><span class="loader"></span>{{ tx('جاري التحميل...', 'Loading...') }}</div>
    <div v-else-if="notFound" class="state-card" data-testid="product-not-found">
      {{ tx('المنتج ده مش موجود أو اتحذف.', 'This product does not exist or was deleted.') }}
      <router-link :to="{ name: 'Inventory' }" class="link-btn">{{ tx('رجوع لإدارة المخزون', 'Back to inventory') }}</router-link>
    </div>
    <div v-else-if="loadError" class="state-card" data-testid="product-error">
      {{ tx('تعذّر تحميل المنتج.', 'Could not load the product.') }}
      <button type="button" class="link-btn" @click="loadProduct(); loadHistory();">{{ tx('إعادة المحاولة', 'Retry') }}</button>
    </div>

    <template v-else-if="product">
      <div class="product-header">
        <div class="product-id">
          <img :src="image" alt="" class="product-img" @error="$event.target.src = '/brand/tijara-logo.png'" />
          <div>
            <h1 class="product-title" data-testid="product-title">{{ nameOf(product) }}</h1>
            <p class="product-meta">#{{ product.id }} · {{ nameOf(product.category) || tx('غير محدد', 'Uncategorized') }} · <RiyalAmount :value="product.final_price ?? product.price" /></p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn add" data-testid="detail-add-stock" @click="openAdjust('add')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ tx('إضافة مخزون', 'Add stock') }}
          </button>
          <button type="button" class="btn remove" :disabled="stock <= 0" data-testid="detail-remove-stock" @click="openAdjust('remove')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ tx('خصم مخزون', 'Remove stock') }}
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" data-testid="detail-stock">
          <span class="stat-label">{{ tx('الكمية الحالية', 'Current stock') }}</span>
          <b class="stat-value" data-testid="detail-stock-value">{{ stock }}</b>
          <span class="stock-bar"><span :class="status" :style="{ width: stockBarPercent(stock) + '%' }"></span></span>
          <span class="status-pill" :class="status" data-testid="detail-status">{{ stockStatusLabel(status, locale) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ tx('إجمالي الوارد', 'Total in') }}</span>
          <b class="stat-value pos" dir="ltr" data-testid="detail-in">{{ report ? signed(report.overview.unitsIn) : '…' }}</b>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ tx('إجمالي الصادر', 'Total out') }}</span>
          <b class="stat-value neg" dir="ltr" data-testid="detail-out">{{ report ? (report.overview.unitsOut ? `-${report.overview.unitsOut}` : 0) : '…' }}</b>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ tx('قيمة المخزون الحالي', 'Current stock value') }}</span>
          <b class="stat-value"><RiyalAmount :value="Math.round(stock * Number(product.final_price ?? product.price ?? 0))" /></b>
        </div>
      </div>

      <div class="history-card">
        <div class="history-head">
          <h2>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 14"/></svg>
            {{ tx('سجل حركة المخزون', 'Stock movement history') }}
            <span v-if="report" class="count" data-testid="detail-count">{{ report.overview.transactions }}</span>
          </h2>
          <div class="history-filters">
            <select v-model="filters.type" data-testid="detail-type" :aria-label="tx('نوع الحركة', 'Type')">
              <option value="">{{ tx('كل الأنواع', 'All types') }}</option>
              <option v-for="type in MOVEMENT_TYPES" :key="type" :value="type">{{ movementTypeLabel(type, locale) }}</option>
            </select>
            <select v-model="filters.direction" data-testid="detail-direction" :aria-label="tx('الاتجاه', 'Direction')">
              <option value="">{{ tx('وارد وصادر', 'In and out') }}</option>
              <option value="in">{{ tx('وارد فقط', 'In only') }}</option>
              <option value="out">{{ tx('صادر فقط', 'Out only') }}</option>
            </select>
            <input v-model="filters.from" type="date" lang="en-GB" :aria-label="tx('من', 'From')" data-testid="detail-from" />
            <input v-model="filters.to" type="date" lang="en-GB" :aria-label="tx('إلى', 'To')" data-testid="detail-to" />
          </div>
        </div>
        <div v-if="rangeInvalid" class="range-error" role="alert" data-testid="detail-range-error">{{ tx('تاريخ البداية لازم يكون قبل تاريخ النهاية', 'The start date must be before the end date') }}</div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ tx('النوع', 'Type') }}</th>
                <th class="center">{{ tx('الكمية', 'Quantity') }}</th>
                <th class="center">{{ tx('قبل ← بعد', 'Before → after') }}</th>
                <th>{{ tx('السبب', 'Reason') }}</th>
                <th>{{ tx('المرجع', 'Reference') }}</th>
                <th>{{ tx('التاريخ', 'Date') }}</th>
                <th>{{ tx('بواسطة', 'By') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="historyLoading && !report" class="state-row"><td colspan="7"><span class="loader"></span>{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
              <tr v-else-if="historyError" class="state-row" data-testid="detail-history-error">
                <td colspan="7">{{ tx('تعذّر تحميل السجل.', 'Could not load the history.') }} <button type="button" class="link-btn" @click="loadHistory">{{ tx('إعادة المحاولة', 'Retry') }}</button></td>
              </tr>
              <tr v-else-if="report && !report.movements.length" class="state-row" data-testid="detail-empty"><td colspan="7">{{ tx('لا توجد حركات مطابقة', 'No matching movements') }}</td></tr>
              <template v-else-if="report">
                <tr v-for="move in report.movements" :key="move.id" class="data-row" :class="{ dim: historyLoading }" data-testid="detail-row" :data-type="move.type" :data-direction="move.direction">
                  <td><span class="type-chip" :class="move.direction">{{ move.direction === 'in' ? tx('وارد', 'In') : tx('صادر', 'Out') }} · {{ movementTypeLabel(move.type, locale) }}</span></td>
                  <td class="center"><b dir="ltr" :class="move.direction === 'in' ? 'pos' : 'neg'" data-testid="detail-row-qty">{{ signed(move.quantity) }}</b></td>
                  <td class="center muted" >{{ move.previousStock }} {{ locale === 'en' ? '→' : '←' }} {{ move.currentStock }}</td>
                  <td class="reason-cell">
                    <span data-testid="detail-row-reason">{{ movementReasonText(move.reason, locale) || '—' }}</span>
                    <small v-if="move.notes" data-testid="detail-row-notes">{{ move.notes }}</small>
                  </td>
                  <td>
                    <router-link v-if="move.reference?.type === 'Order'" :to="{ path: '/admin/orders', query: { search: move.reference.identifier } }" class="ref-link">{{ move.reference.identifier }}</router-link>
                    <span v-else class="muted">—</span>
                  </td>
                  <td class="muted nowrap"><span dir="ltr">{{ dayOf(move.occurredAt) }}</span> <small dir="ltr">{{ timeOf(move.occurredAt) }}</small></td>
                  <td class="muted">{{ move.user?.name || tx('النظام', 'System') }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="report && report.pagination.lastPage > 1" class="table-footer">
          <span class="muted">{{ tx(`${report.pagination.total} حركة`, `${report.pagination.total} movements`) }}</span>
          <div class="pager">
            <button type="button" :disabled="page <= 1 || historyLoading" :aria-label="tx('السابق', 'Previous')" @click="page -= 1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline :points="locale === 'en' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'"/></svg></button>
            <span class="page-num" dir="ltr">{{ report.pagination.page }} / {{ report.pagination.lastPage }}</span>
            <button type="button" :disabled="page >= report.pagination.lastPage || historyLoading" :aria-label="tx('التالي', 'Next')" @click="page += 1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline :points="locale === 'en' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/></svg></button>
          </div>
        </div>
      </div>
    </template>

    <StockAdjustDialog :product="adjustTarget" :mode="adjustMode" @close="adjustTarget = null" @done="onAdjusted" />
    <div class="alert-toast success" :class="{ show: toastText }" role="status" data-testid="toast">{{ toastText }}</div>
  </div>
</template>

<style scoped>
.inventory-product { display: flex; flex-direction: column; gap: 1.1rem; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem; }
.back-link { display: inline-flex; align-items: center; gap: 0.3rem; color: #6b7280; text-decoration: none; font-size: 0.82rem; font-weight: 600; width: fit-content; }
.back-link:hover { color: #660033; }
[dir='ltr'] .back-link svg { transform: scaleX(-1); }
.state-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2.5rem; text-align: center; color: #6b7280; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
.link-btn { background: none; border: none; color: #660033; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: underline; }

.product-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.product-id { display: flex; align-items: center; gap: 0.9rem; min-width: 0; }
.product-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: #f3f4f6; flex-shrink: 0; }
.product-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
.product-meta { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.header-actions { display: flex; gap: 0.6rem; }
.btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; border-radius: 8px; background: #fff; font-family: inherit; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
/* Add and remove stock look the same: one border and one brand colour. */
.btn.add, .btn.remove { border: 1px solid #d1d5db; color: #660033; }
.btn.add:hover:not(:disabled), .btn.remove:hover:not(:disabled) { background: #f9fafb; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.stat-card { display: flex; flex-direction: column; gap: 0.45rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-label { font-size: 0.76rem; color: #6b7280; }
.stat-value { font-size: 1.6rem; font-weight: 800; color: #111827; line-height: 1.2; }
.stock-bar { width: 100%; height: 6px; border-radius: 999px; background: #e5e7eb; overflow: hidden; display: block; }
.stock-bar span { display: block; height: 100%; border-radius: 999px; }
.stock-bar .in { background: #22c55e; }
.stock-bar .low { background: #f59e0b; }
.stock-bar .out { background: #ef4444; }
.status-pill { align-self: flex-start; padding: 0.15rem 0.7rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.status-pill.in { background: #dcfce7; color: #15803d; }
.status-pill.low { background: #ffedd5; color: #c2410c; }
.status-pill.out { background: #fee2e2; color: #b91c1c; }
.pos { color: #15803d; }
.neg { color: #b91c1c; }

.history-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
.history-head { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap; padding: 0.9rem 1.1rem; border-bottom: 1px solid #e5e7eb; background: #fafafa; }
.history-head h2 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 0.45rem; }
.count { background: #f6e9ef; color: #660033; border-radius: 999px; padding: 0 0.55rem; font-size: 0.74rem; }
.history-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.history-filters select, .history-filters input { height: 38px; padding: 0 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.8rem; background: #fff; }
.range-error { margin: 0.8rem 1.1rem 0; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 0.55rem 0.9rem; font-size: 0.8rem; font-weight: 600; }
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.8rem 0.9rem; border-bottom: 1px solid #f0f0f0; text-align: start; vertical-align: middle; }
.data-table th { font-size: 0.76rem; font-weight: 700; color: #374151; white-space: nowrap; }
.data-table td { font-size: 0.83rem; color: #1f2937; }
.data-table th.center, .data-table td.center { text-align: center; }
.data-row.dim { opacity: 0.55; }
.state-row td { text-align: center; color: #6b7280; padding: 2.2rem; }
.muted { color: #6b7280; }
.nowrap { white-space: nowrap; }
.nowrap small { color: #9ca3af; }
.type-chip { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.type-chip.in { background: #dcfce7; color: #15803d; }
.type-chip.out { background: #fee2e2; color: #b91c1c; }
.reason-cell span { display: block; }
.reason-cell small { display: block; color: #6b7280; margin-top: 0.15rem; }
.ref-link { color: #660033; font-weight: 700; text-decoration: none; direction: ltr; }
.ref-link:hover { text-decoration: underline; }
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; font-size: 0.8rem; }
.pager { display: inline-flex; align-items: center; gap: 0.4rem; }
.pager button { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 1.1rem; }
.pager button:disabled { opacity: 0.4; cursor: not-allowed; }
.page-num { min-width: 48px; text-align: center; font-weight: 700; color: #660033; }
.loader { display: inline-block; width: 14px; height: 14px; border: 2px solid #e5e7eb; border-top-color: #660033; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-inline-end: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .stats-grid { grid-template-columns: 1fr; }
  .header-actions { width: 100%; }
  .header-actions .btn { flex: 1; justify-content: center; }
  .history-filters { width: 100%; }
  .history-filters select, .history-filters input { flex: 1; min-width: 0; }
}
</style>
