// Financial reports (التقارير المالية): GET /v1/financial-reports?start_date=Y-m-d&end_date=Y-m-d
// Without dates the backend reports the current month to date. Every figure counts paid orders
// in the period and comes rounded to whole riyals:
//   gross_sales = subtotal + total_tax + total_shipping - discounts_granted
//   net_realized_revenue = gross_sales - refunds_deducted
//   average_order_value = gross_sales / settled_orders_count
// Cancelled orders are reported apart, under risk_metrics.

const amount = (value) => Math.round((Number(value) || 0) * 100) / 100;
const count = (value) => Math.max(0, Math.trunc(Number(value) || 0));
const list = (value) => (Array.isArray(value) ? value : []);
const share = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

const pad = (n) => String(n).padStart(2, '0');
export const isoDay = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDay = (day) => {
  const [y, m, d] = String(day).split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (day, days) => {
  const date = parseDay(day);
  date.setDate(date.getDate() + days);
  return isoDay(date);
};

export const REPORT_PRESETS = ['this_month', 'last_7', 'last_30', 'last_month', 'this_year', 'custom'];

export const presetRange = (preset, today = new Date()) => {
  const end = isoDay(today);
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (preset) {
    case 'last_7': return { start: addDays(end, -6), end };
    case 'last_30': return { start: addDays(end, -29), end };
    case 'last_month': return { start: isoDay(new Date(y, m - 1, 1)), end: isoDay(new Date(y, m, 0)) };
    case 'this_year': return { start: `${y}-01-01`, end };
    case 'this_month':
    default: return { start: isoDay(new Date(y, m, 1)), end };
  }
};

export const isValidDay = (day) => /^\d{4}-\d{2}-\d{2}$/.test(String(day)) && isoDay(parseDay(day)) === day;

export const periodDays = ({ start, end }) => Math.round((parseDay(end) - parseDay(start)) / 86400000) + 1;

// The period of the same length right before, for the trend on each card.
export const previousPeriod = ({ start, end }) => {
  const days = periodDays({ start, end });
  return { start: addDays(start, -days), end: addDays(start, -1) };
};

// null when there is nothing to compare with, so no trend is shown.
export const percentChange = (current, previous) => {
  if (!Number(previous)) return null;
  return Math.round(((Number(current) - Number(previous)) / Math.abs(Number(previous))) * 1000) / 10;
};

export const toFinancialReport = (data = {}) => {
  const s = data.summary || {};
  const risk = data.risk_metrics || {};
  const summary = {
    gross: amount(s.gross_sales),
    subtotal: amount(s.subtotal),
    tax: amount(s.total_tax),
    shipping: amount(s.total_shipping),
    discounts: amount(s.discounts_granted),
    refunds: amount(s.refunds_deducted),
    net: amount(s.net_realized_revenue),
    aov: amount(s.average_order_value),
    settled: count(s.settled_orders_count),
    refundedOrders: count(s.refunded_orders_count),
  };
  const cancelledCount = count(risk.cancelled_orders_count);
  const gateways = list(data.payment_gateways)
    .map((row) => ({ method: String(row.method || 'unknown'), amount: amount(row.amount), transactions: count(row.transactions) }))
    .sort((a, b) => b.amount - a.amount);
  const gatewayTotal = gateways.reduce((sum, row) => sum + row.amount, 0);

  return {
    period: { start: data.report_period?.start_date || '', end: data.report_period?.end_date || '' },
    generatedAt: data.generated_at || '',
    summary,
    risk: {
      cancelledAmount: amount(risk.total_cancelled_amount),
      cancelledCount,
      // Out of every order that reached a final money state in the period.
      cancelRate: share(cancelledCount, cancelledCount + summary.settled),
      refundRate: share(summary.refunds, summary.gross),
    },
    composition: [
      { key: 'products', value: summary.subtotal, share: share(summary.subtotal, summary.gross) },
      { key: 'tax', value: summary.tax, share: share(summary.tax, summary.gross) },
      { key: 'shipping', value: summary.shipping, share: share(summary.shipping, summary.gross) },
    ],
    gateways: gateways.map((row) => ({ ...row, share: share(row.amount, gatewayTotal) })),
    topProducts: list(data.top_revenue_products)
      .map((row) => ({ id: row.product_id, name: row.name || '-', units: count(row.units_sold), revenue: amount(row.gross_revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .map((row, index) => ({ ...row, rank: index + 1, share: share(row.revenue, summary.subtotal) })),
    // The backend rounds each figure on its own, so the sum may be off by a riyal or two.
    reconciles: Math.abs(summary.subtotal + summary.tax + summary.shipping - summary.discounts - summary.gross) <= 2
      && Math.abs(summary.gross - summary.refunds - summary.net) <= 2,
    isEmpty: !summary.gross && !summary.refunds && !cancelledCount,
  };
};

// The bridge from products sold to the money kept: floating bars [from, to].
export const waterfallSteps = (summary) => {
  const steps = [];
  let level = 0;
  const push = (key, kind, delta) => {
    const from = kind === 'total' || kind === 'result' ? 0 : level;
    const to = kind === 'total' || kind === 'result' ? delta : level + delta;
    steps.push({ key, kind, from: amount(from), to: amount(to), value: amount(Math.abs(delta)) });
    level = to;
  };
  push('products', 'base', summary.subtotal);
  push('tax', 'add', summary.tax);
  push('shipping', 'add', summary.shipping);
  push('discounts', 'sub', -summary.discounts);
  push('gross', 'total', summary.gross);
  push('refunds', 'sub', -summary.refunds);
  push('net', 'result', summary.net);
  return steps;
};

const csvCell = (value) => {
  const text = String(value ?? '');
  // A leading = + - @ would run as a formula in Excel.
  const safe = /^[=+\-@]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const reportToCsv = (report, label) => {
  const rows = [
    [label('period'), `${report.period.start} → ${report.period.end}`],
    [],
    [label('section_summary')],
    [label('products'), report.summary.subtotal],
    [label('tax'), report.summary.tax],
    [label('shipping'), report.summary.shipping],
    [label('discounts'), report.summary.discounts],
    [label('gross'), report.summary.gross],
    [label('refunds'), report.summary.refunds],
    [label('net'), report.summary.net],
    [label('aov'), report.summary.aov],
    [label('settled'), report.summary.settled],
    [label('refunded_orders'), report.summary.refundedOrders],
    [label('cancelled_amount'), report.risk.cancelledAmount],
    [label('cancelled_count'), report.risk.cancelledCount],
    [],
    [label('section_gateways'), label('amount'), label('transactions'), '%'],
    ...report.gateways.map((row) => [label(`method:${row.method}`), row.amount, row.transactions, row.share]),
    [],
    [label('section_products'), label('units'), label('revenue'), '%'],
    ...report.topProducts.map((row) => [row.name, row.units, row.revenue, row.share]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
};
