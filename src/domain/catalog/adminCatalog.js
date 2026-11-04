const firstText = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';

// Long-text fields come back as arrays of lines; the form keeps one point per line, so join with
// newlines (String(array) would glue the points together with commas into a single point).
const textValue = (value) => (Array.isArray(value) ? value.map((line) => String(line ?? '').trim()).filter(Boolean).join('\n') : value);
const firstLines = (...values) => firstText(...values.map(textValue));

const localized = (translations, key, fallback = '') => firstText(
  translations?.ar?.[key],
  translations?.en?.[key],
  fallback,
);

// The API returns long-text fields either as arrays of lines or as plain strings.
export const toLines = (value) => (Array.isArray(value) ? value : String(value ?? '').split('\n')).map((line) => String(line));

// A product's `category` is a mapped object after toProduct(); views need a display name.
export const categoryName = (category) => {
  if (!category || typeof category !== 'object') return category;
  // Shown in the dashboard language; the other language only fills in when it is missing.
  const english = typeof localStorage !== 'undefined' && localStorage.getItem('lang') === 'en';
  const ar = [category.name_i18n?.ar, category.translations?.ar?.name, category.name_ar];
  const en = [category.name_i18n?.en, category.translations?.en?.name, category.name_en];
  return firstText(...(english ? [...en, ...ar] : [...ar, ...en]), category.name);
};

// Search the complete bilingual category record, not only the current display
// language. Common Arabic variants should not make a valid search miss.
export const normalizeCatalogSearchText = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLocaleLowerCase('ar')
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
  .replace(/[إأآ]/g, 'ا')
  .replace(/ـ/g, '')
  .trim();

export const categoryMatchesSearch = (category = {}, query = '') => {
  const normalizedQuery = normalizeCatalogSearchText(query);
  if (!normalizedQuery) return true;

  const fields = [
    category.name,
    category.name_i18n?.ar,
    category.name_i18n?.en,
    category.description,
    category.description_i18n?.ar,
    category.description_i18n?.en,
    category.translations?.ar?.name,
    category.translations?.en?.name,
    category.translations?.ar?.description,
    category.translations?.en?.description,
  ];

  return fields.some((field) => normalizeCatalogSearchText(field).includes(normalizedQuery));
};

// The products endpoint can return the relationship as an object, a name, or
// only as category_id. Resolve all of those shapes before the table falls back
// to "غير محدد". `categories` may contain parent categories with `subchildren`.
export const productCategoryName = (product = {}, categories = []) => {
  const directName = categoryName(product.category);
  if (directName !== undefined && directName !== null && String(directName).trim() !== '' && !/^\d+$/.test(String(directName))) {
    return directName;
  }

  const categoryId = product.subcategory_id ?? product.category_id ?? product.category?.id;
  const allCategories = categories.flatMap((category) => [category, ...(category.subchildren || [])]);
  const matched = allCategories.find((category) => Number(category.id) === Number(categoryId));
  return categoryName(matched) || product.category_name || product.subcategory_name || '';
};

const unwrap = (payload) => payload?.data ?? payload;

export const toCategory = (raw = {}) => {
  const item = { ...raw };
  const translations = raw.translations || {};
  const nameAr = firstText(translations.ar?.name, raw.name_ar, raw.name);
  const nameEn = firstText(translations.en?.name, raw.name_en, raw.name);
  const descriptionAr = firstText(translations.ar?.description, raw.description_ar, raw.description);
  const descriptionEn = firstText(translations.en?.description, raw.description_en, raw.description);
  const parent = raw.parent ? toCategory(raw.parent) : null;

  return {
    ...item,
    name: firstText(raw.name, nameAr, nameEn),
    name_i18n: { ar: nameAr, en: nameEn },
    description_i18n: { ar: descriptionAr, en: descriptionEn },
    image: firstText(raw.image_url, raw.image),
    products_count: Number(raw.products_count ?? raw.productsCount ?? 0),
    is_active: raw.is_active !== false && raw.is_active !== 0,
    parent,
    sub_categories: Array.isArray(raw.sub_categories) ? raw.sub_categories.map(toCategory) : [],
  };
};

