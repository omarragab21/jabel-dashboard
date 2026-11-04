// Tijara orders contract, verified live in reports/tijara-orders-api-qa-2026-10-13.md.

// `in_transit` ("الطلب في الطريق") is the step between shipped and delivered.
// The backend enum does not have it yet; until it does, PATCHing it returns 422.
export const ORDER_STEPS = ['pending', 'paid_confirmed', 'processing', 'shipped', 'in_transit', 'delivered'];
export const ORDER_STATUSES = [...ORDER_STEPS, 'cancelled'];

// Keep the admin order timeline identical to the customer website timeline.
export const ORDER_TRACKING_STEPS = [
  { key: 'received', rank: 1, label: 'تم استلام الطلب', icon: 'fas fa-inbox', dateField: 'createdAt' },
  { key: 'confirmed', rank: 2, label: 'تم تأكيد الطلب', icon: 'fas fa-clipboard-check', dateField: 'paymentTime' },
  { key: 'processing', rank: 3, label: 'تم تجهيز الطلب', icon: 'fas fa-box-open', dateField: 'updatedAt' },
  { key: 'shipped', rank: 4, label: 'تم الشحن', icon: 'fas fa-box', dateField: 'shippedAt' },
  { key: 'transit', rank: 5, label: 'الطلب في الطريق', icon: 'fas fa-truck', dateField: 'shippedAt', note: 'طلبك في طريقه إليك' },
  { key: 'delivered', rank: 6, label: 'تم الاستلام', icon: 'fas fa-house', dateField: 'deliveredAt' },
];

const TRACKING_STATUS_RANKS = {
  pending: 1,
  confirmed: 2,
  paid_confirmed: 2,
  processing: 3,
  shipped: 4,
  shipping: 4,
  in_transit: 5,
  delivering: 5,
  in_delivery: 5,
  out_for_delivery: 5,
  delivered: 6,
  completed: 6,
};

// Same wording as the tracking timeline, so the dropdown reads as the next step.
const STATUS_LABELS = {
  pending: 'تم استلام الطلب',
  paid_confirmed: 'تم تأكيد الطلب',
  processing: 'تم تجهيز الطلب',
  shipped: 'تم الشحن',
  in_transit: 'الطلب في الطريق',
  delivered: 'تم الاستلام',
  cancelled: 'ملغي',
};

const PAYMENT_STATUS_LABELS = {
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
  refunded: 'مسترجع',
};

const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: 'دفع عند الاستلام',
  cod: 'دفع عند الاستلام',
  cash: 'دفع عند الاستلام',
  credit_card: 'بطاقة ائتمان',
  card: 'بطاقة ائتمان',
  paytabs: 'بطاقة ائتمان (Paytabs)',
  wallet: 'المحفظة الإلكترونية',
  bank_transfer: 'تحويل بنكي',
};

// The backend accepts any status from any status, so the admin enforces the
// lifecycle itself: forward one step at a time. An order can still be cancelled
// after it ships (shipped / on the way: a delivery problem), always with a written reason.
const TRANSITIONS = {
  pending: ['paid_confirmed', 'cancelled'],
  paid_confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;
export const trackingStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  const rank = TRACKING_STATUS_RANKS[normalized] || 0;
  return ORDER_TRACKING_STEPS.find((step) => step.rank === rank)?.label || statusLabel(status);
};
export const paymentStatusLabel = (status) => PAYMENT_STATUS_LABELS[status] || status || 'غير محدد';
export const paymentMethodLabel = (method) => {
  if (!method) return 'غير محدد';
  return PAYMENT_METHOD_LABELS[String(method).toLowerCase().trim()] || method;
};

export const nextStatuses = (status) => TRANSITIONS[status] || [];
export const canTransition = (from, to) => nextStatuses(from).includes(to);
export const isFinalStatus = (status) => ORDER_STATUSES.includes(status) && nextStatuses(status).length === 0;

// `paid_confirmed` does not touch payment_status on the backend, so send both.
// Cancelling needs a written reason; it is sent in this field and read back from it.
export const CANCEL_REASON_FIELD = 'cancellation_reason';
export const CANCEL_REASON_MIN = 3;
export const CANCEL_REASON_MAX = 500;

