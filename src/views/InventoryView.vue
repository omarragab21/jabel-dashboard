<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import RiyalAmount from '../components/RiyalAmount.vue';
import StockAdjustDialog from '../components/StockAdjustDialog.vue';
import { adminInventoryService } from '../application/adminInventoryService';
import {
  LOW_STOCK_LIMIT, MOVEMENT_TYPES, dayOf, filterInventory, inventoryStats, movementReasonText, movementTypeLabel,
  productCategoryId, stockAlerts, stockBarPercent, stockStatus, stockStatusLabel, timeOf, toCsv, toMovementQuery,
} from '../domain/inventory/inventory';

const { tx, locale } = useAdminText();
const route = useRoute();
const router = useRouter();

const tab = ref(route.query.tab === 'movements' ? 'movements' : 'stock');
watch(tab, (value) => {
  router.replace({ query: { ...route.query, tab: value === 'movements' ? 'movements' : undefined } });
  if (value === 'movements' && !report.value && !movementsLoading.value) loadMovements();
});

// ---------- stock ----------
const products = ref([]);
const loading = ref(true);
const loadError = ref(false);
const search = ref('');
const categoryFilter = ref('');
const statusFilter = ref(route.query.status && ['in', 'low', 'out'].includes(route.query.status) ? route.query.status : '');
const page = ref(1);
const PER_PAGE = 10;

const nameOf = (item) => item?.name_i18n?.[locale.value] || item?.name_i18n?.ar || item?.name_i18n?.en || item?.name || '';
const categoryLabel = (product) => nameOf(product.category) || tx('غير محدد', 'Uncategorized');
const productImage = (product) => {
  const first = Array.isArray(product.images) ? product.images[0] : product.images;
  return first || product.image_url || '/brand/tijara-logo.png';
};
const onImageError = (event) => {
  if (event?.target && !event.target.src.endsWith('/brand/tijara-logo.png')) event.target.src = '/brand/tijara-logo.png';
};

const stats = computed(() => inventoryStats(products.value));
const alerts = computed(() => stockAlerts(products.value));
const ALERT_LIMIT = 12;

const categoryOptions = computed(() => {
  const map = new Map();
  products.value.forEach((product) => {
    const id = productCategoryId(product);
    if (id != null && !map.has(String(id))) map.set(String(id), categoryLabel(product));
  });
  return [...map].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, locale.value));
});

const filtered = computed(() => filterInventory(products.value, { search: search.value, categoryId: categoryFilter.value, status: statusFilter.value })
  .slice().sort((a, b) => Number(b.id) - Number(a.id)));
const lastPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)));
const pageRows = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE));
const rangeText = computed(() => {
  if (!filtered.value.length) return tx('لا توجد نتائج', 'No results');
  const start = (page.value - 1) * PER_PAGE + 1;
  const end = Math.min(page.value * PER_PAGE, filtered.value.length);
  return tx(`عرض ${start}-${end} من ${filtered.value.length}`, `Showing ${start}-${end} of ${filtered.value.length}`);
});
watch([search, categoryFilter, statusFilter], () => { page.value = 1; });
watch(lastPage, (last) => { if (page.value > last) page.value = last; });

