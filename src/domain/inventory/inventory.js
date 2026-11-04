// Inventory (إدارة المخزون): product stock levels, the stock movement reports and manual adjustments.
//   GET  /v1/reports/movements                 { overview, breakdown_by_type, movements, pagination }
//        filters: type, direction (in|out), from_date, to_date, product_id, user_id, page, per_page
//   GET  /v1/reports/movements/product/{id}    the same shape for one product (404 when it does not exist)
//   POST /v1/products/{id}/adjust-stock        { quantity: +n adds / -n removes, reason?, notes? }
//        422 for 0, a fraction, text, or removing more than is in stock.

// A product is "low" at this many units or fewer, and "out" at zero.
export const LOW_STOCK_LIMIT = 5;
export const REASON_MAX = 255;
export const NOTES_MAX = 1000;
export const QUANTITY_MAX = 100000;

export const MOVEMENT_TYPES = ['sale', 'purchase', 'adjustment', 'return'];
const TYPE_LABELS = {
  sale: ['بيع', 'Sale'],
  purchase: ['توريد', 'Purchase'],
  adjustment: ['تعديل يدوي', 'Adjustment'],
  return: ['مرتجع', 'Return'],
};
export const movementTypeLabel = (type, lang = 'ar') => {
  const pair = TYPE_LABELS[type];
  return pair ? pair[lang === 'en' ? 1 : 0] : String(type || '');
};

const STATUS_LABELS = {
  in: ['متوفر', 'In stock'],
  low: ['منخفض', 'Low'],
  out: ['نفاد', 'Out of stock'],
};
export const stockStatusLabel = (status, lang = 'ar') => (STATUS_LABELS[status] || STATUS_LABELS.in)[lang === 'en' ? 1 : 0];

const count = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const stockStatus = (stock) => {
  const n = count(stock);
  if (n <= 0) return 'out';
  if (n <= LOW_STOCK_LIMIT) return 'low';
  return 'in';
};

// Bar fill: a full bar is four times the low-stock limit.
export const stockBarPercent = (stock) => Math.max(0, Math.min(100, Math.round((count(stock) / (LOW_STOCK_LIMIT * 4)) * 100)));

const unitPrice = (product) => count(product.final_price ?? product.price);

export const inventoryStats = (products = []) => products.reduce((stats, product) => {
  const stock = count(product.stock);
  const status = stockStatus(stock);
  stats.total += 1;
  if (status === 'out') stats.out += 1;
  if (status === 'low') stats.low += 1;
  stats.value += Math.max(0, stock) * unitPrice(product);
  return stats;
}, { total: 0, out: 0, low: 0, value: 0 });

// Out-of-stock first, then the lowest stock.
export const stockAlerts = (products = []) => products
  .filter((product) => stockStatus(product.stock) !== 'in')
  .sort((a, b) => count(a.stock) - count(b.stock));

const normalize = (value) => String(value ?? '').toLowerCase().trim();

export const productCategoryId = (product = {}) => product.category?.id ?? product.category_id ?? null;