export const toProduct = (raw = {}) => {
  const translations = raw.translations || {};
  const category = raw.category && typeof raw.category === 'object'
    ? toCategory(raw.category)
    : raw.category;
  const nameAr = firstText(translations.ar?.name, raw.name_ar, raw.name);
  const nameEn = firstText(translations.en?.name, raw.name_en, raw.name);
  const descriptionAr = firstLines(translations.ar?.product_description, translations.en?.product_description, raw.description_ar, raw.description);
  const descriptionEn = firstLines(translations.en?.product_description, raw.description_en, raw.description);
  const featuresAr = firstLines(translations.ar?.key_features, raw.features_ar, raw.features);
  const featuresEn = firstLines(translations.en?.key_features, raw.features_en, raw.features);
  const tipsAr = firstLines(translations.ar?.tips, raw.tips_ar, raw.tips);
  const tipsEn = firstLines(translations.en?.tips, raw.tips_en, raw.tips);
  const shippingAr = firstLines(translations.ar?.shipping_info, raw.shipping_info_ar, raw.shipping_info);
  const shippingEn = firstLines(translations.en?.shipping_info, raw.shipping_info_en, raw.shipping_info);

  return {
    ...raw,
    name: firstText(raw.name, nameAr, nameEn),
    name_i18n: { ar: nameAr, en: nameEn },
    description_i18n: { ar: descriptionAr, en: descriptionEn },
    features_i18n: { ar: featuresAr, en: featuresEn },
    tips_i18n: { ar: tipsAr, en: tipsEn },
    shipping_info_i18n: { ar: shippingAr, en: shippingEn },
    category,
    category_id: raw.subcategory_id ?? raw.category_id ?? category?.id,
    stock: raw.number ?? raw.quantity ?? raw.stock,
    quantity: raw.number ?? raw.quantity ?? raw.stock,
    status: raw.is_active === false || raw.is_active === 0 ? 'inactive' : 'active',
    discount: raw.discount_percentage ?? raw.discount ?? 0,
    images: Array.isArray(raw.images)
      ? raw.images.map((image) => typeof image === 'string' ? image : (image.image_url || image.url || image.image)).filter(Boolean)
      : [],
  };
};

export const toAttribute = (raw = {}) => {
  const translations = raw.translations || {};
  const name = firstText(raw.name, translations.en?.name, translations.ar?.name);
  const label = firstText(raw.label, translations.ar?.name, translations.en?.name, name);
  // An explicit backend type always wins; the name heuristic only applies to legacy payloads without a type.
  const isColor = raw.type === 'color' || raw.type === 'color_swatch'
    || (!raw.type && /color|لون|ألوان|الوان/i.test(`${name} ${label}`));
  const options = Array.isArray(raw.options)
    ? raw.options
    : (Array.isArray(raw.values) ? raw.values : (Array.isArray(raw.values_list) ? raw.values_list : []));

  return {
    ...raw,
    name,
    label,
    type: isColor ? 'color' : (raw.type || 'select'),
    is_active: raw.is_active !== false && raw.is_active !== 0,
    values: options.map((option, index) => {
      const optionTranslations = option?.translations || {};
      const optionParts = typeof option === 'string' ? option.split('|') : [];
      const nameAr = typeof option === 'string'
        ? optionParts[0]?.trim()
        : firstText(
          option.name_ar,
          optionTranslations.ar?.name,
          optionTranslations.ar?.label,
          option.label_ar,
          option.name,
          option.label,
        );
      const nameEn = typeof option === 'string'
        ? optionParts[0]?.trim()
        : firstText(
          option.name_en,
          optionTranslations.en?.name,
          optionTranslations.en?.label,
          option.label_en,
          option.name,
          option.label,
        );
      const optionName = firstText(nameAr, nameEn);
      const valueCode = typeof option === 'string' ? optionParts[1] : option?.value_code;
      return {
        ...(typeof option === 'object' ? option : {}),
        id: option?.id ?? `${optionName}-${index}`,
        name_ar: nameAr,
        name_en: nameEn,
        label: optionName,
        name: optionName,
        color: valueCode || option?.color || option?.hex || null,
        is_active: option?.is_active !== false && option?.is_active !== 0,
      };
    }).filter((option) => option.label),
  };
};

