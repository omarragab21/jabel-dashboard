// The customer page (العملاء → customer): order history, shipping addresses and reviews.
// GET /v1/users/{id} carries all three, but its orders have no items and its reviews no product,
// so those two come from the orders and reviews lists, matched by id.
import { statusLabel } from '../orders/adminOrder';

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const day = (value) => (value ? String(value).slice(0, 10) : '');
const list = (value) => (Array.isArray(value) ? value : []);
// Newest first by the full timestamp, then the higher id, so rows from the same day keep a fixed order.
const newestFirst = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || Number(b.id) - Number(a.id);

export const customerOrders = (user = {}, allOrders = []) => list(user.orders)
  .map((order) => {
    const full = list(allOrders).find((o) => String(o.id) === String(order.id));
    const items = list(full?.items ?? full?.products ?? order.items);
    return {
      id: order.id,
      number: order.order_number || `#${order.id}`,
      date: day(order.created_at),
      createdAt: order.created_at || '',
      itemsCount: items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
      total: money(order.total_amount),
      status: String(order.status || 'pending').toLowerCase(),
      statusLabel: statusLabel(String(order.status || 'pending').toLowerCase()),
    };
  })
  .sort(newestFirst);

export const customerAddresses = (user = {}) => list(user.addresses)
  .map((address) => ({
    id: address.id,
    title: address.name || '',
    address: address.address || '',
    city: address.city || '',
    area: address.area || '',
    phone: address.phone_number || address.phone || '',
    notes: address.notes || '',
    isDefault: Boolean(address.is_default),
  }))
  .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

export const customerReviews = (user = {}, allReviews = []) => list(user.product_reviews ?? user.reviews)
  .map((review) => {
    const full = list(allReviews).find((r) => String(r.id) === String(review.id));
    const product = review.product || full?.product || {};
    return {
      id: review.id,
      productId: product.id ?? null,
      productName: product.name || '',
      rating: Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0))),
      comment: review.comment || '',
      date: day(review.created_at),
      createdAt: review.created_at || '',
      approved: review.is_approved === true || review.is_approved === 1 || review.is_approved === '1',
    };
  })
  .sort(newestFirst);

// Cancelled orders are not money the customer spent.
export const customerStats = (user = {}, orders = customerOrders(user), addresses = customerAddresses(user)) => ({
  ordersCount: orders.length,
  totalSpent: money(orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)),
  city: (addresses.find((a) => a.isDefault) || addresses[0])?.city?.split('،')[0]?.trim() || '',
  joined: day(user.created_at || user.createdAt),
});