/** Search by name (either language) or product number; filter by category (a main category includes its sub-categories) and stock status. */
export const filterInventory = (products = [], { search = '', categoryId = '', status = '' } = {}) => {
  const query = normalize(search).replace(/^#/, '');
  return products.filter((product) => {
    if (status && stockStatus(product.stock) !== status) return false;
    if (categoryId) {
      const own = productCategoryId(product);
      const parent = product.category?.parent_id ?? product.category?.parent?.id;
      if (String(own) !== String(categoryId) && String(parent ?? '') !== String(categoryId)) return false;
    }
    if (!query) return true;
    const names = [product.name, product.name_i18n?.ar, product.name_i18n?.en, product.id].map(normalize);
    return names.some((name) => name.includes(query));
  });
};

// The API writes its own reasons in English; the common ones are shown in the admin's language.
export const movementReasonText = (reason, lang = 'ar') => {
  const text = String(reason ?? '').trim();
  if (!text) return '';
  const order = text.match(/^Order #(\S+) checkout$/i);
  if (order) return lang === 'en' ? `Order #${order[1]}` : `طلب #${order[1]}`;
  const known = {
    'initial inventory stock on product creation': ['مخزون افتتاحي عند إضافة المنتج', 'Opening stock when the product was added'],
    'manual stock addition': ['إضافة يدوية', 'Manual addition'],
    'manual stock reduction': ['خصم يدوي', 'Manual reduction'],
  }[text.toLowerCase()];
  return known ? known[lang === 'en' ? 1 : 0] : text;
};

export const toMovement = (raw = {}) => ({
  id: raw.id,
  type: raw.type || '',
  direction: raw.direction === 'outbound' || count(raw.quantity) < 0 ? 'out' : 'in',
  quantity: count(raw.quantity),
  previousStock: count(raw.previous_stock),
  currentStock: count(raw.current_stock),
  unitCost: count(raw.unit_cost),
  totalCost: count(raw.total_cost),
  reason: raw.reason || '',
  notes: raw.notes || '',
  occurredAt: raw.occurred_at || raw.created_at || '',
  product: raw.product ? { id: raw.product.id, name: raw.product.name || '', stock: count(raw.product.current_stock) } : null,
  user: raw.user ? { id: raw.user.id, name: raw.user.name || raw.user.email || '' } : null,
  reference: raw.reference ? { type: raw.reference.type || '', id: raw.reference.id, identifier: raw.reference.identifier || '' } : null,
});

export const toMovementReport = (payload = {}) => {
  const data = payload?.data ?? payload ?? {};
  const overview = data.overview || {};
  const pagination = data.pagination || {};
  return {
    overview: {
      transactions: count(overview.total_transactions),
      unitsIn: count(overview.total_units_in),
      unitsOut: count(overview.total_units_out),
      net: count(overview.net_inventory_change),
      value: count(overview.total_cost_value),
    },
    breakdown: (Array.isArray(data.breakdown_by_type) ? data.breakdown_by_type : []).map((row) => ({
      type: row.type,
      transactions: count(row.total_transactions),
      unitsIn: count(row.units_in),
      unitsOut: count(row.units_out),
      net: count(row.net_change),
    })),
    movements: (Array.isArray(data.movements) ? data.movements : []).map(toMovement),
    pagination: {
      page: count(pagination.current_page) || 1,
      lastPage: count(pagination.last_page) || 1,
      perPage: count(pagination.per_page) || 20,
      total: count(pagination.total),
    },
  };
};

const isDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

/** Query for the movements report; empty filters are left out. Returns null when the date range is reversed. */
export const toMovementQuery = ({ type = '', direction = '', from = '', to = '', productId = '', page = 1, perPage = 20 } = {}) => {
  if (isDay(from) && isDay(to) && from > to) return null;
  const query = { page, per_page: perPage };
  if (MOVEMENT_TYPES.includes(type)) query.type = type;
  if (direction === 'in' || direction === 'out') query.direction = direction;
  if (isDay(from)) query.from_date = from;
  if (isDay(to)) query.to_date = to;
  if (productId) query.product_id = productId;
  return query;
};

const cleanText = (value) => String(value ?? '').trim();

/**
 * Checks the add / remove stock form. `available` is the product's current stock.
 * Errors: quantity required|integer|positive|too_large|exceeds, reason required|too_long, notes too_long.
 */
export const validateAdjustment = ({ mode = 'add', quantity = '', reason = '', notes = '' } = {}, available = 0) => {
  const errors = {};
  const raw = String(quantity ?? '').trim();
  if (!raw) errors.quantity = 'required';
  else if (!/^-?\d+$/.test(raw)) errors.quantity = 'integer';
  else if (Number(raw) <= 0) errors.quantity = 'positive';
  else if (Number(raw) > QUANTITY_MAX) errors.quantity = 'too_large';
  else if (mode === 'remove' && Number(raw) > count(available)) errors.quantity = 'exceeds';
  if (!cleanText(reason)) errors.reason = 'required';
  else if (cleanText(reason).length > REASON_MAX) errors.reason = 'too_long';
  if (cleanText(notes).length > NOTES_MAX) errors.notes = 'too_long';
  return errors;
};

export const toAdjustPayload = ({ mode = 'add', quantity, reason = '', notes = '' } = {}) => {
  const amount = Math.abs(parseInt(quantity, 10));
  const payload = { quantity: mode === 'remove' ? -amount : amount, reason: cleanText(reason) };
  if (cleanText(notes)) payload.notes = cleanText(notes);
  return payload;
};

/** The server's message in the admin's language, or '' when there is nothing useful to show. */
export const adjustErrorText = (error, lang = 'ar') => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const first = data?.errors ? Object.values(data.errors).flat()[0] : '';
  const raw = String(first || data?.message || '');
  const en = lang === 'en';
  const exceeds = raw.match(/Cannot reduce (\d+) units\. Current available stock is only (\d+)/i);
  if (exceeds) return en ? `Cannot remove ${exceeds[1]} units: only ${exceeds[2]} in stock.` : `لا يمكن خصم ${exceeds[1]} قطعة: المتوفر ${exceeds[2]} فقط.`;
  if (/must be an integer/i.test(raw)) return en ? 'The quantity must be a whole number.' : 'الكمية لازم تكون رقم صحيح.';
  if (/selected quantity is invalid/i.test(raw)) return en ? 'The quantity must not be zero.' : 'الكمية لازم تكون أكبر من صفر.';
  if (status === 404) return en ? 'This product no longer exists.' : 'المنتج ده مش موجود.';
  if (status >= 500 || !raw) return '';
  return raw;
};

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
export const toCsv = (header = [], rows = []) => `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}`;

export const dayOf = (value) => String(value || '').slice(0, 10);
export const timeOf = (value) => String(value || '').slice(11, 16);