// A code/offer whose max_uses is used up is no longer valid on the store,
// so the Admin must not keep showing it as active.
const isUsageExhausted = (raw) => {
  const maxUses = Number(raw.max_uses);
  if (raw.max_uses == null || raw.max_uses === '' || !Number.isFinite(maxUses) || maxUses <= 0) return false;
  return Number(raw.used_count ?? raw.total_uses ?? 0) >= maxUses;
};

const statusForPromotion = (raw) => {
  if (raw.is_active === false || raw.is_active === 0) return 'paused';
  const now = Date.now();
  const start = raw.start_date ? Date.parse(raw.start_date) : NaN;
  const end = raw.end_date ? Date.parse(raw.end_date) : NaN;
  if (Number.isFinite(start) && now < start) return 'scheduled';
  if (Number.isFinite(end) && now > end) return 'expired';
  if (isUsageExhausted(raw)) return 'expired';
  // The backend's own validity flag wins over the dates above.
  if (raw.is_valid_now === false || raw.is_valid === false) return 'expired';
  return 'active';
};

export const toDiscountCode = (raw = {}) => {
  const translations = raw.translations || {};
  return {
    ...raw,
    name_i18n: {
      ar: firstText(translations.ar?.name, raw.name_ar, raw.name),
      en: firstText(translations.en?.name, raw.name_en, raw.name),
    },
    description_i18n: {
      ar: firstText(translations.ar?.description, raw.description_ar, raw.description),
      en: firstText(translations.en?.description, raw.description_en, raw.description),
    },
    status: statusForPromotion(raw),
    total_uses: Number(raw.total_uses ?? raw.used_count ?? 0),
    max_uses: raw.max_uses ?? null,
    usage_percentage: Number(raw.usage_percentage ?? (raw.max_uses ? Math.min(100, (Number(raw.used_count ?? 0) / Number(raw.max_uses)) * 100) : 0)),
    is_active: raw.is_active !== false && raw.is_active !== 0,
    selected_categories: raw.selected_categories || [],
    selected_products: raw.selected_products || [],
  };
};

export const toOffer = (raw = {}) => {
  const translations = raw.translations || {};
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    ...raw,
    name_i18n: {
      ar: firstText(translations.ar?.name, raw.name_ar, raw.name),
      en: firstText(translations.en?.name, raw.name_en, raw.name),
    },
    description_i18n: {
      ar: firstText(translations.ar?.description, raw.description_ar, raw.description),
      en: firstText(translations.en?.description, raw.description_en, raw.description),
    },
    items: items.map((item) => ({
      ...item,
      product_id: item.product_id ?? item.product?.id,
      quantity: Number(item.quantity) || 1,
    })),
    status: statusForPromotion(raw),
    total_uses: Number(raw.total_uses ?? raw.used_count ?? 0),
    is_active: raw.is_active !== false && raw.is_active !== 0,
  };
};

export const listFromResponse = (payload) => {
  const body = unwrap(payload);
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
};

export const dataFromResponse = (payload) => unwrap(payload);

export const toCategoryPayload = (form) => ({
  name_en: String(form.name_en || '').trim(),
  name_ar: String(form.name_ar || '').trim(),
  description_en: String(form.description_en || '').trim(),
  description_ar: String(form.description_ar || '').trim(),
  parent_id: form.parent_id || undefined,
  is_active: form.is_active === false ? 0 : 1,
  sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
});

export const PRODUCT_IMAGE_REQUIRED_MESSAGE = 'أضف صورة واحدة على الأقل للمنتج';

