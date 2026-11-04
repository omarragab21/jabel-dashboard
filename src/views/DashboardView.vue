<template>
  <div class="dashboard" :dir="locale === 'ar' ? 'rtl' : 'ltr'">

    <!-- ===== PAGE HEADER ===== -->
    <div class="dash-header">
      <h1 class="dash-title">{{ t('admin.dashboard.title') }}</h1>
      <p class="dash-subtitle">{{ t('admin.dashboard.subtitle') }} - {{ formattedDate }}</p>
    </div>

    <!-- ===== LOADING STATE (skeleton in the real layout) ===== -->
    <div v-if="loading" class="dashboard-skeleton" data-testid="dashboard-skeleton" aria-busy="true" :aria-label="t('admin.dashboard.loading')">
      <div class="stats-grid">
        <div v-for="n in 5" :key="'sk-stat-' + n" class="stat-card">
          <div class="stat-top">
            <span class="shimmer sk-icon"></span>
            <span class="shimmer sk-pill"></span>
          </div>
          <span class="shimmer sk-value"></span>
          <span class="shimmer sk-line sk-w-40"></span>
        </div>
      </div>
      <div class="charts-row">
        <div class="chart-card">
          <span class="shimmer sk-line sk-title"></span>
          <span class="shimmer sk-chart"></span>
        </div>
        <div class="chart-card">
          <span class="shimmer sk-line sk-title"></span>
          <span class="shimmer sk-donut"></span>
        </div>
      </div>
      <div v-for="row in ['tables-row', 'bottom-row']" :key="row" :class="row">
        <div v-for="n in 2" :key="row + n" class="section-card">
          <div class="section-header"><span class="shimmer sk-line sk-title"></span></div>
          <div class="sk-rows">
            <div v-for="r in 5" :key="r" class="sk-row">
              <span class="shimmer sk-avatar"></span>
              <span class="shimmer sk-line"></span>
              <span class="shimmer sk-line sk-w-20"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== ERROR STATE ===== -->
    <div v-else-if="error" class="error-alert" data-testid="dashboard-error">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
      <button @click="fetchAll({ force: true })" class="retry-btn">{{ t('admin.dashboard.retry') }}</button>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <template v-else>

      <!-- ===== ROW 1: STAT CARDS ===== -->
      <div class="stats-grid" data-testid="dashboard-stats">
        <div v-for="card in statCards" :key="card.key" class="stat-card" :data-testid="'stat-' + card.key" :title="card.hint || null">
          <div class="stat-top">
            <div class="stat-icon" :style="{ background: card.iconBg }" v-html="card.icon"></div>
            <div v-if="card.trend !== null" class="stat-trend" :class="card.trend >= 0 ? 'trend-up' : 'trend-down'" data-testid="stat-trend">
              <bdi dir="ltr">{{ card.trend >= 0 ? '+' : '' }}{{ formatNumber(card.trend) }}%</bdi>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <template v-if="card.trend >= 0"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></template>
                <template v-else><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></template>
              </svg>
            </div>
          </div>
          <div class="stat-value">
            <bdi :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="amount-with-currency">
              <bdi dir="ltr" class="stat-number">{{ card.currency ? formatAmount(card.value) : formatNumber(card.value) }}</bdi>
              <RiyalIcon v-if="card.currency" />
            </bdi>
          </div>
          <div class="stat-label">{{ t(`admin.dashboard.${card.labelKey}`) }}</div>
        </div>
      </div>

      <!-- ===== ROW 2: SALES CHART + ORDER DISTRIBUTION ===== -->
      <div class="charts-row">
        <div class="chart-card line-card" data-testid="sales-chart">
          <div class="chart-header">
            <h3 class="chart-title">{{ t('admin.dashboard.sales_chart') }}</h3>
            <div class="period-toggle" role="tablist">
              <button
                v-for="range in CHART_RANGES"
                :key="range"
                class="toggle-btn"
                :class="{ active: salesRange === range }"
                role="tab"
                :aria-selected="salesRange === range"
                :data-testid="'range-' + range"
                @click="setSalesRange(range)"
              >{{ t(`admin.dashboard.${range}`) }}</button>
            </div>
          </div>
          <div class="line-wrapper">
            <canvas ref="lineCanvas" :aria-label="t('admin.dashboard.sales_chart')" role="img"></canvas>
          </div>
          <!-- The chart's numbers for screen readers. -->
          <table class="sr-only" data-testid="sales-data">
            <caption>{{ t('admin.dashboard.sales_chart') }} - {{ t(`admin.dashboard.${salesRange}`) }}</caption>
            <tbody>
              <tr v-for="point in series[salesRange]" :key="point.key" :data-key="point.key">
                <th scope="row">{{ point.label }}</th>
                <td>{{ point.revenue }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="chart-card donut-card" data-testid="order-distribution">
          <div class="chart-header">
            <h3 class="chart-title">{{ t('admin.dashboard.orders_distribution') }}</h3>
            <span class="donut-total" data-testid="distribution-total">{{ formatNumber(overview.distribution.total) }} {{ t('admin.dashboard.orders_unit') }}</span>
          </div>
          <div class="donut-canvas-wrap">
            <canvas ref="donutCanvas" width="160" height="160" :aria-label="t('admin.dashboard.orders_distribution')" role="img"></canvas>
          </div>
          <div class="donut-legend-grid">
            <div v-for="slice in overview.distribution.slices" :key="slice.key" class="legend-row" :data-testid="'legend-' + slice.key">
              <span class="legend-dot" :style="{ background: slice.color }"></span>
              <span class="legend-lbl">{{ t(`admin.dashboard.${slice.labelKey}`) }}</span>
              <span class="legend-count">{{ slice.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== ROW 3: BEST SELLERS + RECENT ORDERS ===== -->
      <div class="tables-row">
        <div class="section-card" data-testid="top-products">
          <div class="section-header">
            <div class="section-title-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              <span class="section-title">{{ t('admin.dashboard.best_sellers') }}</span>
            </div>
            <router-link to="/admin/products" class="view-all-link">
              {{ t('admin.dashboard.view_all') }}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </router-link>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="th-rank">#</th>
                  <th>{{ t('admin.dashboard.product') }}</th>
                  <th>{{ t('admin.dashboard.sales') }}</th>
                  <th>{{ t('admin.dashboard.revenue') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prod in overview.topProducts" :key="prod.id ?? prod.rank">
                  <td><span class="rank-num">{{ prod.rank }}</span></td>
                  <td class="td-product-name" :title="prod.name">{{ prod.name }}</td>
                  <td class="td-num">{{ formatNumber(prod.sold) }}</td>
                  <td class="td-muted"><bdi :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="amount-with-currency"><bdi dir="ltr">{{ formatAmount(prod.revenue) }}</bdi><RiyalIcon /></bdi></td>
                </tr>
                <tr v-if="!overview.topProducts.length">
                  <td colspan="4" class="td-empty">{{ t('admin.dashboard.no_sales') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="section-card" data-testid="recent-orders">
          <div class="section-header">
            <div class="section-title-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#660033" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span class="section-title">{{ t('admin.dashboard.recent_orders') }}</span>
            </div>
            <router-link to="/admin/orders" class="view-all-link">
              {{ t('admin.dashboard.view_all') }}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </router-link>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('admin.dashboard.order_number') }}</th>
                  <th>{{ t('admin.dashboard.customer') }}</th>
                  <th>{{ t('admin.dashboard.amount') }}</th>
                  <th>{{ t('admin.dashboard.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in overview.recentOrders" :key="order.id">
                  <td><router-link class="order-link" :to="{ path: '/admin/orders', query: { search: order.number } }"><bdi dir="ltr">{{ order.number }}</bdi></router-link></td>
                  <td>{{ order.customer }}</td>
                  <td><bdi :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="amount-with-currency"><bdi dir="ltr">{{ formatAmount(order.total) }}</bdi><RiyalIcon /></bdi></td>
                  <td><span class="status-badge" :class="'status-' + order.status">{{ orderStatusLabel(order.status) }}</span></td>
                </tr>
                <tr v-if="!overview.recentOrders.length">
                  <td colspan="4" class="td-empty">{{ t('admin.dashboard.no_orders') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== ROW 4: INVENTORY ALERTS + RETURNS ===== -->
      <div class="bottom-row">
        <div class="section-card" data-testid="low-stock">
          <div class="section-header">
            <div class="section-title-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span class="section-title">{{ t('admin.dashboard.inventory') }}</span>
              <span v-if="overview.lowStock.length" class="count-badge badge-warn" data-testid="low-stock-count">{{ overview.lowStock.length }}</span>
            </div>
            <router-link to="/admin/inventory" class="view-all-link">
              {{ t('admin.dashboard.manage_inventory') }}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </router-link>
          </div>
          <div class="inventory-list">
            <div v-for="item in overview.lowStock" :key="item.id" class="inv-item" :class="'level-' + item.level">
              <div class="inv-icon-box">
                <img v-if="item.image" :src="item.image" :alt="item.name" class="inv-thumb" />
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  <line v-if="item.level === 'out'" x1="3" y1="3" x2="21" y2="21"/>
                </svg>
              </div>
              <div class="inv-info">
                <span class="inv-name" :title="item.name">{{ item.name }}</span>
                <span class="inv-sku"><bdi dir="ltr">#{{ item.id }}</bdi></span>
              </div>
              <span v-if="item.level === 'out'" class="inv-out">{{ t('admin.dashboard.out_of_stock') }}</span>
              <div v-else class="inv-stock">
                <span class="inv-left">{{ item.stock }} {{ t('admin.dashboard.remaining') }}</span>
                <span class="inv-bar"><span class="inv-bar-fill" :style="{ width: item.bar + '%' }"></span></span>
              </div>
            </div>
            <div v-if="!overview.lowStock.length" class="empty-section">{{ t('admin.dashboard.no_inventory') }}</div>
          </div>
        </div>

        <div class="section-card" data-testid="recent-returns">
          <div class="section-header">
            <div class="section-title-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
              <span class="section-title">{{ t('admin.dashboard.returns') }}</span>
              <span v-if="pendingReturns" class="count-badge badge-danger" data-testid="returns-pending">{{ pendingReturns }} {{ t('admin.dashboard.awaiting') }}</span>
            </div>
            <router-link to="/admin/returns" class="view-all-link">
              {{ t('admin.dashboard.view_all') }}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </router-link>
          </div>
          <div class="returns-list">
            <router-link v-for="ret in overview.recentReturns" :key="ret.id" :to="`/admin/returns/${ret.id}`" class="return-item">
              <div class="return-main">
                <span class="return-ref"><bdi dir="ltr" class="return-order">{{ ret.orderNumber || ret.number }}</bdi> - <bdi dir="ltr">{{ ret.number }}</bdi></span>
                <span class="return-sub">{{ ret.productName }} <span class="sep">|</span> <bdi dir="ltr">{{ ret.date }}</bdi></span>
              </div>
              <div class="return-side">
                <span class="return-status" :class="'rs-' + ret.status">{{ returnStatusLabel(ret.status) }}</span>
                <bdi :dir="locale === 'ar' ? 'rtl' : 'ltr'" class="amount-with-currency return-amt"><bdi dir="ltr">{{ formatAmount(ret.amount) }}</bdi><RiyalIcon /></bdi>
              </div>
            </router-link>
            <div v-if="!overview.recentReturns.length" class="empty-section">{{ t('admin.dashboard.no_returns') }}</div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted, onUnmounted, onActivated, nextTick, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useI18n } from 'vue-i18n';
import api from '../config/axios';
import RiyalIcon from '../components/RiyalIcon.vue';
import { useTheme } from '../composables/useTheme';
import { freshness } from '../utils/dataFreshness';
import { toOverview, toChartSeries, CHART_RANGES } from '../domain/dashboard/overview';

Chart.register(...registerables);

const { isDark } = useTheme();
const { locale, t } = useI18n();

const lineCanvas = ref(null);
const donutCanvas = ref(null);
let lineChart = null;
let donutChart = null;
let isDisposed = false;

const loading = ref(true);
const error = ref(null);
const salesRange = ref('daily');
const overview = ref(toOverview());
const series = ref({ daily: [], monthly: [] });

const ICONS = {
  money: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  trend: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  users: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  box: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
};

// Same order as the design (right to left in Arabic).
const statCards = computed(() => {
  const m = overview.value.metrics;
  const paidHint = t('admin.dashboard.paid_only_hint');
  return [
    { key: 'today_sales', labelKey: 'today_sales', value: m.todaySales, currency: true, trend: null, iconBg: '#8b2e5a', icon: ICONS.money, hint: paidHint },
    { key: 'month_sales', labelKey: 'monthly_sales', value: m.monthSales, currency: true, trend: m.monthSalesPct, iconBg: '#22c55e', icon: ICONS.trend, hint: paidHint },
    { key: 'today_orders', labelKey: 'today_orders', value: m.todayOrders, trend: null, iconBg: '#6366f1', icon: ICONS.cart },
    { key: 'customers', labelKey: 'customers', value: m.totalCustomers, trend: null, iconBg: '#06b6d4', icon: ICONS.users },
    { key: 'products', labelKey: 'products', value: m.totalProducts, trend: null, iconBg: '#fb923c', icon: ICONS.box },
  ];
});

const pendingReturns = computed(() => overview.value.recentReturns.filter((ret) => ret.status === 'pending').length);

const formattedDate = computed(() => new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date()));

const formatNumber = (value) => (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const formatAmount = (value) => (Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const ORDER_STATUS_KEYS = {
  pending: 'pending', paid_confirmed: 'confirmed', processing: 'processing', shipped: 'shipped',
  in_transit: 'shipped', delivered: 'completed', completed: 'completed', cancelled: 'cancelled',
};
const orderStatusLabel = (status) => (ORDER_STATUS_KEYS[status] ? t(`admin.dashboard.${ORDER_STATUS_KEYS[status]}`) : status);

const RETURN_STATUS_KEYS = { pending: 'pending_review', approved: 'approved', rejected: 'rejected', refunded: 'refunded', completed: 'refunded' };
const returnStatusLabel = (status) => (RETURN_STATUS_KEYS[status] ? t(`admin.dashboard.${RETURN_STATUS_KEYS[status]}`) : status);

// ─── Data ──────────────────────────────────────────────────────────────────────
// Stale-while-revalidate: the last snapshot (per admin and language) paints at once,
// even after a reload, and one refresh runs whenever freshness.version moved past it.
const DASHBOARD_STORAGE_KEY = 'admin_dashboard_cache_v1';
const dashboardCache = globalThis.__mastergasDashboardCache || { data: null, version: -1, owner: null, inFlight: null };
globalThis.__mastergasDashboardCache = dashboardCache;

const cacheOwner = () => {
  try {
    const token = String(localStorage.getItem('token') || '').slice(-16);
    return token ? `${token}:${locale.value}` : null;
  } catch {
    return null;
  }
};

const isSnapshot = (data) => Boolean(data?.overview && data?.daily && data?.monthly);

const readDashboardCache = () => {
  const owner = cacheOwner();
  if (isSnapshot(dashboardCache.data) && dashboardCache.owner === owner) return dashboardCache;
  try {
    const stored = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || 'null');
    if (isSnapshot(stored?.data) && stored.owner === owner) {
      Object.assign(dashboardCache, { data: stored.data, version: -1, owner });
      return dashboardCache;
    }
  } catch {
    // A corrupt or blocked cache only costs a fresh request.
  }
  return null;
};

const writeDashboardCache = (data, version, owner) => {
  Object.assign(dashboardCache, { data, version, owner });
  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ data, owner }));
  } catch {
    // Storage full or blocked: the in-memory snapshot still works.
  }
};

const fetchSnapshot = async () => {
  const [overviewRes, dailyRes, monthlyRes] = await Promise.all([
    api.get('/v1/overview', { timeout: 20000 }),
    ...CHART_RANGES.map((range) => api.get('/v1/overview/chart', { params: { range }, timeout: 20000 })),
  ]);
  return { overview: overviewRes.data?.data || {}, daily: dailyRes.data || {}, monthly: monthlyRes.data || {} };
};

// One request set at a time: a second mount or a retry joins the running one.
const fetchFreshDashboard = () => {
  const owner = cacheOwner();
  if (!dashboardCache.inFlight || dashboardCache.inFlightOwner !== owner) {
    const startedAtVersion = freshness.version;
    dashboardCache.inFlightOwner = owner;
    dashboardCache.inFlight = fetchSnapshot()
      .then((data) => {
        writeDashboardCache(data, startedAtVersion, owner);
        return data;
      })
      .finally(() => {
        dashboardCache.inFlight = null;
      });
  }
  return dashboardCache.inFlight;
};

let renderedSnapshot = null;

const applySnapshot = async (data) => {
  overview.value = toOverview(data.overview);
  series.value = { daily: toChartSeries(data.daily), monthly: toChartSeries(data.monthly) };
  if (isDisposed) return;
  loading.value = false;
  // Charts are rebuilt only when their numbers changed, so a background refresh
  // returning the same data does not make them flash.
  const snapshot = JSON.stringify([overview.value.distribution, series.value]);
  if (snapshot === renderedSnapshot && lineChart && donutChart) return;
  renderedSnapshot = snapshot;
  await nextTick();
  drawCharts();
};

const describeLoadError = (err) => {
  if (err.response) return `${t('admin.dashboard.server_error')} (${err.response.status}): ${apiErrorMessage(err, t('admin.dashboard.error'))}`;
  if (err.request) return t('admin.dashboard.no_response');
  return t('admin.dashboard.error');
};

const fetchAll = async ({ force = false } = {}) => {
  error.value = null;
  const cached = readDashboardCache();
  if (cached) {
    await applySnapshot(cached.data);
    if (!force && cached.version === freshness.version) return;
  } else {
    loading.value = true;
  }

  try {
    const data = await fetchFreshDashboard();
    if (isDisposed) return;
    await applySnapshot(data);
  } catch (err) {
    if (isDisposed) return;
    loading.value = false;
    if (err.response?.status === 401) return;
    // With a snapshot on screen a failed background refresh stays silent.
    if (cached) return;
    error.value = describeLoadError(err);
  }
};

// ─── Charts ────────────────────────────────────────────────────────────────────
const chartColors = () => ({
  tick: isDark.value ? '#94a3b8' : '#9ca3af',
  grid: isDark.value ? '#334155' : '#e5e7eb',
  ring: isDark.value ? '#1e293b' : '#ffffff',
});

function drawLineChart() {
  if (!lineCanvas.value || isDisposed) return;
  lineChart?.destroy();
  // Oldest to newest, so the current day / month is always the last point (the right edge).
  const points = [...(series.value[salesRange.value] || [])].sort((a, b) => String(a.key).localeCompare(String(b.key)));
  const colors = chartColors();
  const font = { family: 'IBM Plex Sans Arabic', size: 11 };

  lineChart = new Chart(lineCanvas.value, {
    type: 'line',
    data: {
      labels: points.map((point) => point.label),
      datasets: [{
        label: t('admin.dashboard.sales'),
        data: points.map((point) => point.revenue),
        borderColor: '#8b2e5a',
        backgroundColor: (ctx) => {
          const { chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(139, 46, 90, 0.08)';
          const gradient = ctx.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(139, 46, 90, 0.16)');
          gradient.addColorStop(1, 'rgba(139, 46, 90, 0)');
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        // Monotone keeps the curve from dipping below zero between quiet days.
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#8b2e5a',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      // Room for the first and last day names, which are centred on the chart edges.
      layout: { padding: { left: 34, right: 34 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: locale.value === 'ar',
          callbacks: { label: (ctx) => ` ${formatAmount(ctx.parsed.y)} ${t('admin.dashboard.sar')}` },
        },
      },
      scales: {
        x: {
          // Today (or this month) sits on the right edge in both languages.
          reverse: false,
          grid: { color: colors.grid },
          border: { dash: [4, 4], display: false },
          ticks: {
            font,
            color: colors.tick,
            maxRotation: 0,
            autoSkip: false,
            // Every day / month is labelled. Month labels come with the year ("أكتوبر 2026"); the axis
            // shows the month name only so twelve fit side by side (the tooltip keeps the full label).
            callback: (value, index) => String(points[index]?.label ?? '').replace(/\s*\d{4}\s*/, ' ').trim(),
          },
        },
        y: {
          position: 'left',
          beginAtZero: true,
          grid: { color: colors.grid },
          border: { dash: [4, 4], display: false },
          ticks: {
            font,
            color: colors.tick,
            maxTicksLimit: 6,
            callback: (value) => (value >= 1000 ? `${formatNumber(value / 1000)}k` : formatNumber(value)),
          },
        },
      },
    },
  });
}

function drawDonutChart() {
  if (!donutCanvas.value || isDisposed) return;
  donutChart?.destroy();
  const active = overview.value.distribution.slices.filter((slice) => slice.count > 0);
  const colors = chartColors();
  const slices = active.length ? active : [{ labelKey: 'no_data', count: 1, color: colors.grid }];

  donutChart = new Chart(donutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: slices.map((slice) => t(`admin.dashboard.${slice.labelKey}`)),
      datasets: [{
        data: slices.map((slice) => slice.count),
        backgroundColor: slices.map((slice) => slice.color),
        borderWidth: 3,
        borderColor: colors.ring,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: active.length > 0, rtl: locale.value === 'ar', callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } },
      },
    },
  });
}

function drawCharts() {
  if (isDisposed) return;
  drawLineChart();
  drawDonutChart();
}

function setSalesRange(range) {
  salesRange.value = range;
  drawLineChart();
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  isDisposed = false;
  fetchAll();
});

// The page is kept alive between tab clicks: charts only need a resize.
onActivated(() => {
  if (loading.value || isDisposed) return;
  lineChart?.resize();
  // The donut has a fixed 160px size: resize() would stretch it to the card's width.
});

onUnmounted(() => {
  isDisposed = true;
  lineChart?.destroy();
  donutChart?.destroy();
  lineChart = null;
  donutChart = null;
});

// Names and chart labels come translated from the API, so a language switch refetches.
watch(locale, () => {
  renderedSnapshot = null;
  fetchAll();
});
watch(isDark, () => {
  if (!loading.value) drawCharts();
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
.dash-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.3rem;
}
.dash-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

/* ─── Stat cards ───────────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.6rem;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon :deep(svg) { display: block; }
.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.trend-up { color: #16a34a; }
.trend-down { color: #dc2626; }
.stat-value {
  display: flex;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 1.1rem;
}
.stat-label {
  font-size: 0.78rem;
  color: #6b7280;
}

/* ─── Charts ───────────────────────────────────────────────────────────────── */
.charts-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1.5rem;
}
.chart-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.4rem;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.chart-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}
.period-toggle {
  display: flex;
  background: #f3f4f6;
  padding: 3px;
  border-radius: 8px;
}
.toggle-btn {
  padding: 0.3rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: #6b7280;
  font-family: inherit;
}
.toggle-btn.active {
  background: #8b2e5a;
  color: #fff;
}
.line-wrapper {
  position: relative;
  height: 290px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.line-card { position: relative; }
.donut-total {
  font-size: 0.8rem;
  color: #6b7280;
}
.donut-canvas-wrap {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0 2rem;
}
.donut-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem 1.75rem;
  margin-top: auto;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-lbl { color: #4b5563; }
.legend-count {
  margin-inline-start: auto;
  font-weight: 600;
  color: #111827;
}

/* ─── Sections ─────────────────────────────────────────────────────────────── */
.tables-row,
.bottom-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}
.section-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid #f3f4f6;
}
.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1f2937;
}
.count-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
}
.badge-warn { background: #fff7ed; color: #ea580c; }
.badge-danger { background: #fef2f2; color: #dc2626; }
.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: #4b5563;
  text-decoration: none;
}
.view-all-link:hover { color: #8b2e5a; }
/* The chevron is drawn for RTL; mirror it in English. */
.dashboard[dir="ltr"] .view-all-link svg { transform: scaleX(-1); }

/* Tables */
.table-wrap { overflow-x: auto; padding-top: 1.4rem; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.data-table th {
  text-align: start;
  padding: 0.65rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  background: #f9fafb;
  white-space: nowrap;
}
.data-table td {
  padding: 0.85rem 1.4rem;
  border-top: 1px solid #f3f4f6;
  color: #111827;
  text-align: start;
  white-space: nowrap;
}
.th-rank { width: 1%; }
.td-num { font-weight: 500; }
.td-muted { color: #4b5563; }
.td-product-name { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.td-empty { text-align: center !important; color: #9ca3af !important; padding: 2rem !important; }
.order-link { color: #8b2e5a; font-weight: 500; text-decoration: none; }
.order-link:hover { text-decoration: underline; }
.rank-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.7rem;
  background: #f3f4f6;
  color: #6b7280;
}
.amount-with-currency { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}
.status-delivered, .status-completed { background: #f0fdf4; color: #16a34a; }
.status-paid_confirmed { background: #ecfeff; color: #0891b2; }
.status-processing { background: #eef2ff; color: #4f46e5; }
.status-shipped, .status-in_transit { background: #fdf2f8; color: #8b2e5a; }
.status-pending { background: #f3f4f6; color: #4b5563; }
.status-cancelled { background: #fef2f2; color: #dc2626; }

/* Inventory alerts */
.inventory-list { display: flex; flex-direction: column; padding: 0.6rem 0; }
.inv-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1.4rem;
  border-bottom: 1px solid #f3f4f6;
}
.inv-item:last-of-type { border-bottom: none; }
.inv-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff7ed;
  color: #f59e0b;
  overflow: hidden;
}
.level-out .inv-icon-box { background: #fef2f2; color: #ef4444; }
.inv-thumb { width: 100%; height: 100%; object-fit: cover; }
.inv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.inv-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.inv-sku { font-size: 0.72rem; color: #6b7280; letter-spacing: 0.02em; }
.inv-stock { display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; width: 90px; flex-shrink: 0; }
.dashboard[dir="ltr"] .inv-stock { align-items: flex-start; }
.inv-left { font-size: 0.72rem; font-weight: 500; color: #f59e0b; }
.level-critical .inv-left { color: #ef4444; }
.inv-bar { width: 100%; height: 5px; border-radius: 999px; background: #f3f4f6; overflow: hidden; display: flex; }
.inv-bar-fill { height: 100%; border-radius: 999px; background: #f59e0b; }
.level-critical .inv-bar-fill { background: #ef4444; }
.inv-out {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: #fef2f2;
  color: #dc2626;
  flex-shrink: 0;
}

/* Returns */
.returns-list { display: flex; flex-direction: column; padding: 0.6rem 0; }
.return-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.4rem;
  border-bottom: 1px solid #f3f4f6;
  text-decoration: none;
  color: inherit;
}
.return-item:last-of-type { border-bottom: none; }
.return-item:hover { background: #fafafa; }
.return-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.45rem; }
.return-ref { font-size: 0.85rem; font-weight: 500; color: #111827; }
.return-ref bdi { white-space: nowrap; }
.return-order { color: #8b2e5a; }
.return-sub {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sep { color: #d1d5db; margin: 0 0.35rem; }
.return-side { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; flex-shrink: 0; }
.dashboard[dir="rtl"] .return-side { align-items: flex-start; }
.return-status {
  font-size: 0.68rem;
  font-weight: 500;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
}
.rs-pending { background: #fff7ed; color: #ea580c; }
.rs-approved { background: #f0fdf4; color: #16a34a; }
.rs-rejected { background: #fef2f2; color: #dc2626; }
.rs-refunded, .rs-completed { background: #eef2ff; color: #4f46e5; }
.return-amt { font-size: 0.82rem; color: #111827; }
.empty-section { text-align: center; color: #9ca3af; font-size: 0.82rem; padding: 2rem; }

/* ─── Dark mode ────────────────────────────────────────────────────────────── */
:global(.dark) .section-card,
:global(.dark) .stat-card,
:global(.dark) .chart-card { background: #1e293b; border-color: #334155; }
:global(.dark) .section-header,
:global(.dark) .data-table td,
:global(.dark) .inv-item,
:global(.dark) .return-item { border-color: #334155; }
:global(.dark) .data-table th { background: #0f172a; color: #94a3b8; }
:global(.dark) .dash-title,
:global(.dark) .section-title,
:global(.dark) .inv-name,
:global(.dark) .return-ref,
:global(.dark) .return-amt,
:global(.dark) .legend-count { color: #f1f5f9; }
:global(.dark) .period-toggle,
:global(.dark) .rank-num,
:global(.dark) .inv-bar { background: #334155; }
:global(.dark) .return-item:hover { background: #0f172a; }

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
.dashboard-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  --sk-base: #eef0f3;
  --sk-glint: #f8f9fb;
}
:global(.dark) .dashboard-skeleton { --sk-base: #1e293b; --sk-glint: #2b3a50; }
.shimmer {
  display: block;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--sk-base) 25%, var(--sk-glint) 50%, var(--sk-base) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.3s ease-in-out infinite;
}
[dir="rtl"] .shimmer { animation-direction: reverse; }
@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .shimmer { animation: none; }
}
.sk-icon { width: 44px; height: 44px; border-radius: 10px; }
.sk-pill { width: 44px; height: 16px; }
.sk-value { width: 60%; height: 26px; margin: 0.4rem 0 0.8rem; }
.sk-line { width: 100%; height: 12px; }
.sk-title { width: 40%; height: 14px; margin-bottom: 1rem; }
.sk-w-40 { width: 40%; }
.sk-w-20 { width: 20%; flex-shrink: 0; }
.sk-donut { width: 160px; height: 160px; border-radius: 50%; margin: 1.5rem auto; }
.sk-chart { width: 100%; height: 290px; }
.sk-rows { display: flex; flex-direction: column; gap: 0.9rem; padding: 1rem 1.4rem; }
.sk-row { display: flex; align-items: center; gap: 0.75rem; }
.sk-avatar { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; }

/* ─── Error ────────────────────────────────────────────────────────────────── */
.error-alert {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #b91c1c;
  text-align: center;
}
.retry-btn {
  background: #660033;
  color: #fff;
  border: none;
  padding: 0.55rem 1.5rem;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
/* 5 cards: 2 + 2 + 2 on the first row and 3 + 3 on the second, so no card is left alone. */
@media (max-width: 1280px) {
  .stats-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .stat-card { grid-column: span 2; }
  .stat-card:nth-child(n + 4) { grid-column: span 3; }
}
@media (max-width: 1100px) {
  .charts-row,
  .tables-row,
  .bottom-row { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .stat-card, .stat-card:nth-child(n + 4) { grid-column: auto; }
  .stat-card:last-child:nth-child(odd) { grid-column: 1 / -1; }
  .stat-card { padding: 0.85rem; }
  .stat-value { font-size: 1.2rem; }
  .chart-card { padding: 1rem; }
  .line-wrapper { height: 220px; }
  .section-header { padding: 0.9rem 1rem; }
  .data-table th, .data-table td { padding-inline: 1rem; }
}
@media (max-width: 360px) {
  .stats-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
