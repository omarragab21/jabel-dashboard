// The dashboard (لوحة القيادة) reads two routes:
//   GET /v1/overview                       → metrics, order_distribution, top_selling_products,
//                                             recent_orders, low_stock_alerts, recent_returns
//   GET /v1/overview/chart?range=daily|monthly → [{ date | year_month, label, revenue }]
// Sales figures on the backend count paid orders only. Names and chart labels come
// translated by Accept-Language.

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const count = (value) => Math.max(0, Math.trunc(Number(value) || 0));
const list = (value) => (Array.isArray(value) ? value : []);

export const CHART_RANGES = ['daily', 'monthly'];

// Every status the backend counts, in the design's legend order.
export const ORDER_STATUS_SLICES = [
  { key: 'delivered', labelKey: 'completed', color: '#22c55e' },
  { key: 'paid_confirmed', labelKey: 'confirmed', color: '#06b6d4' },
  { key: 'processing', labelKey: 'processing', color: '#6366f1' },
  { key: 'shipped', labelKey: 'shipped', color: '#8b2e5a' },
  { key: 'pending', labelKey: 'pending', color: '#9ca3af' },
  { key: 'cancelled', labelKey: 'cancelled', color: '#f59e42' },
];

// Below this many pieces a product counts as running out; the bar fills against it.
export const LOW_STOCK_SCALE = 10;

export const stockLevel = (stock) => {
  const value = count(stock);
  if (value <= 0) return 'out';
  return value <= 3 ? 'critical' : 'low';
};

export const stockBarPercent = (stock) => Math.min(100, Math.round((count(stock) / LOW_STOCK_SCALE) * 100));

export const toOverview = (data = {}) => {
  const metrics = data.metrics || {};
  const distribution = data.order_distribution || {};
  const slices = ORDER_STATUS_SLICES.map((slice) => ({ ...slice, count: count(distribution[slice.key]) }));
  const counted = slices.reduce((sum, slice) => sum + slice.count, 0);

  return {
    metrics: {
      todaySales: money(metrics.today_sales),
      monthSales: money(metrics.month_sales),
      // Only the month has a comparison on the backend; null hides the trend.
      monthSalesPct: metrics.month_sales_pct === undefined || metrics.month_sales_pct === null ? null : Number(metrics.month_sales_pct),
      todayOrders: count(metrics.today_orders),
      totalCustomers: count(metrics.total_customers),
      totalProducts: count(metrics.total_products),
    },
    distribution: {
      total: distribution.total === undefined ? counted : count(distribution.total),
      slices,
    },
    topProducts: list(data.top_selling_products)
      .map((row, index) => ({
        rank: count(row.rank) || index + 1,
        id: row.product_id,
        name: row.product_name || '-',
        sold: count(row.total_sold),
        revenue: money(row.total_revenue),
      }))
      .sort((a, b) => a.rank - b.rank),
    recentOrders: list(data.recent_orders).map((order) => ({
      id: order.id,
      number: order.order_number || `#${order.id}`,
      customer: order.customer_name || '-',
      total: money(order.total_amount),
      status: String(order.status || 'pending').toLowerCase(),
      paymentStatus: String(order.payment_status || '').toLowerCase(),
      createdAt: order.created_at || '',
    })),
    lowStock: list(data.low_stock_alerts)
      .map((item) => ({
        id: item.id,
        name: item.name || '-',
        stock: count(item.stock),
        image: item.image_url || '',
        level: stockLevel(item.stock),
        bar: stockBarPercent(item.stock),
      }))
      .sort((a, b) => a.stock - b.stock),
    recentReturns: list(data.recent_returns).map((ret) => ({
      id: ret.id,
      number: ret.return_number || `#${ret.id}`,
      orderNumber: ret.order_number || '',
      status: String(ret.status || 'pending').toLowerCase(),
      amount: money(ret.refund_amount),
      productName: ret.product_name || '-',
      date: ret.created_at ? String(ret.created_at).slice(0, 10) : '',
    })),
  };
};

export const toChartSeries = (payload = {}) => list(payload.data ?? payload).map((point) => ({
  key: point.date || point.year_month || point.label || '',
  label: point.label || point.date || point.year_month || '',
  revenue: money(point.revenue),
}));