// A new product must have at least one image. Images already saved on the product (edit) and
// freshly staged uploads (add / duplicate) both count. Returns an error message, or '' when fine.
export const validateProductImages = (form = {}, { isEdit = false } = {}) => {
  if (isEdit) return '';
  const staged = Array.isArray(form.new_images) ? form.new_images.filter(Boolean).length : 0;
  const saved = Array.isArray(form.existing_images) ? form.existing_images.filter(Boolean).length : 0;
  return staged + saved > 0 ? '' : PRODUCT_IMAGE_REQUIRED_MESSAGE;
};

export const toProductPayload = (form) => ({
  name_en: String(form.name_en || '').trim(),
  name_ar: String(form.name_ar || '').trim(),
  category_id: form.subcategory_id || form.category_id || '',
  price: form.price,
  number: form.quantity,
  is_active: form.is_active === false ? 0 : 1,
  // Products carry no discount of their own any more: discounts come from bundles (الباقات). Always sent
  // blank, which clears any discount a product still has.
  discount_percentage: '',
  product_description_en: String(form.description_en || '').split('\n').filter(Boolean),
  product_description_ar: String(form.description_ar || '').split('\n').filter(Boolean),
  key_features_en: String(form.features_en || '').split('\n').filter(Boolean),
  key_features_ar: String(form.features_ar || '').split('\n').filter(Boolean),
  tips_en: String(form.tips_en || '').split('\n').filter(Boolean),
  tips_ar: String(form.tips_ar || '').split('\n').filter(Boolean),
  shipping_info_en: String(form.shipping_info_en || '').split('\n').filter(Boolean),
  shipping_info_ar: String(form.shipping_info_ar || '').split('\n').filter(Boolean),
});

// Blank / missing optional numbers must reach the API as null, never NaN.
const optionalNumber = (value) => (value === '' || value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value));

export const toDiscountPayload = (form) => ({
  code: String(form.code || '').trim(),
  type: form.type || 'percentage',
  value: Number(form.value || 0),
  minimum_amount: optionalNumber(form.min_order_value ?? form.minimum_amount),
  // The cap only applies to percentage codes; a value left over after switching
  // the type to fixed would otherwise cap the fixed discount on the store.
  max_discount: (form.type || 'percentage') === 'percentage' ? optionalNumber(form.max_discount) : null,
  max_uses: optionalNumber(form.max_uses),
  start_date: form.start_date ? `${form.start_date} 00:00:00` : null,
  end_date: form.no_end_date || !form.end_date ? null : `${form.end_date} 23:59:59`,
  is_active: Boolean(form.is_active),
  is_public: true,
  name_en: String(form.name_en || '').trim(),
  name_ar: String(form.name_ar || '').trim(),
  description_en: String(form.description_en || '').trim(),
  description_ar: String(form.description_ar || '').trim(),
});

// ---- Bundles (الباقات): priced either by a fixed percentage off the products, or by a fixed price.
// The API only stores `bundle_price`, so a percentage bundle is saved as the price it works out to and
// read back as a percentage when that price is a whole-number percentage off the products' list prices.
const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const bundleOriginalTotal = (items = [], products = []) => roundMoney((items || []).reduce((sum, item) => {
  const product = (products || []).find((p) => String(p.id) === String(item.product_id));
  return sum + (Number(product?.price) || 0) * Math.max(1, Number(item.quantity) || 1);
}, 0));

export const bundlePriceFromPercent = (original, percent) => {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  return roundMoney(Number(original) * (1 - pct / 100));
};

export const bundlePercentFromPrice = (original, price) => {
  const total = Number(original) || 0;
  if (total <= 0) return 0;
  return Math.round((1 - (Number(price) || 0) / total) * 10000) / 100;
};

// 'percent' when the stored price is a whole-number percentage off the list prices, otherwise 'fixed'.
export const bundlePricingMode = (original, price) => {
  const pct = bundlePercentFromPrice(original, price);
  return pct > 0 && pct < 100 && Math.abs(pct - Math.round(pct)) < 0.011 ? 'percent' : 'fixed';
};

