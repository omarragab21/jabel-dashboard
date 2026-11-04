import api from '../config/axios';
import { normalizeImageUrl } from '../domain/orders/adminOrder';
import { encodePathSegment } from '../utils/adminSecurity';

const unwrapList = (payload) => {
  const body = payload?.data ?? payload;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
};

const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const productImageOf = (raw = {}) => {
  const url = first(
    raw.product?.image_url,
    raw.product?.thumb_url,
    raw.product?.image,
    raw.product?.images?.find?.((image) => image?.is_primary)?.image_url,
    raw.product?.images?.[0]?.image_url,
  );
  return url ? normalizeImageUrl(url) : undefined;
};

const productNamesOf = (product) => {
  const ar = product?.translations?.ar?.name;
  const en = product?.translations?.en?.name;
  return ar || en ? { ar: first(ar, product?.name), en: first(en, product?.name) } : undefined;
};

const normalizeReturnItem = (raw = {}) => ({
  ...raw,
  id: first(raw.id, raw.order_item_id, raw.orderItemId),
  orderItemId: first(raw.order_item_id, raw.orderItemId, raw.id),
  productId: first(raw.product_id, raw.product?.id),
  productName: first(raw.product_name, raw.product?.name, raw.order_item?.product_name, raw.order_item?.name, 'منتج غير محدد'),
  productNames: productNamesOf(raw.product),
  productImage: productImageOf(raw) ?? first(raw.product_image, raw.order_item?.image),
  quantity: Math.max(1, Number(raw.quantity) || 1),
  unitPrice: Number(first(raw.unit_price, raw.price, raw.order_item?.unit_price, raw.order_item?.price, 0)) || 0,
  condition: first(raw.condition, '—'),
  reason: first(raw.item_reason, raw.reason, raw.customer_note, '—'),
  refundAmount: Number(first(raw.total_refund, raw.refund_amount, raw.refundAmount, raw.total_price, raw.order_item?.total_price, 0)) || 0,
});

export const normalizeReturn = (raw = {}) => ({
  ...raw,
  id: first(raw.id, raw.return_id, raw.returnId),
  returnNumber: first(raw.return_number, raw.returnNumber, raw.number, raw.id),
  orderId: first(raw.order_id, raw.order?.id),
  orderNumber: first(raw.order_number, raw.order?.order_number, raw.order?.number),
  customerName: first(raw.customer_name, raw.customer?.name, raw.user?.name, '—'),
  customerEmail: first(raw.customer_email, raw.customer?.email, raw.user?.email, '—'),
  items: (Array.isArray(raw.items) ? raw.items : Array.isArray(raw.return_items) ? raw.return_items : []).map(normalizeReturnItem),
  productName: first(raw.product_name, raw.product?.name, raw.order_item?.product_name, raw.order_item?.name, raw.items?.[0]?.product?.name, 'منتج غير محدد'),
  productImage: first(raw.product_image, raw.product?.image_url, raw.product?.image, raw.order_item?.image, raw.items?.[0]?.product?.image_url),
  reason: first(raw.reason, raw.customer_note, '—'),
  adminNotes: first(raw.admin_notes, raw.admin_note, raw.adminNote),
  refundAmount: Number(first(raw.refund_amount, raw.refundAmount, raw.items?.reduce((sum, item) => sum + (Number(item.refund_amount) || 0), 0), raw.order_item?.total_price, 0)) || 0,
  status: String(first(raw.status, 'pending')).toLowerCase(),
  date: first(raw.date, raw.created_at, raw.createdAt),
});

const orderCache = new Map();

const fetchOrder = async (orderId) => {
  const safeId = encodePathSegment(orderId, 'order id');
  if (!orderCache.has(safeId)) {
    orderCache.set(safeId, api.get(`/v1/orders/${safeId}`)
      .then((response) => response.data?.data ?? response.data)
      .catch((error) => {
        orderCache.delete(safeId);
        throw error;
      }));
  }
  return orderCache.get(safeId);
};

