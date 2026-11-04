<template>
  <div class="finance" :dir="locale === 'ar' ? 'rtl' : 'ltr'">

    <!-- ===== HEADER ===== -->
    <div class="fin-header">
      <div class="fin-heading">
        <div class="fin-heading-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15 8.5h-4.25a1.75 1.75 0 0 0 0 3.5h2.5a1.75 1.75 0 0 1 0 3.5H9"/></svg>
        </div>
        <div>
          <h1 class="fin-title">{{ t('admin.finance.title') }}</h1>
          <p class="fin-subtitle">{{ t('admin.finance.subtitle') }}<template v-if="report"> · <bdi data-testid="period-text">{{ periodText }}</bdi></template></p>
        </div>
      </div>

      <div class="fin-controls">
        <label class="fin-date">
          <span>{{ t('admin.finance.from') }}</span>
          <span class="date-field">
            <bdi dir="ltr" class="date-display" aria-hidden="true">{{ formatInputDay(draft.start) }}</bdi>
            <input v-model="draft.start" type="date" lang="en-GB" :max="draft.end || today" data-testid="date-start" @click="openPicker" />
          </span>
        </label>
        <label class="fin-date">
          <span>{{ t('admin.finance.to') }}</span>
          <span class="date-field">
            <bdi dir="ltr" class="date-display" aria-hidden="true">{{ formatInputDay(draft.end) }}</bdi>
            <input v-model="draft.end" type="date" lang="en-GB" :min="draft.start" :max="today" data-testid="date-end" @click="openPicker" />
          </span>
        </label>
        <button class="fin-btn" :disabled="!report || loading" data-testid="export" @click="exportCsv">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ t('admin.finance.export') }}
        </button>
      </div>
    </div>
    <p v-if="draft.start && draft.end && !draftValid" class="fin-inline-error" data-testid="range-error">{{ t('admin.finance.invalid_range') }}</p>

    <!-- ===== LOADING ===== -->
    <div v-if="loading && !report" class="fin-skeleton" data-testid="finance-skeleton" aria-busy="true">
      <div class="kpi-grid">
        <div v-for="n in 4" :key="n" class="kpi-card"><span class="shimmer sk-icon"></span><span class="shimmer sk-line sk-w-40"></span><span class="shimmer sk-value"></span></div>
      </div>
      <div class="fin-card"><span class="shimmer sk-line sk-w-40"></span><span class="shimmer sk-chart"></span></div>
    </div>

    <!-- ===== ERROR ===== -->
    <div v-else-if="error && !report" class="fin-error" data-testid="finance-error">
      <p>{{ error }}</p>
      <button class="fin-btn" @click="load">{{ t('admin.finance.retry') }}</button>
    </div>

    <template v-else-if="report">
      <p v-if="error" class="fin-inline-error" data-testid="refresh-error">{{ error }}</p>
      <div class="fin-body" :class="{ 'is-refreshing': loading }">

        <!-- ===== KPI CARDS ===== -->
        <div class="kpi-grid" data-testid="kpis">
          <div v-for="card in kpis" :key="card.key" class="kpi-card" :data-testid="'kpi-' + card.key">
            <div class="kpi-top">
              <div class="kpi-icon" :style="{ background: card.color }" v-html="card.icon"></div>
              <div v-if="card.change !== null" class="kpi-trend" :class="trendClass(card)" :title="t('admin.finance.vs_previous')" data-testid="kpi-trend">
                <bdi dir="ltr">{{ !isFlatChange(card.change) && card.change > 0 ? '+' : '' }}{{ formatNumber(card.change) }}%</bdi>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <template v-if="isFlatChange(card.change)"><line x1="5" y1="12" x2="19" y2="12"/></template>
                  <template v-else-if="card.change > 0"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></template>
                  <template v-else><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></template>
                </svg>
              </div>
              <span v-else class="kpi-trend trend-none">{{ t('admin.finance.no_compare') }}</span>
            </div>
            <div class="kpi-label">{{ t(`admin.finance.${card.key}`) }}</div>
            <div class="kpi-value">
              <bdi :dir="moneyDir" class="money"><bdi dir="ltr" class="kpi-number">{{ formatAmount(card.value) }}</bdi><RiyalIcon /></bdi>
            </div>
            <div class="kpi-sub">{{ card.sub }}</div>
          </div>
        </div>

        <div v-if="report.isEmpty" class="fin-card fin-empty" data-testid="finance-empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>
          <h3>{{ t('admin.finance.empty_title') }}</h3>
          <p>{{ t('admin.finance.empty_hint') }}</p>
        </div>

        <template v-else>
          <!-- ===== SALES → NET BRIDGE ===== -->
          <div class="fin-card" data-testid="bridge">
            <div class="card-head">
              <div>
                <h3 class="card-title">{{ t('admin.finance.bridge_title') }}</h3>
                <p class="card-hint">{{ t('admin.finance.bridge_hint') }}</p>
              </div>
              <div class="bridge-legend">
                <span><i class="dot dot-add"></i>{{ t('admin.finance.tax') }} / {{ t('admin.finance.shipping') }}</span>
                <span><i class="dot dot-sub"></i>{{ t('admin.finance.discounts') }} / {{ t('admin.finance.refunds_short') }}</span>
                <span><i class="dot dot-total"></i>{{ t('admin.finance.gross_short') }}</span>
                <span><i class="dot dot-net"></i>{{ t('admin.finance.net_short') }}</span>
              </div>
            </div>
            <div class="bridge-chart"><canvas ref="bridgeCanvas" role="img" :aria-label="t('admin.finance.bridge_title')"></canvas></div>
            <div class="formula" data-testid="formula">
              <template v-for="(part, index) in formula" :key="part.key">
                <span v-if="index" class="formula-op">{{ part.op }}</span>
                <span class="formula-chip" :class="'chip-' + part.kind" :data-key="part.key">
                  <span class="chip-label">{{ part.label }}</span>
                  <bdi :dir="moneyDir" class="money chip-value"><bdi dir="ltr">{{ formatAmount(part.value) }}</bdi><RiyalIcon /></bdi>
                </span>
              </template>
            </div>
            <p v-if="!report.reconciles" class="fin-inline-error" data-testid="reconcile-warning">{{ t('admin.finance.reconcile_warning') }}</p>
          </div>

          <!-- ===== TOP PRODUCTS + RISK ===== -->
          <div class="fin-row">
            <div class="fin-card" data-testid="top-products">
              <div class="card-head"><h3 class="card-title">{{ t('admin.finance.top_products_title') }}</h3></div>
              <div v-if="report.topProducts.length" class="product-list">
                <div v-for="product in report.topProducts" :key="product.id" class="product-row">
                  <span class="product-rank">{{ product.rank }}</span>
                  <div class="product-main">
                    <div class="product-line">
                      <span class="product-name" :title="product.name">{{ product.name }}</span>
                      <bdi :dir="moneyDir" class="money product-revenue"><bdi dir="ltr">{{ formatAmount(product.revenue) }}</bdi><RiyalIcon /></bdi>
                    </div>
                    <div class="bar"><span class="bar-fill fill-maroon" :style="{ width: product.share + '%' }"></span></div>
                    <div class="product-meta">
                      <span>{{ t('admin.finance.units', { n: product.units }) }}</span>
                      <span><bdi dir="ltr">{{ formatNumber(product.share) }}%</bdi> {{ t('admin.finance.share_of_sales') }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="card-empty">{{ t('admin.finance.no_data') }}</div>
            </div>

            <div class="fin-card risk-card" data-testid="risk">
              <div class="card-head">
                <h3 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {{ t('admin.finance.risk_title') }}
                </h3>
              </div>
              <div class="risk-hero">
                <span class="risk-label">{{ t('admin.finance.cancelled_amount') }}</span>
                <bdi :dir="moneyDir" class="money risk-amount" data-testid="cancelled-amount"><bdi dir="ltr">{{ formatAmount(report.risk.cancelledAmount) }}</bdi><RiyalIcon /></bdi>
                <span class="risk-sub" data-testid="cancelled-count">{{ t('admin.finance.cancelled_orders', { n: report.risk.cancelledCount }) }}</span>
              </div>
              <div class="risk-meter" data-testid="cancel-rate">
                <div class="meter-line"><span>{{ t('admin.finance.cancel_rate') }}</span><bdi dir="ltr" class="meter-value">{{ formatNumber(report.risk.cancelRate) }}%</bdi></div>
                <div class="bar"><span class="bar-fill" :class="rateClass(report.risk.cancelRate)" :style="{ width: report.risk.cancelRate + '%' }"></span></div>
                <span class="meter-hint">{{ t('admin.finance.cancel_rate_hint') }}</span>
              </div>
              <div class="risk-meter" data-testid="refund-rate">
                <div class="meter-line"><span>{{ t('admin.finance.refund_rate') }}</span><bdi dir="ltr" class="meter-value">{{ formatNumber(report.risk.refundRate) }}%</bdi></div>
                <div class="bar"><span class="bar-fill" :class="rateClass(report.risk.refundRate)" :style="{ width: Math.min(100, report.risk.refundRate) + '%' }"></span></div>
                <span class="meter-hint">{{ t('admin.finance.refund_rate_hint') }}</span>
              </div>
            </div>
          </div>

          <!-- ===== COMPOSITION + PAYMENT METHODS ===== -->
          <div class="fin-row">
            <div class="fin-card" data-testid="composition">
              <div class="card-head"><h3 class="card-title">{{ t('admin.finance.composition_title') }}</h3></div>
              <div class="dist-list">
                <div v-for="(part, index) in report.composition" :key="part.key" class="dist-row" :data-key="part.key">
                  <div class="dist-line">
                    <span class="dist-name">{{ t(`admin.finance.${part.key}`) }}</span>
                    <span class="dist-figure"><bdi :dir="moneyDir" class="money"><bdi dir="ltr">{{ formatAmount(part.value) }}</bdi><RiyalIcon /></bdi><bdi dir="ltr" class="dist-share">{{ formatNumber(part.share) }}%</bdi></span>
                  </div>
                  <div class="bar"><span class="bar-fill" :class="DIST_FILLS[index]" :style="{ width: part.share + '%' }"></span></div>
                </div>
              </div>
            </div>

            <div class="fin-card" data-testid="gateways">
              <div class="card-head"><h3 class="card-title">{{ t('admin.finance.gateways_title') }}</h3></div>
              <div v-if="report.gateways.length" class="dist-list">
                <div v-for="(row, index) in report.gateways" :key="row.method" class="dist-row" :data-key="row.method">
                  <div class="dist-line">
                    <span class="dist-name">{{ methodLabel(row.method) }} <small>· {{ t('admin.finance.transactions', { n: row.transactions }) }}</small></span>
                    <span class="dist-figure"><bdi :dir="moneyDir" class="money"><bdi dir="ltr">{{ formatAmount(row.amount) }}</bdi><RiyalIcon /></bdi><bdi dir="ltr" class="dist-share">{{ formatNumber(row.share) }}%</bdi></span>
                  </div>
                  <div class="bar"><span class="bar-fill" :class="DIST_FILLS[index % DIST_FILLS.length]" :style="{ width: row.share + '%' }"></span></div>
                </div>
              </div>
              <div v-else class="card-empty">{{ t('admin.finance.no_data') }}</div>
            </div>
          </div>
        </template>

        <p class="fin-footnote">
          {{ t('admin.finance.paid_only_note') }}
          <template v-if="report.generatedAt"> · {{ t('admin.finance.generated_at') }} <bdi data-testid="generated-at">{{ formatDateTime(report.generatedAt) }}</bdi></template>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Chart, registerables } from 'chart.js';
