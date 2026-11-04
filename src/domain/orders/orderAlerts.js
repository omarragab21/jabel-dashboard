// Detects orders that arrived since the admin last looked, from the first page of GET /v1/orders (newest first).
// The first check only records where things stand; it never announces the existing orders.

export const SEEN_KEY = 'admin_orders_seen';

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const newestId = (orders = []) => orders.reduce((max, order) => Math.max(max, num(order?.id)), 0);

/** { baseline: id|null, fresh: [oldest first] } — fresh is empty when there is no baseline yet. */
export const findNewOrders = (orders = [], seenId = null) => {
  const latest = newestId(orders);
  if (seenId === null || seenId === undefined || seenId === '') return { baseline: latest, fresh: [] };
  const seen = num(seenId);
  const fresh = orders.filter((order) => num(order?.id) > seen).sort((a, b) => num(a.id) - num(b.id));
  return { baseline: Math.max(seen, latest), fresh };
};

const money = (value) => num(value).toLocaleString('en-US', { maximumFractionDigits: 2 });

/** What the bell shows for one new order. */
export const toOrderAlert = (order = {}, lang = 'ar') => {
  const number = order.order_number || `#${order.id}`;
  const customer = order.user?.name || '';
  const total = money(order.total_amount ?? order.total);
  const en = lang === 'en';
  return {
    key: `order-${order.id}`,
    title: en ? 'New order' : 'طلب جديد',
    body: en
      ? `${number}${customer ? ` from ${customer}` : ''} — ${total} JOD`
      : `طلب \u2066${number}\u2069${customer ? ` من ${customer}` : ''} بقيمة ${total} د.أ`,
    link: `/admin/orders?search=${encodeURIComponent(order.order_number || order.id)}`,
  };
};