const loadStock = async () => {
  loading.value = true;
  loadError.value = false;
  try {
    products.value = await adminInventoryService.listStock();
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => { search.value = ''; categoryFilter.value = ''; statusFilter.value = ''; };

const exportCsv = () => {
  const header = [tx('رقم المنتج', 'Product #'), tx('المنتج', 'Product'), tx('القسم', 'Category'), tx('السعر', 'Price'), tx('المتوفر', 'In stock'), tx('الحالة', 'Status')];
  const rows = filtered.value.map((product) => [product.id, nameOf(product), categoryLabel(product), product.final_price ?? product.price ?? '', product.stock ?? 0, stockStatusLabel(stockStatus(product.stock), locale.value)]);
  const blob = new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ---------- adjust ----------
const adjustTarget = ref(null);
const adjustMode = ref('add');
const openAdjust = (product, mode) => {
  adjustMode.value = mode;
  adjustTarget.value = { id: product.id, name: nameOf(product), stock: Number(product.stock) || 0 };
};
const onAdjusted = ({ stock }) => {
  const target = products.value.find((product) => String(product.id) === String(adjustTarget.value.id));
  const before = Number(target?.stock) || 0;
  if (target) target.stock = stock;
  const diff = Math.abs(stock - before);
  toast(adjustMode.value === 'remove'
    ? tx(`تم خصم ${diff} من «${adjustTarget.value.name}». المتوفر الآن ${stock}`, `Removed ${diff} from “${adjustTarget.value.name}”. Now ${stock} in stock`)
    : tx(`تمت إضافة ${diff} إلى «${adjustTarget.value.name}». المتوفر الآن ${stock}`, `Added ${diff} to “${adjustTarget.value.name}”. Now ${stock} in stock`));
  adjustTarget.value = null;
  report.value = null; // the movements report is stale now
  if (tab.value === 'movements') loadMovements();
};

const openProduct = (product) => router.push({ name: 'InventoryProduct', params: { id: product.id } });

// ---------- movements ----------
const report = ref(null);
const movementsLoading = ref(false);
const movementsError = ref(false);
const movementFilters = ref({ type: '', direction: '', from: '', to: '', productId: '' });
const movementPage = ref(1);
const rangeInvalid = computed(() => toMovementQuery(movementFilters.value) === null);

const loadMovements = async () => {
  const query = toMovementQuery({ ...movementFilters.value, page: movementPage.value });
  if (!query) return;
  movementsLoading.value = true;
  movementsError.value = false;
  try {
    report.value = await adminInventoryService.listMovements(query);
  } catch {
    movementsError.value = true;
  } finally {
    movementsLoading.value = false;
  }
};
watch(movementFilters, () => {
  // Going back to page 1 reloads through the page watcher; otherwise reload here.
  if (movementPage.value !== 1) movementPage.value = 1;
  else loadMovements();
}, { deep: true });
watch(movementPage, loadMovements);
const resetMovementFilters = () => { movementFilters.value = { type: '', direction: '', from: '', to: '', productId: '' }; };
const productOptions = computed(() => products.value.slice().sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale.value)));

const signed = (n) => (n > 0 ? `+${n}` : String(n));

// ---------- toast ----------
const toastText = ref('');
const toastType = ref('success');
let toastTimer;
const toast = (text, type = 'success') => {
  toastText.value = text;
  toastType.value = type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastText.value = ''; }, 4000);
};

onMounted(() => {
  loadStock();
  if (tab.value === 'movements') loadMovements();
});
</script>