import api from '../config/axios';
import RiyalIcon from '../components/RiyalIcon.vue';
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { useTheme } from '../composables/useTheme';
import {
  presetRange, previousPeriod, percentChange, toFinancialReport, waterfallSteps, reportToCsv, isValidDay, isoDay,
} from '../domain/reports/financialReport';

Chart.register(...registerables);

const { t, locale, te } = useI18n();
const { cur } = useCurrencyLabel();
const route = useRoute();
const router = useRouter();
const { isDark } = useTheme();

const today = isoDay(new Date());
// The period is a start date and an end date; with none in the link it opens on the month so far.
const fromLink = isValidDay(route.query.start) && isValidDay(route.query.end) && route.query.start <= route.query.end;
const range = ref(fromLink ? { start: route.query.start, end: route.query.end } : presetRange('this_month'));
const draft = ref({ ...range.value });

const report = ref(null);
const previous = ref(null);
const loading = ref(false);
const error = ref('');
const bridgeCanvas = ref(null);
let bridgeChart = null;
let requestId = 0;

const DIST_FILLS = ['fill-maroon', 'fill-cyan', 'fill-orange', 'fill-green', 'fill-indigo'];

const ICONS = {
  gross: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  net: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>',
  refunds: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
  aov: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="12" y2="17"/></svg>',
};