// Keeps the writer's line breaks, but squeezes runs of spaces and blank lines.
export const cleanCancelReason = (reason) => String(reason ?? '')
  .replace(/\r\n?/g, '\n')
  .replace(/[^\S\n]+/g, ' ')
  .replace(/ ?\n ?/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const toStatusPayload = (from, to, reason = '', rawNotes) => {
  if (!canTransition(from, to)) {
    throw new Error(`لا يمكن تغيير حالة الطلب من "${statusLabel(from)}" إلى "${statusLabel(to)}"`);
  }
  if (to === 'cancelled') {
    const text = cleanCancelReason(reason);
    if (text.length < CANCEL_REASON_MIN) throw new Error('اكتب سبب الإلغاء');
    if (text.length > CANCEL_REASON_MAX) throw new Error(`سبب الإلغاء أطول من ${CANCEL_REASON_MAX} حرف`);
    // The reason is also written into the notes: that is the field the API keeps and returns.
    return rawNotes === undefined
      ? { status: to, [CANCEL_REASON_FIELD]: text }
      : { status: to, [CANCEL_REASON_FIELD]: text, notes: withCancelReason(rawNotes, text) };
  }
  return to === 'paid_confirmed' ? { status: to, payment_status: 'paid' } : { status: to };
};

// Money fields arrive as raw floats (876.8500000000000227…).
export const money = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
};

const pad = (value) => String(value).padStart(2, '0');
const localDateTime = (iso) => {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: '', time: '' };
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

import { sanitizeAssetUrl } from '../../utils/adminSecurity.js';
import { orderItemChoices, parseCancelReason, parseOrderOptions, stripOrderOptions, withCancelReason } from './orderOptions.js';

// The orders endpoint returns /storage/… (HTTP 403) while the same file is
// served at /public/storage/… (the form the products endpoint already uses).
export const normalizeImageUrl = (url) => sanitizeAssetUrl(url, '');

const productImage = (product = {}) => {
  const images = Array.isArray(product.images) ? product.images : [];
  const primary = images.find((image) => image?.is_primary) || images[0];
  return normalizeImageUrl(product.image_url || primary?.image_url || primary?.url);
};

const firstFilled = (...values) => values.map((value) => String(value ?? '').trim()).find(Boolean) || '';

const toOrderProduct = (item = {}) => ({
  id: item.id,
  productId: item.product_id ?? item.product?.id,
  name: item.product?.name ?? '',
  image: productImage(item.product || {}),
  quantity: Number(item.quantity) || 0,
  price: money(item.unit_price),
  total: money(item.total_price),
});

export const toOrder = (raw) => {
  const order = raw || {};
  const user = order.user || {};
  // Each item's chosen options (color, size…) are in its `description`; older orders have them in the notes.
  const optionEntries = parseOrderOptions(order.notes);
  const items = Array.isArray(order.items) ? order.items : [];
  return {
    id: order.id,
    orderNumber: order.order_number ?? '',
    status: order.status ?? '',
    paymentStatus: order.payment_status ?? '',
    paymentMethod: order.payment_method ?? '',
    paymentTime: order.payment_time ?? null,
    transactionId: order.transaction_id ?? '',
    couponCode: order.coupon_code ?? '',
    customerName: user.name ?? '',
    customerEmail: user.email ?? '',
    customerPhone: user.phone_number ?? user.phone ?? '',
    customerAddress: firstFilled(order.shipping_address, order.billing_address),
    billingAddress: order.billing_address ?? '',
    notes: stripOrderOptions(order.notes),
    rawNotes: order.notes ?? '',
    // The API has no cancellation field, so the reason also lives in the notes.
    cancellationReason: firstFilled(order[CANCEL_REASON_FIELD], order.cancel_reason, order.cancelled_reason, parseCancelReason(order.notes)),
    hasChosenOptions: optionEntries.length > 0 || items.some((item) => Array.isArray(item?.description?.choices) && item.description.choices.length > 0),
    products: Array.isArray(order.items)
      ? order.items.map((item) => ({ ...toOrderProduct(item), choices: orderItemChoices(item, optionEntries) }))
      : [],
    subtotal: money(order.subtotal),
    discount: money(order.discount),
    shipping: money(order.shipping_cost),
    tax: money(order.tax_amount),
    total: money(order.total_amount),
    ...localDateTime(order.created_at),
    createdAt: order.created_at ?? null,
    updatedAt: order.updated_at ?? null,
    shippedAt: order.shipped_at ?? null,
    deliveredAt: order.delivered_at ?? null,
    estimatedDelivery: order.estimated_delivery ?? null,
  };
};

export const trackingRank = (order = {}) => {
  const status = String(order.status || 'pending').toLowerCase();
  const statusRank = TRACKING_STATUS_RANKS[status] || 0;
  if (statusRank > 0) return statusRank;
  if (order.deliveredAt) return 6;
  if (order.shippedAt) return 4;
  return order.createdAt || order.date ? 1 : 0;
};

export const trackingStepState = (order, step) => {
  const rank = trackingRank(order);
  if (rank >= step) return rank === step ? 'active' : 'completed';
  return 'pending';
};

export const trackingStepIcon = (step, state) => state === 'pending' ? step.icon : 'fas fa-check';