<template>
  <div class="inventory-page" data-testid="inventory-page">
    <div class="page-header">
      <div class="header-titles">
        <div>
          <h2 class="page-title">{{ tx('إدارة المخزون', 'Inventory') }}</h2>
          <p class="page-subtitle">{{ tx('مراقبة وإدارة مخزون المنتجات', 'Monitor and manage product stock') }}</p>
        </div>
      </div>
      <button v-if="tab === 'stock'" class="export-btn" type="button" :disabled="loading || !filtered.length" data-testid="export-csv" @click="exportCsv">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2M8 17h2M14 13h2M14 17h2"/></svg>
        {{ tx('تصدير Excel (CSV)', 'Export Excel (CSV)') }}
      </button>
    </div>

    <div class="tabs" role="tablist">
      <button role="tab" type="button" :class="{ active: tab === 'stock' }" :aria-selected="tab === 'stock'" data-testid="tab-stock" @click="tab = 'stock'">{{ tx('المخزون', 'Stock') }}</button>
      <button role="tab" type="button" :class="{ active: tab === 'movements' }" :aria-selected="tab === 'movements'" data-testid="tab-movements" @click="tab = 'movements'">{{ tx('حركة المخزون', 'Stock movements') }}</button>
    </div>

    <!-- ===================== STOCK ===================== -->
    <template v-if="tab === 'stock'">
      <div class="stats-grid">
        <div class="stat-card" data-testid="stat-total">
          <span class="stat-icon brand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
          <div><b class="stat-value">{{ loading ? '…' : stats.total }}</b><span class="stat-label">{{ tx('إجمالي المنتجات', 'Total products') }}</span></div>
        </div>
        <button type="button" class="stat-card clickable" data-testid="stat-out" @click="statusFilter = 'out'">
          <span class="stat-icon red"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <div><b class="stat-value">{{ loading ? '…' : stats.out }}</b><span class="stat-label">{{ tx('نفاد المخزون', 'Out of stock') }}</span></div>
        </button>
        <button type="button" class="stat-card clickable" data-testid="stat-low" @click="statusFilter = 'low'">
          <span class="stat-icon orange"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg></span>
          <div><b class="stat-value">{{ loading ? '…' : stats.low }}</b><span class="stat-label">{{ tx(`مخزون منخفض (${LOW_STOCK_LIMIT} أو أقل)`, `Low stock (${LOW_STOCK_LIMIT} or fewer)`) }}</span></div>
        </button>
        <div class="stat-card" data-testid="stat-value">
          <span class="stat-icon green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></span>
          <div><b class="stat-value"><span v-if="loading">…</span><RiyalAmount v-else :value="Math.round(stats.value)" /></b><span class="stat-label">{{ tx('قيمة المخزون', 'Stock value') }}</span></div>
        </div>
      </div>

      <div v-if="!loading && alerts.length" class="alerts-card" data-testid="stock-alerts">
        <div class="alerts-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {{ tx('تنبيهات المخزون', 'Stock alerts') }} <span class="alerts-count">{{ alerts.length }}</span>
        </div>
        <div class="alert-chips">
          <button
            v-for="product in alerts.slice(0, ALERT_LIMIT)" :key="product.id" type="button"
            class="alert-chip" :class="stockStatus(product.stock)" :title="nameOf(product)" data-testid="alert-chip" @click="openProduct(product)"
          >
            <template v-if="stockStatus(product.stock) === 'out'">{{ tx('نفاد', 'Out') }} - {{ nameOf(product) }}</template>
            <template v-else>{{ tx(`متبقي ${product.stock}`, `${product.stock} left`) }} - {{ nameOf(product) }}</template>
          </button>
          <span v-if="alerts.length > ALERT_LIMIT" class="alert-more">+{{ alerts.length - ALERT_LIMIT }}</span>
        </div>
      </div>

      <div class="filters-card">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" type="search" :placeholder="tx('بحث باسم المنتج أو رقمه...', 'Search by product name or number...')" data-testid="stock-search" />
        </div>
        <div class="select-wrapper filter-select">
          <select v-model="categoryFilter" data-testid="category-filter" :aria-label="tx('القسم', 'Category')">
            <option value="">{{ tx('جميع الأقسام', 'All categories') }}</option>
            <option v-for="option in categoryOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
          </select>
          <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="select-wrapper filter-select">
          <select v-model="statusFilter" data-testid="status-filter" :aria-label="tx('الحالة', 'Status')">
            <option value="">{{ tx('كل الحالات', 'All statuses') }}</option>
            <option value="in">{{ stockStatusLabel('in', locale) }}</option>
            <option value="low">{{ stockStatusLabel('low', locale) }}</option>
            <option value="out">{{ stockStatusLabel('out', locale) }}</option>
          </select>
          <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ tx('المنتج', 'Product') }}</th>
              <th class="col-wide">{{ tx('رقم المنتج', 'Product #') }}</th>
              <th class="col-wide">{{ tx('القسم', 'Category') }}</th>
              <th class="col-wide">{{ tx('السعر', 'Price') }}</th>
              <th class="center">{{ tx('المتوفر', 'In stock') }}</th>
              <th class="center col-status">{{ tx('الحالة', 'Status') }}</th>
              <th class="center">{{ tx('الإجراءات', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="state-row"><td colspan="7"><span class="loader"></span>{{ tx('جاري تحميل المخزون...', 'Loading stock...') }}</td></tr>
            <tr v-else-if="loadError" class="state-row" data-testid="stock-error">
              <td colspan="7">{{ tx('تعذّر تحميل المخزون.', 'Could not load the stock.') }} <button class="link-btn" type="button" data-testid="stock-retry" @click="loadStock">{{ tx('إعادة المحاولة', 'Retry') }}</button></td>
            </tr>
            <tr v-else-if="!pageRows.length" class="state-row" data-testid="stock-empty">
              <td colspan="7">{{ tx('لا توجد منتجات مطابقة', 'No matching products') }} <button class="link-btn" type="button" @click="resetFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button></td>
            </tr>
            <template v-else>
            <tr v-for="product in pageRows" :key="product.id" class="data-row" data-testid="stock-row" :data-id="product.id" :data-status="stockStatus(product.stock)">
              <td>
                <div class="product-cell">
                  <img :src="productImage(product)" alt="" class="product-thumb" @error="onImageError" />
                  <button type="button" class="product-name" @click="openProduct(product)">{{ nameOf(product) }}</button>
                </div>
              </td>
              <td class="muted ltr-num col-wide">#{{ product.id }}</td>
              <td class="muted col-wide">{{ categoryLabel(product) }}</td>
              <td class="col-wide"><RiyalAmount :value="product.final_price ?? product.price" /></td>
              <td class="center">
                <div class="stock-cell">
                  <b data-testid="row-stock">{{ product.stock ?? 0 }}</b>
 <span class="stock-bar"><span :class="stockStatus(product.stock)" :style="{ width: stockBarPercent(product.stock) + '%' }"></span></span>
                  <span class="status-pill mobile-status" :class="stockStatus(product.stock)">{{ stockStatusLabel(stockStatus(product.stock), locale) }}</span>
                </div>
              </td>
              <td class="center col-status"><span class="status-pill" :class="stockStatus(product.stock)" data-testid="stock-status">{{ stockStatusLabel(stockStatus(product.stock), locale) }}</span></td>
              <td class="center">
                <div class="actions-group">
                  <button class="action-btn view" type="button" :title="tx('سجل الحركة', 'Movement history')" data-testid="view-product" @click="openProduct(product)">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn add" type="button" :title="tx('إضافة مخزون', 'Add stock')" data-testid="add-stock" @click="openAdjust(product, 'add')">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <button class="action-btn remove" type="button" :title="Number(product.stock) > 0 ? tx('خصم مخزون', 'Remove stock') : tx('لا يوجد مخزون للخصم', 'Nothing to remove')" :disabled="!(Number(product.stock) > 0)" data-testid="remove-stock" @click="openAdjust(product, 'remove')">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!loading && !loadError && filtered.length" class="table-footer">
          <span class="muted" data-testid="stock-range">{{ rangeText }}</span>
          <div class="pager">
            <button type="button" :disabled="page <= 1" :aria-label="tx('السابق', 'Previous')" data-testid="page-prev" @click="page -= 1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline :points="locale === 'en' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'"/></svg></button>
            <span class="page-num" dir="ltr" data-testid="page-num">{{ page }} / {{ lastPage }}</span>
            <button type="button" :disabled="page >= lastPage" :aria-label="tx('التالي', 'Next')" data-testid="page-next" @click="page += 1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline :points="locale === 'en' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/></svg></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ===================== MOVEMENTS ===================== -->
    <template v-else>
      <div class="stats-grid">
        <div class="stat-card" data-testid="mv-transactions"><span class="stat-icon brand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></span>
          <div><b class="stat-value">{{ report ? report.overview.transactions : '…' }}</b><span class="stat-label">{{ tx('عدد الحركات', 'Movements') }}</span></div></div>
        <div class="stat-card" data-testid="mv-in"><span class="stat-icon green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></span>
          <div><b class="stat-value">{{ report ? report.overview.unitsIn : '…' }}</b><span class="stat-label">{{ tx('وحدات واردة', 'Units in') }}</span></div></div>
        <div class="stat-card" data-testid="mv-out"><span class="stat-icon red"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></span>
          <div><b class="stat-value">{{ report ? report.overview.unitsOut : '…' }}</b><span class="stat-label">{{ tx('وحدات صادرة', 'Units out') }}</span></div></div>
        <div class="stat-card" data-testid="mv-net"><span class="stat-icon orange"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          <div><b class="stat-value" dir="ltr">{{ report ? signed(report.overview.net) : '…' }}</b><span class="stat-label">{{ tx('صافي التغيير', 'Net change') }}</span></div></div>
      </div>

      <div v-if="report && report.breakdown.length" class="breakdown" data-testid="mv-breakdown">
        <button
          v-for="row in report.breakdown" :key="row.type" type="button" class="breakdown-chip"
          :class="[row.type, { active: movementFilters.type === row.type }]"
          @click="movementFilters.type = movementFilters.type === row.type ? '' : row.type"
        >
          <b>{{ movementTypeLabel(row.type, locale) }}</b>
          <span>{{ row.transactions }} {{ tx('حركة', 'moves') }}</span>
          <span dir="ltr" :class="row.net >= 0 ? 'pos' : 'neg'">{{ signed(row.net) }}</span>
        </button>
      </div>

      <div class="filters-card wrap">
        <div class="select-wrapper filter-select">
          <select v-model="movementFilters.type" data-testid="mv-type" :aria-label="tx('نوع الحركة', 'Type')">
            <option value="">{{ tx('كل الأنواع', 'All types') }}</option>
            <option v-for="type in MOVEMENT_TYPES" :key="type" :value="type">{{ movementTypeLabel(type, locale) }}</option>
          </select>
          <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="select-wrapper filter-select">
          <select v-model="movementFilters.direction" data-testid="mv-direction" :aria-label="tx('الاتجاه', 'Direction')">
            <option value="">{{ tx('وارد وصادر', 'In and out') }}</option>
            <option value="in">{{ tx('وارد فقط', 'In only') }}</option>
            <option value="out">{{ tx('صادر فقط', 'Out only') }}</option>
          </select>
          <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="select-wrapper filter-select product-select">
          <select v-model="movementFilters.productId" :disabled="loading" data-testid="mv-product" :aria-label="tx('المنتج', 'Product')">
            <option value="">{{ loading ? tx('جاري تحميل المنتجات...', 'Loading products...') : tx('كل المنتجات', 'All products') }}</option>
            <option v-for="product in productOptions" :key="product.id" :value="String(product.id)">{{ nameOf(product) }}</option>
          </select>
          <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <label class="date-field">{{ tx('من', 'From') }} <input v-model="movementFilters.from" type="date" lang="en-GB" data-testid="mv-from" /></label>
        <label class="date-field">{{ tx('إلى', 'To') }} <input v-model="movementFilters.to" type="date" lang="en-GB" data-testid="mv-to" /></label>
        <button type="button" class="link-btn" data-testid="mv-reset" @click="resetMovementFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
      </div>
      <div v-if="rangeInvalid" class="range-error" role="alert" data-testid="mv-range-error">{{ tx('تاريخ البداية لازم يكون قبل تاريخ النهاية', 'The start date must be before the end date') }}</div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ tx('التاريخ', 'Date') }}</th>
              <th>{{ tx('المنتج', 'Product') }}</th>
              <th>{{ tx('النوع', 'Type') }}</th>
              <th class="center">{{ tx('الكمية', 'Quantity') }}</th>
              <th class="center">{{ tx('قبل ← بعد', 'Before → after') }}</th>
              <th>{{ tx('السبب', 'Reason') }}</th>
              <th>{{ tx('بواسطة', 'By') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="movementsLoading && !report" class="state-row"><td colspan="7"><span class="loader"></span>{{ tx('جاري تحميل الحركات...', 'Loading movements...') }}</td></tr>
            <tr v-else-if="movementsError" class="state-row" data-testid="mv-error">
              <td colspan="7">{{ tx('تعذّر تحميل حركة المخزون.', 'Could not load the stock movements.') }} <button class="link-btn" type="button" @click="loadMovements">{{ tx('إعادة المحاولة', 'Retry') }}</button></td>
            </tr>
            <tr v-else-if="report && !report.movements.length" class="state-row" data-testid="mv-empty"><td colspan="7">{{ tx('لا توجد حركات مطابقة', 'No matching movements') }}</td></tr>
            <template v-else-if="report">
              <tr v-for="move in report.movements" :key="move.id" class="data-row" :class="{ dim: movementsLoading }" data-testid="mv-row" :data-type="move.type" :data-direction="move.direction">
                <td class="muted nowrap"><span dir="ltr">{{ dayOf(move.occurredAt) }}</span><small dir="ltr">{{ timeOf(move.occurredAt) }}</small></td>
                <td>
                  <router-link v-if="move.product" :to="{ name: 'InventoryProduct', params: { id: move.product.id } }" class="product-link">{{ move.product.name }}</router-link>
                </td>
                <td><span class="type-chip" :class="move.direction">{{ move.direction === 'in' ? tx('وارد', 'In') : tx('صادر', 'Out') }} · {{ movementTypeLabel(move.type, locale) }}</span></td>
                <td class="center"><b dir="ltr" :class="move.direction === 'in' ? 'pos' : 'neg'" data-testid="mv-qty">{{ signed(move.quantity) }}</b></td>
                <td class="center muted" >{{ move.previousStock }} {{ locale === 'en' ? '→' : '←' }} {{ move.currentStock }}</td>
                <td class="reason-cell">
                  <span>{{ movementReasonText(move.reason, locale) || '—' }}</span>
                  <small v-if="move.notes">{{ move.notes }}</small>
                </td>
                <td class="muted">{{ move.user?.name || tx('النظام', 'System') }}</td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="report && report.movements.length" class="table-footer">
          <span class="muted" data-testid="mv-range">{{ tx(`${report.pagination.total} حركة`, `${report.pagination.total} movements`) }}</span>
          <div class="pager">
            <button type="button" :disabled="movementPage <= 1 || movementsLoading" :aria-label="tx('السابق', 'Previous')" data-testid="mv-prev" @click="movementPage -= 1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline :points="locale === 'en' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'"/></svg></button>
            <span class="page-num" dir="ltr" data-testid="mv-page">{{ report.pagination.page }} / {{ report.pagination.lastPage }}</span>
            <button type="button" :disabled="movementPage >= report.pagination.lastPage || movementsLoading" :aria-label="tx('التالي', 'Next')" data-testid="mv-next" @click="movementPage += 1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline :points="locale === 'en' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/></svg></button>
          </div>
        </div>
      </div>
    </template>

    <StockAdjustDialog :product="adjustTarget" :mode="adjustMode" @close="adjustTarget = null" @done="onAdjusted" />
    <div class="alert-toast" :class="[toastType, { show: toastText }]" role="status" data-testid="toast">{{ toastText }}</div>
  </div>
</template>

<style scoped>
.inventory-page { display: flex; flex-direction: column; gap: 1.1rem; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.header-titles { display: flex; align-items: center; gap: 0.9rem; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; line-height: 1.3; }
.page-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0.1rem 0 0; }
.export-btn { display: inline-flex; align-items: center; gap: 0.45rem; background: #fff; color: #15803d; border: 1px solid #22c55e; padding: 0.55rem 1rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
.export-btn:hover:not(:disabled) { background: #f0fdf4; }
.export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.tabs { display: flex; gap: 0.3rem; border-bottom: 1px solid #e5e7eb; }
.tabs button { background: none; border: none; border-bottom: 2px solid transparent; padding: 0.65rem 1rem; font-family: inherit; font-weight: 700; font-size: 0.88rem; color: #6b7280; cursor: pointer; margin-bottom: -1px; }
.tabs button.active { color: #660033; border-bottom-color: #660033; }

.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.stat-card { display: flex; align-items: center; gap: 0.9rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.1rem 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); font-family: inherit; text-align: start; }
.stat-card.clickable { cursor: pointer; }
.stat-card.clickable:hover { border-color: #d1d5db; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.stat-card > div { display: flex; flex-direction: column; min-width: 0; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-icon.brand { background: #660033; }
.stat-icon.red { background: #ef4444; }
.stat-icon.orange { background: #f59e0b; }
.stat-icon.green { background: #22c55e; }
.stat-value { font-size: 1.45rem; font-weight: 800; color: #111827; line-height: 1.2; }
.stat-label { font-size: 0.76rem; color: #6b7280; }

.alerts-card { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 0.95rem 1.1rem; }
.alerts-title { display: flex; align-items: center; gap: 0.45rem; color: #c2410c; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.7rem; }
.alerts-count { background: #fed7aa; color: #9a3412; border-radius: 999px; padding: 0 0.5rem; font-size: 0.72rem; }
.alert-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.alert-chip { border: none; border-radius: 8px; padding: 0.35rem 0.75rem; font-family: inherit; font-size: 0.76rem; font-weight: 600; line-height: 1.5; text-align: start; cursor: pointer; max-width: 100%; white-space: normal; }
.alert-chip.low { background: #ffedd5; color: #c2410c; }
.alert-chip.out { background: #fee2e2; color: #b91c1c; }
.alert-more { align-self: center; color: #9a3412; font-weight: 700; font-size: 0.78rem; }

.filters-card { display: flex; gap: 0.8rem; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.9rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.filters-card.wrap { flex-wrap: wrap; }
.search-box { position: relative; flex: 1; display: flex; align-items: center; min-width: 0; }
.search-icon { position: absolute; inset-inline-start: 0.9rem; color: #6b7280; pointer-events: none; }
.search-box input { width: 100%; box-sizing: border-box; height: 44px; padding: 0 2.7rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.85rem; outline: none; }
.search-box input:focus { border-color: #660033; }
.filter-select { width: 190px; flex-shrink: 0; }
.product-select { width: 240px; }
.select-wrapper { position: relative; }
.select-wrapper select { width: 100%; box-sizing: border-box; appearance: none; height: 44px; padding: 0 0.9rem; padding-inline-end: 2.2rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-family: inherit; font-size: 0.84rem; color: #111827; cursor: pointer; outline: none; text-overflow: ellipsis; }
.select-wrapper select:focus { border-color: #660033; }
.select-icon { position: absolute; inset-inline-end: 0.85rem; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; }
.date-field { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; color: #374151; }
.date-field input { height: 44px; padding: 0 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.84rem; }
.range-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 0.82rem; font-weight: 600; }

.breakdown { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.breakdown-chip { display: inline-flex; align-items: center; gap: 0.6rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 0.4rem 0.9rem; font-family: inherit; font-size: 0.78rem; color: #374151; cursor: pointer; }
.breakdown-chip.active { border-color: #660033; background: #f6e9ef; }

.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.85rem 0.9rem; border-bottom: 1px solid #e5e7eb; vertical-align: middle; text-align: start; }
.data-table th { background: #f3f4f6; font-size: 0.78rem; font-weight: 700; color: #374151; white-space: nowrap; }
.data-table td { font-size: 0.84rem; color: #1f2937; }
.data-table th.center, .data-table td.center { text-align: center; }
.data-row:hover td { background: #fafafa; }
.data-row.dim { opacity: 0.55; }
.state-row td { text-align: center; color: #6b7280; padding: 2.5rem; }
.muted { color: #6b7280; }
.nowrap { white-space: nowrap; }
.nowrap small { display: block; color: #9ca3af; }
.ltr-num { direction: ltr; text-align: end; }
[dir='ltr'] .ltr-num { text-align: start; }
.link-btn { background: none; border: none; color: #660033; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: underline; }

.product-cell { display: flex; align-items: center; gap: 0.7rem; min-width: 220px; }
.product-thumb { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; background: #f3f4f6; flex-shrink: 0; }
.product-name { background: none; border: none; padding: 0; font-family: inherit; font-weight: 600; font-size: 0.85rem; color: #111827; cursor: pointer; text-align: start; }
.product-name:hover, .product-link:hover { color: #660033; text-decoration: underline; }
.product-link { color: #111827; font-weight: 600; text-decoration: none; }

.stock-cell { display: inline-flex; flex-direction: column; align-items: center; gap: 0.3rem; min-width: 64px; }
.stock-bar { width: 64px; height: 4px; border-radius: 999px; background: #e5e7eb; overflow: hidden; display: block; }
.stock-bar span { display: block; height: 100%; border-radius: 999px; }
.stock-bar .in { background: #22c55e; }
.stock-bar .low { background: #f59e0b; }
.stock-bar .out { background: #ef4444; }

.status-pill { display: inline-block; padding: 0.2rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.status-pill.in { background: #dcfce7; color: #15803d; }
.status-pill.low { background: #ffedd5; color: #c2410c; }
.status-pill.out { background: #fee2e2; color: #b91c1c; }
.mobile-status { display: none; }

.type-chip { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.type-chip.in { background: #dcfce7; color: #15803d; }
.type-chip.out { background: #fee2e2; color: #b91c1c; }
.pos { color: #15803d; }
.neg { color: #b91c1c; }
.reason-cell span { display: block; }
.reason-cell small { display: block; color: #6b7280; margin-top: 0.15rem; }

.actions-group { display: inline-flex; align-items: center; gap: 0.3rem; }
/* Stock buttons (view, add, remove) share one look: the same square, border and brand colour. */
.action-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #660033; cursor: pointer; }
.action-btn:hover:not(:disabled) { background: #f9fafb; }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.table-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.8rem 1rem; font-size: 0.8rem; }
.pager { display: inline-flex; align-items: center; gap: 0.4rem; }
.pager button { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #374151; }
.pager button:disabled { opacity: 0.4; cursor: not-allowed; }
.page-num { min-width: 48px; text-align: center; font-weight: 700; color: #660033; }

.loader { display: inline-block; width: 14px; height: 14px; border: 2px solid #e5e7eb; border-top-color: #660033; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-inline-end: 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }


@media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 768px) {
  .filters-card { flex-direction: column; align-items: stretch; }
  .filter-select, .product-select { width: 100%; }
  .date-field { justify-content: space-between; }
  .date-field input { flex: 1; }
}
@media (max-width: 700px) {
  /* Phones: keep product, stock, status and the actions on screen */
  .col-wide, .col-status { display: none; }
  .mobile-status { display: inline-block; }
  .stock-bar { width: 48px; }
  .actions-group { gap: 0.1rem; }
  .action-btn { width: 32px; height: 32px; }
  .product-cell { min-width: 0; }
  .product-thumb { width: 34px; height: 34px; }
  .data-table th, .data-table td { padding: 0.7rem 0.5rem; }
  .table-footer { flex-direction: column; }
}
@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
</style>