export const toOfferPayload = (form) => {
  const items = Array.isArray(form.items)
    ? form.items
    : (Array.isArray(form.selected_products)
      ? form.selected_products.map((product_id) => ({ product_id, quantity: 1 }))
      : []);
  const payload = {
    name_en: String(form.name_en || '').trim(),
    name_ar: String(form.name_ar || '').trim(),
    description_en: String(form.description_en || '').trim(),
    description_ar: String(form.description_ar || '').trim(),
    bundle_price: Number(form.bundle_price || 0),
    start_date: form.start_date ? `${form.start_date} 00:00:00` : null,
    end_date: form.no_end_date || !form.end_date ? null : `${form.end_date} 23:59:59`,
    max_uses: optionalNumber(form.max_uses),
    max_per_customer: optionalNumber(form.max_per_customer),
    // Multipart form values are serialized as strings. Tijara's offer
    // validator accepts the numeric boolean contract (`1`/`0`).
    is_active: form.is_active ? 1 : 0,
  };
  items.slice(0, 20).forEach((item, index) => {
    if (item?.product_id === undefined || item?.product_id === null || item?.product_id === '') return;
    payload[`items[${index}][product_id]`] = item.product_id;
    payload[`items[${index}][quantity]`] = Math.max(1, Number(item.quantity) || 1);
  });
  return payload;
};

// ---- Offers (العروض): a percentage or a fixed amount off, on every product or on chosen products, for a period.
// The offers endpoint also carries the bundles (الباقات): those have product lines and a bundle price.
export const isBundleOffer = (raw = {}) => raw.type === 'bundle'
  || (Array.isArray(raw.items) && raw.items.length > 0 && Number(raw.bundle_price) > 0)
  || Number(raw.bundle_price) > 0;

// ---- Offers (إدارة العروض) = the API's /discounts: a percentage or fixed amount off chosen products, between two dates.
const idsOf = (value) => {
  const list = Array.isArray(value) ? value : (Array.isArray(value?.data) ? value.data : []);
  return list.map((item) => (item !== null && typeof item === 'object' ? item.id ?? item.product_id : item))
    .filter((id) => id !== undefined && id !== null && id !== '');
};

/** An offer (discount) as the page shows it: names, type, value, products and status. */
export const toPromotion = (raw = {}) => {
  const translations = raw.translations || {};
  const selected = [...new Set([...idsOf(raw.products), ...idsOf(raw.product_ids), ...idsOf(raw.selected_products)].map(String))];
  const value = Number(raw.discount ?? raw.value);
  return {
    ...raw,
    id: raw.id,
    name_i18n: {
      ar: firstText(translations.ar?.name, raw.name_ar, raw.name),
      en: firstText(translations.en?.name, raw.name_en, raw.name),
    },
    image: firstText(raw.image_url, raw.image),
    type: raw.discount_type === 'fixed' ? 'fixed' : 'percentage',
    value: Number.isFinite(value) ? value : 0,
    is_active: raw.is_active !== false && raw.is_active !== 0 && raw.is_active !== '0' && raw.is_active !== 'false',
    status: statusForPromotion(raw),
    selected_products: selected,
    // List price of each product of the offer (what an order line is compared with to tell it used the offer).
    product_prices: Object.fromEntries((Array.isArray(raw.products) ? raw.products : (raw.products?.data || []))
      .filter((product) => product && product.id !== undefined && Number(product.price) > 0)
      .map((product) => [String(product.id), Number(product.price)])),
    products_count: Number(raw.products_count ?? selected.length) || 0,
  };
};

const DAY_MS = 86400000;

/**
 * How much an offer was used. The discounts API keeps no counter, so it is worked out from the orders: an order
 * used the offer when it was placed while the offer ran, was not cancelled, and has a line for one of the offer's
 * products charged below that product's list price.
 * Returns { orders, units, customers } (customers = different people who ordered).
 */