const formatNumber = (value) => (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
// A change that rounds to 0% is neither up nor down: it gets the neutral colour and a flat arrow.
const isFlatChange = (value) => Math.abs(Number(value) || 0) < 0.05;
const trendClass = (card) => (isFlatChange(card.change) ? 'trend-flat' : card.good ? 'trend-good' : 'trend-bad');
const formatAmount = (value) => (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const dateLocale = computed(() => (locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB'));
const formatDay = (day) => new Intl.DateTimeFormat(dateLocale.value, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${day}T00:00:00`));
// Inputs show the day first: «02/11/2026» = day / month / year, read from the left.
const formatInputDay = (day) => (isValidDay(day) ? day.split('-').reverse().join('/') : 'dd/mm/yyyy');
const openPicker = (event) => { try { event.target.showPicker?.(); } catch { /* picker already open */ } };
// Amounts read like Arabic text: the number, then «د.أ» to its left.
const moneyDir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));
const formatDateTime = (value) => new Intl.DateTimeFormat(dateLocale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const periodText = computed(() => {
  const { start, end } = report.value.period;
  return start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;
});
const methodLabel = (method) => (te(`admin.finance.methods.${method}`) ? t(`admin.finance.methods.${method}`) : method);
// Higher cancellation and refund rates are worse.
const rateClass = (rate) => (rate >= 30 ? 'fill-red' : rate >= 10 ? 'fill-orange' : 'fill-green');

const draftValid = computed(() => isValidDay(draft.value.start) && isValidDay(draft.value.end) && draft.value.start <= draft.value.end);

const kpis = computed(() => {
  const s = report.value.summary;
  const p = previous.value?.summary;
  const change = (key) => (p ? percentChange(s[key], p[key]) : null);
  const card = (key, color, sub, lowerIsBetter = false) => {
    const value = change(key);
    return { key, value: s[key], color, icon: ICONS[key], sub, change: value, good: value === null ? true : (lowerIsBetter ? value <= 0 : value >= 0) };
  };
  return [
    card('gross', '#22c55e', t('admin.finance.settled_orders', { n: s.settled })),
    card('net', '#660033', t('admin.finance.after_refunds')),
    card('refunds', '#ef4444', t('admin.finance.refunded_orders', { n: s.refundedOrders }), true),
    card('aov', '#06b6d4', t('admin.finance.per_order')),
  ];
});

const formula = computed(() => {
  const s = report.value.summary;
  return [
    { key: 'products', kind: 'base', op: '', label: t('admin.finance.products'), value: s.subtotal },
    { key: 'tax', kind: 'add', op: '+', label: t('admin.finance.tax'), value: s.tax },
    { key: 'shipping', kind: 'add', op: '+', label: t('admin.finance.shipping'), value: s.shipping },
    { key: 'discounts', kind: 'sub', op: '−', label: t('admin.finance.discounts'), value: s.discounts },
    { key: 'gross', kind: 'total', op: '=', label: t('admin.finance.gross_short'), value: s.gross },
    { key: 'refunds', kind: 'sub', op: '−', label: t('admin.finance.refunds_short'), value: s.refunds },
    { key: 'net', kind: 'result', op: '=', label: t('admin.finance.net_short'), value: s.net },
  ];
});

// ─── Data ──────────────────────────────────────────────────────────────────────
const fetchReport = ({ start, end }) => api.get('/v1/financial-reports', { params: { start_date: start, end_date: end }, timeout: 20000 })
  .then((response) => toFinancialReport(response.data?.data));

const load = async () => {
  const id = ++requestId;
  loading.value = true;
  error.value = '';
  const current = { ...range.value };
  router.replace({ query: { start: current.start, end: current.end } }).catch(() => {});
  try {
    // The previous period only feeds the trends, so its failure hides them instead of the report.
    const [now, before] = await Promise.all([fetchReport(current), fetchReport(previousPeriod(current)).catch(() => null)]);
    if (id !== requestId) return;
    report.value = now;
    previous.value = before;
  } catch (err) {
    if (id !== requestId) return;
    if (err.response?.status === 401) return;
    error.value = apiErrorMessage(err, t('admin.finance.error'));
  } finally {
    if (id === requestId) loading.value = false;
  }
  await nextTick();
  drawBridge();
};

// A valid pair of dates loads the report; an incomplete or inverted pair waits (and shows the inline error).
watch(draft, (value) => {
  if (!draftValid.value || (value.start === range.value.start && value.end === range.value.end)) return;
  range.value = { ...value };
  load();
}, { deep: true });

// ─── Bridge chart ──────────────────────────────────────────────────────────────
const STEP_COLORS = { base: '#c084a3', add: '#22c55e', sub: '#ef4444', total: '#8b2e5a', result: '#660033' };
const STEP_LABELS = { products: 'products', tax: 'tax', shipping: 'shipping', discounts: 'discounts', gross: 'gross_short', refunds: 'refunds_short', net: 'net_short' };

// Writes each step's value above its bar.
const valueLabels = {
  id: 'valueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const steps = chart.data.datasets[0].steps;
    ctx.save();
    ctx.font = '600 12px "IBM Plex Sans Arabic", sans-serif';
    ctx.textAlign = 'center';
    // Numbers and their +/− sign always read left-to-right, even though the page is RTL.
    ctx.direction = 'ltr';
    meta.data.forEach((bar, index) => {
      const step = steps[index];
      const sign = step.kind === 'sub' && step.value ? '−' : step.kind === 'add' ? '+' : '';
      ctx.fillStyle = step.kind === 'sub' ? '#dc2626' : isDark.value ? '#e2e8f0' : '#111827';
      ctx.fillText(`${sign}${formatAmount(step.value)}`, bar.x, Math.min(bar.y, bar.base) - 8);
    });
    ctx.restore();
  },
};

function drawBridge() {
  if (!bridgeCanvas.value || !report.value || report.value.isEmpty) return;
  bridgeChart?.destroy();
  const steps = waterfallSteps(report.value.summary);
  const grid = isDark.value ? '#334155' : '#e5e7eb';
  const tick = isDark.value ? '#94a3b8' : '#6b7280';
  const font = { family: 'IBM Plex Sans Arabic', size: 12 };

  bridgeChart = new Chart(bridgeCanvas.value, {
    type: 'bar',
    data: {
      labels: steps.map((step) => t(`admin.finance.${STEP_LABELS[step.key]}`)),
      datasets: [{
        steps,
        data: steps.map((step) => [step.from, step.to === step.from ? step.from + 0.0001 : step.to]),
        backgroundColor: steps.map((step) => STEP_COLORS[step.kind]),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 64,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 26 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: locale.value === 'ar',
          callbacks: { label: (ctx) => { const step = steps[ctx.dataIndex]; const sign = step.kind === 'sub' && step.value ? '−' : step.kind === 'add' ? '+' : ''; return ` \u200E${sign}${formatAmount(step.value)}\u200E ${cur.value}`; } },
        },
      },
      scales: {
        x: { reverse: locale.value === 'ar', grid: { display: false }, ticks: { font, color: tick } },
        y: {
          position: locale.value === 'ar' ? 'right' : 'left',
          beginAtZero: true,
          grid: { color: grid },
          border: { dash: [4, 4], display: false },
          ticks: { font: { ...font, size: 11 }, color: tick, maxTicksLimit: 6, callback: (v) => (v >= 1000 ? `${formatNumber(v / 1000)}k` : formatNumber(v)) },
        },
      },
    },
    plugins: [valueLabels],
  });
}

// ─── Export ────────────────────────────────────────────────────────────────────
const exportCsv = () => {
  const label = (key) => (key.startsWith('method:') ? methodLabel(key.slice(7)) : t(`admin.finance.csv.${key}`));
  // The BOM makes Excel read the Arabic text as UTF-8.
  const blob = new Blob(['﻿', reportToCsv(report.value, label)], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `financial-report-${report.value.period.start}_${report.value.period.end}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

onMounted(load);
onUnmounted(() => bridgeChart?.destroy());
// Product names come translated from the API.
watch(locale, load);
watch(isDark, drawBridge);
</script>

<style scoped>
.finance { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; }

/* ─── Header ───────────────────────────────────────────────────────────────── */
.fin-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.fin-heading { display: flex; align-items: center; gap: 0.85rem; }
.fin-heading-icon {
  width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #f5e9ef; color: #8b2e5a;
}
.fin-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.2rem; }
.fin-subtitle { font-size: 0.85rem; color: #6b7280; margin: 0; }
.fin-controls { display: flex; align-items: flex-end; gap: 0.6rem; flex-wrap: wrap; }
.fin-select, .fin-date input {
  height: 40px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
  padding: 0 0.75rem; font-family: inherit; font-size: 0.85rem; color: #111827;
}
.fin-select { min-width: 160px; cursor: pointer; }
.fin-date { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.72rem; color: #6b7280; }
.date-field { position: relative; display: block; }
.date-field input { color: transparent; min-width: 150px; cursor: pointer; }
.date-field input::-webkit-datetime-edit { opacity: 0; }
.date-display {
  position: absolute; inset-inline-start: 0.75rem; top: 50%; transform: translateY(-50%);
  font-size: 0.85rem; color: #111827; pointer-events: none; font-variant-numeric: tabular-nums;
}
:global(.dark) .date-display { color: #e5e7eb; }
.fin-btn, .fin-btn-outline {
  height: 40px; display: inline-flex; align-items: center; gap: 0.45rem; padding: 0 1.1rem;
  border-radius: 8px; font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.fin-btn { background: #660033; color: #fff; border: none; }
.fin-btn-outline { background: #fff; color: #8b2e5a; border: 1px solid #8b2e5a; }
.fin-btn:disabled, .fin-btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.fin-inline-error { margin: -0.75rem 0 0; color: #dc2626; font-size: 0.8rem; }
.fin-body { display: flex; flex-direction: column; gap: 1.5rem; transition: opacity 0.2s; }
.fin-body.is-refreshing { opacity: 0.55; pointer-events: none; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ─── KPI cards ────────────────────────────────────────────────────────────── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.5rem; }
.kpi-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.4rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; min-width: 0;
}
.kpi-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.6rem; }
.kpi-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-icon :deep(svg) { display: block; }
.kpi-trend { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.78rem; font-weight: 600; }
.trend-good { color: #16a34a; }
.trend-bad { color: #dc2626; }
.trend-flat { color: #6b7280; }
.trend-none { color: #9ca3af; font-weight: 400; font-size: 0.7rem; }
.kpi-label { font-size: 0.85rem; color: #374151; margin-bottom: 0.9rem; }
.kpi-value { font-size: 1.55rem; font-weight: 600; color: #111827; line-height: 1.2; }
.kpi-sub { font-size: 0.75rem; color: #9ca3af; margin-top: 0.4rem; }
.money { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }

/* ─── Cards ────────────────────────────────────────────────────────────────── */
.fin-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); min-width: 0; display: flex; flex-direction: column;
}
.fin-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.4rem; flex-wrap: wrap; }
.card-title { display: flex; align-items: center; gap: 0.45rem; font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0; }
.card-hint { font-size: 0.78rem; color: #6b7280; margin: 0.3rem 0 0; }
.card-empty { color: #9ca3af; font-size: 0.85rem; text-align: center; padding: 2rem 0; }

/* Bridge */
.bridge-legend { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; font-size: 0.75rem; color: #4b5563; }
.bridge-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
.dot { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }
.dot-add { background: #22c55e; }
.dot-sub { background: #ef4444; }
.dot-total { background: #8b2e5a; }
.dot-net { background: #660033; }
.bridge-chart { position: relative; height: 320px; }
.formula {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
  margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px dashed #e5e7eb;
}
.formula-op { font-size: 1.1rem; font-weight: 600; color: #9ca3af; }
.formula-chip {
  display: inline-flex; flex-direction: column; gap: 0.15rem; padding: 0.45rem 0.75rem;
  border-radius: 8px; background: #f9fafb; border: 1px solid #f3f4f6;
}
.chip-label { font-size: 0.7rem; color: #6b7280; }
.chip-value { font-size: 0.88rem; font-weight: 600; color: #111827; }
.chip-add .chip-value { color: #16a34a; }
.chip-sub .chip-value { color: #dc2626; }
.chip-total { background: #fdf2f8; border-color: #f5d0e3; }
.chip-total .chip-value { color: #8b2e5a; }
.chip-result { background: #f5e9ef; border-color: #e3c4d3; }
.chip-result .chip-value { color: #660033; }

/* Distribution bars */
.bar { width: 100%; height: 8px; border-radius: 999px; background: #f3f4f6; overflow: hidden; display: flex; }
.bar-fill { height: 100%; border-radius: 999px; min-width: 2px; transition: width 0.4s ease; }
.fill-maroon { background: #8b2e5a; }
.fill-cyan { background: #06b6d4; }
.fill-orange { background: #f59e42; }
.fill-green { background: #22c55e; }
.fill-indigo { background: #6366f1; }
.fill-red { background: #ef4444; }
.dist-list { display: flex; flex-direction: column; gap: 1.35rem; }
.dist-row { display: flex; flex-direction: column; gap: 0.55rem; }
.dist-line { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.85rem; }
.dist-name { color: #111827; }
.dist-name small { color: #9ca3af; font-size: 0.75rem; }
.dist-figure { display: inline-flex; align-items: center; gap: 0.75rem; color: #374151; }
.dist-share { color: #6b7280; min-width: 3.2rem; text-align: end; }

/* Top products */
.product-list { display: flex; flex-direction: column; gap: 0.75rem; }
.product-row { display: flex; gap: 0.9rem; align-items: flex-start; padding: 0.9rem 1rem; border-radius: 10px; background: #f9fafb; }
.product-rank {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  background: #f5e9ef; color: #8b2e5a; font-weight: 700; font-size: 0.85rem;
}
.product-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.product-line { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.product-name { font-size: 0.88rem; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-revenue { font-weight: 600; color: #111827; font-size: 0.88rem; }
.product-meta { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.74rem; color: #6b7280; }

/* Risk */
.risk-card { background: linear-gradient(180deg, #fff 0%, #fffafa 100%); }
.risk-hero {
  display: flex; flex-direction: column; gap: 0.35rem; padding: 1rem 1.1rem; border-radius: 10px;
  background: #fef2f2; border: 1px solid #fee2e2; margin-bottom: 1.4rem;
}
.risk-label { font-size: 0.8rem; color: #991b1b; }
.risk-amount { font-size: 1.7rem; font-weight: 700; color: #b91c1c; }
.risk-sub { font-size: 0.78rem; color: #b91c1c; }
.risk-meter { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 1.2rem; }
.risk-meter:last-child { margin-bottom: 0; }
.meter-line { display: flex; justify-content: space-between; font-size: 0.85rem; color: #111827; }
.meter-value { font-weight: 600; }
.meter-hint { font-size: 0.72rem; color: #9ca3af; }

/* Empty, error, footnote */
.fin-empty { align-items: center; text-align: center; padding: 3rem 1.5rem; color: #9ca3af; gap: 0.5rem; }
.fin-empty h3 { margin: 0.5rem 0 0; color: #374151; font-size: 1rem; }
.fin-empty p { margin: 0; font-size: 0.85rem; }
.fin-error {
  background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #b91c1c;
}
.fin-footnote { font-size: 0.75rem; color: #9ca3af; margin: 0; }

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
.fin-skeleton { display: flex; flex-direction: column; gap: 1.5rem; --sk-base: #eef0f3; --sk-glint: #f8f9fb; }
:global(.dark) .fin-skeleton { --sk-base: #1e293b; --sk-glint: #2b3a50; }
.shimmer {
  display: block; border-radius: 6px;
  background: linear-gradient(90deg, var(--sk-base) 25%, var(--sk-glint) 50%, var(--sk-base) 75%);
  background-size: 200% 100%; animation: shimmer 1.3s ease-in-out infinite;
}
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .shimmer { animation: none; } }
.sk-icon { width: 48px; height: 48px; border-radius: 10px; margin-bottom: 1.4rem; }
.sk-line { height: 12px; width: 100%; }
.sk-w-40 { width: 40%; margin-bottom: 0.9rem; }
.sk-value { width: 60%; height: 26px; }
.sk-chart { width: 100%; height: 320px; }

/* ─── Dark mode ────────────────────────────────────────────────────────────── */
:global(.dark) .kpi-card,
:global(.dark) .fin-card,
:global(.dark) .fin-select,
:global(.dark) .fin-date input,
:global(.dark) .fin-btn-outline { background: #1e293b; border-color: #334155; color: #f1f5f9; }
:global(.dark) .fin-title,
:global(.dark) .kpi-value,
:global(.dark) .card-title,
:global(.dark) .dist-name,
:global(.dark) .product-name,
:global(.dark) .product-revenue,
:global(.dark) .meter-line,
:global(.dark) .chip-value { color: #f1f5f9; }
:global(.dark) .kpi-label { color: #cbd5e1; }
:global(.dark) .product-row,
:global(.dark) .formula-chip,
:global(.dark) .bar { background: #0f172a; border-color: #334155; }
:global(.dark) .risk-card { background: #1e293b; }
:global(.dark) .risk-hero { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.3); }

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 1024px) { .fin-row { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
  .kpi-top { margin-bottom: 1rem; }
  .kpi-icon { width: 40px; height: 40px; }
  .kpi-value { font-size: 1.15rem; }
  .trend-none { display: none; }
  .fin-controls { width: 100%; }
  .fin-select { flex: 1; }
  .fin-card, .kpi-card { padding: 1.1rem; }
  .bridge-chart { height: 260px; }
}
</style>