// `/v1/returns` carries no customer or product image. Both live on the linked order,
// so a return is completed from `GET /v1/orders/{order_id}` (cached per order).
export const attachOrder = (ret, order) => {
  if (!order || typeof order !== 'object') return ret;
  const customer = order.user ?? order.customer ?? {};
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const items = ret.items.map((item) => {
    const orderItem = orderItems.find((candidate) => String(candidate.id) === String(item.orderItemId))
      ?? orderItems.find((candidate) => item.productId && String(candidate.product_id) === String(item.productId));
    const product = orderItem?.product;
    return {
      ...item,
      productImage: first(item.productImage, productImageOf({ product })),
      productNames: item.productNames ?? productNamesOf(product),
      unitPrice: item.unitPrice || Number(first(orderItem?.unit_price, 0)) || 0,
    };
  });
  return {
    ...ret,
    items,
    productImage: first(ret.productImage, items[0]?.productImage),
    orderNumber: first(ret.orderNumber, order.order_number),
    customerName: first(customer.name, order.customer_name, order.shipping_name, ret.customerName === '—' ? undefined : ret.customerName, '—'),
    customerEmail: first(customer.email, order.customer_email, ret.customerEmail === '—' ? undefined : ret.customerEmail, '—'),
    customerPhone: first(customer.phone, order.customer_phone, order.shipping_phone, ret.customerPhone),
  };
};

export const returnsService = {
  async listMine() {
    const response = await api.get('/v1/site/returns');
    return unwrapList(response.data).map(normalizeReturn);
  },

  async create(payload) {
    const orderId = payload?.order_id;
    if (!orderId) throw new Error('رقم الطلب مطلوب لإنشاء طلب الإرجاع');
    const safeOrderId = encodePathSegment(orderId, 'order id');
    const items = Array.isArray(payload?.items) && payload.items.length
      ? payload.items
      : [{
        order_item_id: payload.order_item_id,
        quantity: payload.quantity || 1,
        condition: payload.condition || 'opened',
        reason: payload.reason,
      }];
    if (!items[0]?.order_item_id) throw new Error('يجب اختيار منتج من الطلب');
    const response = await api.post(`/v1/site/orders/${safeOrderId}/returns`, {
      reason: String(payload.reason || '').trim(),
      items: items.map((item) => ({
        order_item_id: item.order_item_id,
        quantity: Math.max(1, Number(item.quantity) || 1),
        condition: item.condition || 'opened',
        ...(item.reason ? { reason: String(item.reason).trim() } : {}),
      })),
    });
    return response.data;
  },

  async listAll() {
    const response = await api.get('/v1/returns');
    return unwrapList(response.data).map(normalizeReturn);
  },

  async getById(id) {
    const safeId = encodePathSegment(id, 'return id');
    const response = await api.get(`/v1/returns/${safeId}`);
    const ret = normalizeReturn(response.data?.data ?? response.data);
    if (!ret.orderId) return ret;
    try {
      return attachOrder(ret, await fetchOrder(ret.orderId));
    } catch {
      return ret;
    }
  },

  /**
   * Completes each return with its order's customer and product images. Returns are updated
   * one order at a time so the list can render immediately and fill in as orders arrive.
   */
  async attachOrders(returns, onProgress, concurrency = 4) {
    let current = returns;
    const orderIds = [...new Set(returns.map((ret) => ret.orderId).filter(Boolean))];
    let cursor = 0;
    const worker = async () => {
      while (cursor < orderIds.length) {
        const orderId = orderIds[cursor++];
        try {
          const order = await fetchOrder(orderId);
          current = current.map((ret) => (String(ret.orderId) === String(orderId) ? attachOrder(ret, order) : ret));
          onProgress?.(current);
        } catch {
          // Keep the placeholder customer when the order cannot be read.
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, orderIds.length) }, worker));
    return current;
  },

  async updateStatus(id, payload) {
    const safeId = encodePathSegment(id, 'return id');
    const status = String(payload?.status || '').toLowerCase();
    const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status;
    if (!['approve', 'reject'].includes(action)) throw new Error('حالة الإرجاع غير مدعومة');
    const response = await api.post(`/v1/returns/${safeId}/review`, {
      action,
      ...(payload?.admin_notes ? { admin_notes: String(payload.admin_notes).trim() } : {}),
    });
    return response.data;
  },
};

export default returnsService;