export const offerUsage = (offer = {}, orders = []) => {
  const prices = offer.product_prices || {};
  const start = Date.parse(offer.start_date);
  const end = Date.parse(offer.end_date);
  const customers = new Set();
  let used = 0;
  let units = 0;
  (Array.isArray(orders) ? orders : []).forEach((order) => {
    if (!order || String(order.status || '').toLowerCase() === 'cancelled') return;
    const placed = Date.parse(order.created_at);
    if (Number.isFinite(start) && Number.isFinite(placed) && placed < start) return;
    // The end date is a whole day: orders placed on it still count.
    if (Number.isFinite(end) && Number.isFinite(placed) && placed >= end + DAY_MS) return;
    const lines = (order.items || []).filter((line) => {
      const list = prices[String(line.product_id)];
      return list !== undefined && Number(line.unit_price) < list;
    });
    if (!lines.length) return;
    used += 1;
    units += lines.reduce((sum, line) => sum + (Number(line.quantity) || 1), 0);
    customers.add(String(order.user?.id ?? order.user_id ?? order.id));
  });
  return { orders: used, units, customers: customers.size };
};

export const promotionDiscountLabel = (offer, currency = 'JOD') => (offer.type === 'fixed'
  ? `${Number(offer.value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
  : `${Number(offer.value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`);

/** What is wrong with the form, by field. An empty object means it can be saved. */
export const validatePromotionForm = (form = {}) => {
  const errors = {};
  if (!String(form.name_ar ?? '').trim()) errors.name_ar = 'required';
  if (!String(form.name_en ?? '').trim()) errors.name_en = 'required';
  const type = form.type === 'fixed' ? 'fixed' : 'percentage';
  const value = Number(form.value);
  if (form.value === '' || form.value === null || form.value === undefined || !Number.isFinite(value) || value <= 0) errors.value = 'required';
  else if (type === 'percentage' && value > 100) errors.value = 'too_high';
  if (form.applies_to === 'products' && !(form.selected_products || []).length) errors.selected_products = 'required';
  if (!form.start_date) errors.start_date = 'required';
  if (!form.end_date) errors.end_date = 'required';
  else if (form.start_date && form.end_date < form.start_date) errors.end_date = 'before_start';
  return errors;
};

// The API reads dates as DD-MM-YYYY; the form holds YYYY-MM-DD.
const apiDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

/**
 * The request body (multipart) for creating or updating an offer. The API only knows chosen products, so
 * "all products" sends every product of the catalog (`allProductIds`) as they are now.
 */
export const toPromotionPayload = (form, allProductIds = []) => {
  const ids = form.applies_to === 'products' ? form.selected_products || [] : allProductIds;
  return {
    name_en: String(form.name_en || '').trim(),
    name_ar: String(form.name_ar || '').trim(),
    discount: Number(form.value || 0),
    discount_type: form.type === 'fixed' ? 'fixed' : 'percentage',
    is_active: form.is_active ? 'true' : 'false',
    start_date: apiDate(form.start_date),
    end_date: apiDate(form.end_date),
    product_ids: [...new Set(ids.map(String))],
  };
};

/** The edit form for a saved offer. `allProductIds` tells whether it covers the whole catalog. */
export const promotionFormFrom = (offer, allProductIds = []) => {
  const selected = [...(offer.selected_products || [])];
  const everything = allProductIds.length > 0 && allProductIds.every((id) => selected.some((picked) => String(picked) === String(id)));
  return {
    name_ar: offer.name_i18n?.ar || offer.name_ar || offer.name || '',
    name_en: offer.name_i18n?.en || offer.name_en || offer.name || '',
    type: offer.type === 'fixed' ? 'fixed' : 'percentage',
    value: offer.value,
    applies_to: everything ? 'all' : 'products',
    selected_products: selected,
    start_date: offer.start_date ? String(offer.start_date).slice(0, 10) : '',
    end_date: offer.end_date ? String(offer.end_date).slice(0, 10) : '',
    is_active: offer.is_active !== false,
  };
};

export const toAttributePayload = (form) => {
  const payload = {
    // Tijara accepts only `color_swatch` and `select`. The Admin UI calls the
    // latter "نص" for a non-colour product property, so translate it here.
    type: form.type === 'color' ? 'color_swatch' : 'select',
    name_en: String(form.name_en || '').trim(),
    name_ar: String(form.name_ar || '').trim(),
  };
  // Values are managed separately from the attribute. Keep the legacy bulk
  // parser for callers that still provide values_list, but never send an
  // unrelated empty options array for the new attribute form.
  if (Object.prototype.hasOwnProperty.call(form, 'values_list')) {
    payload.options = String(form.values_list || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const [name, valueCode] = value.split('|', 2);
        return { name_en: name.trim(), name_ar: name.trim(), value_code: valueCode?.trim() || null };
      });
  }
  return payload;
};

// Editing an attribute renames it / changes its type; its options are managed separately (never replaced here).
export const toAttributeUpdatePayload = (form) => {
  const { options, ...rest } = toAttributePayload(form);
  return rest;
};

// An option is a colour when its value is a colour code: #rgb, #rrggbb, rgb(r, g, b), rgba(...) or a bare "r, g, b".
// The result is always a #rrggbb hex (what the storefront draws); '' when the value is not a colour.
const channel = (text) => {
  const percent = String(text).trim().endsWith('%');
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number)) return null;
  const value = percent ? Math.round((number / 100) * 255) : Math.round(number);
  return value >= 0 && value <= 255 ? value : null;
};
export const parseColorCode = (value) => {
  const text = String(value ?? '').trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1].slice(0, 6);
    return `#${digits.toLowerCase()}`;
  }
  // rgb(...) / rgba(...) may use commas or spaces; a bare triplet must use commas ("102, 0, 51").
  const rgb = text.match(/^rgba?\(\s*(-?[\d.]+%?)\s*[, ]\s*(-?[\d.]+%?)\s*[, ]\s*(-?[\d.]+%?)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i)
    || text.match(/^(-?[\d.]+%?)\s*,\s*(-?[\d.]+%?)\s*,\s*(-?[\d.]+%?)$/);
  if (!rgb) return '';
  const channels = rgb.slice(1, 4).map(channel);
  return channels.every((item) => item !== null)
    ? `#${channels.map((item) => item.toString(16).padStart(2, '0')).join('')}`
    : '';
};

export const toAttributeOptionPayload = (form) => {
  const raw = String(form.color ?? form.value_code ?? '').trim();
  return {
    name_en: String(form.name_en ?? form.label ?? '').trim(),
    name_ar: String(form.name_ar ?? form.label ?? '').trim(),
    // A colour written as rgb(...) is saved as hex; a hex code and any other value are kept as typed.
    value_code: (/^#[0-9a-f]{3,8}$/i.test(raw) ? raw : parseColorCode(raw)) || raw || null,
  };
};

const attributeNames = (attribute) => [attribute?.name, attribute?.label, attribute?.name_en, attribute?.name_ar]
  .map((value) => String(value ?? '').trim().toLowerCase()).filter(Boolean);
const matchesName = (attribute, names) => attributeNames(attribute).some((name) => names.includes(name));

// The three core, selectable attributes of a product (color, capacity, size), always in this order,
// and every other attribute after them.
export const splitCoreAttributes = (attributes = []) => {
  const list = Array.isArray(attributes) ? attributes : [];
  const kinds = [
    ['color', (attribute) => attribute.type === 'color_swatch' || attributeNames(attribute).some((name) => name === 'color' || name === 'اللون')],
    ['capacity', (attribute) => matchesName(attribute, ['capacity', 'rated capacity', 'السعة'])],
    ['size', (attribute) => matchesName(attribute, ['size', 'الحجم', 'المقاس'])],
  ];
  const taken = new Set();
  const core = [];
  for (const [kind, test] of kinds) {
    const attribute = list.find((item) => !taken.has(item) && test(item));
    if (attribute) { taken.add(attribute); core.push({ kind, attribute }); }
  }
  return { core, others: list.filter((item) => !taken.has(item)) };
};
