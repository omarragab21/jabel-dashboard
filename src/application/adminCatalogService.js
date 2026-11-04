import tijaraAdminApi from '../infrastructure/api/tijaraAdminApi';
import {
  dataFromResponse,
  listFromResponse,
  toAttribute,
  toCategory,
  toDiscountCode,
  toOffer,
  toProduct,
  toPromotion,
} from '../domain/catalog/adminCatalog';
import { couponAnnouncement } from '../domain/notifications/couponNotice';

// Tells everyone (site + dashboard) through Firestore. Loaded on demand and never allowed to break the save.
const announce = async (details) => {
  try {
    const { publishNotification } = await import('../firebase/notificationsStore');
    await publishNotification(details);
  } catch { /* the save already succeeded */ }
};

const MAX_PAGES = 50;

// Laravel paginates these collections (categories: 10/page). Walk every page
// so nothing is hidden from the admin. The admin lists explicitly request all
// statuses; the UI applies the selected status filter after normalization.
const mapList = async (request, mapper, params = {}) => {
  const first = await request({ ...params, page: 1 });
  const items = [...listFromResponse(first.data)];
  const lastPage = Math.min(Number(first.data?.meta?.last_page) || 1, MAX_PAGES);
  for (let page = 2; page <= lastPage; page += 1) {
    const next = await request({ ...params, page });
    items.push(...listFromResponse(next.data));
  }
  return items.map(mapper);
};
const mapData = (request, mapper) => request().then((response) => mapper(dataFromResponse(response.data)));

export const adminCatalogService = {
  listCategories: (params = {}) => mapList(tijaraAdminApi.listCategories, toCategory, params),
  createCategory: (payload, image) => mapData(() => tijaraAdminApi.createCategory(payload, image), toCategory),
  updateCategory: (id, payload, image) => mapData(() => tijaraAdminApi.updateCategory(id, payload, image), toCategory),
  getCategory: (id) => mapData(() => tijaraAdminApi.getCategory(id), toCategory),
  deleteCategory: tijaraAdminApi.deleteCategory,

  listProducts: (params) => tijaraAdminApi.listProducts(params).then((response) => ({
    ...response.data,
    data: listFromResponse(response.data).map(toProduct),
    items: listFromResponse(response.data).map(toProduct),
  })),
  // The categories endpoint does not include products_count. Collect every
  // product page so CategoriesView can calculate authoritative counters.
  listAllProducts: async (params = {}) => {
    const first = await tijaraAdminApi.listProducts({ ...params, page: 1 });
    const items = [...listFromResponse(first.data)];
    const lastPage = Math.min(Number(first.data?.meta?.last_page) || 1, MAX_PAGES);
    for (let page = 2; page <= lastPage; page += 1) {
      const next = await tijaraAdminApi.listProducts({ ...params, page });
      items.push(...listFromResponse(next.data));
    }
    return items.map(toProduct);
  },
  createProduct: async (payload, files) => {
    const product = await mapData(() => tijaraAdminApi.createProduct(payload, files), toProduct);
    if (product?.id && product.is_active !== false) {
      announce({
        type: 'product',
        title: { ar: 'منتج جديد', en: 'New product' },
        body: { ar: product.name_i18n?.ar || product.name, en: product.name_i18n?.en || product.name },
        link: `/product/${encodeURIComponent(product.id)}`,
        adminLink: '/admin/products',
      });
    }
    return product;
  },
  updateProduct: (id, payload, files) => mapData(() => tijaraAdminApi.updateProduct(id, payload, files), toProduct),
  getProduct: (id) => mapData(() => tijaraAdminApi.getProduct(id), toProduct),
  deleteProduct: tijaraAdminApi.deleteProduct,

  listAttributes: () => mapList(tijaraAdminApi.listAttributes, toAttribute),
  createAttribute: (payload) => mapData(() => tijaraAdminApi.createAttribute(payload), toAttribute),
  updateAttribute: (id, payload) => mapData(() => tijaraAdminApi.updateAttribute(id, payload), toAttribute),
  getAttribute: (id) => mapData(() => tijaraAdminApi.getAttribute(id), toAttribute),
  deleteAttribute: tijaraAdminApi.deleteAttribute,
  createAttributeOption: (attributeId, payload) => mapData(() => tijaraAdminApi.createAttributeOption(attributeId, payload), toAttribute),
  updateAttributeOption: (attributeId, optionId, payload) => mapData(() => tijaraAdminApi.updateAttributeOption(attributeId, optionId, payload), toAttribute),
  deleteAttributeOption: tijaraAdminApi.deleteAttributeOption,

  listDiscountCodes: (params = {}) => mapList(tijaraAdminApi.listDiscountCodes, toDiscountCode, params),
  createDiscountCode: async (payload, image) => {
    const code = await mapData(() => tijaraAdminApi.createDiscountCode(payload, image), toDiscountCode);
    // A new, active code is announced to the customers (site bell + toast) with a copy-the-code dialog.
    const notice = payload?.is_active ? couponAnnouncement(payload) : null;
    if (notice) announce(notice);
    return code;
  },
  updateDiscountCode: (id, payload, image) => mapData(() => tijaraAdminApi.updateDiscountCode(id, payload, image), toDiscountCode),
  getDiscountCode: (id) => mapData(() => tijaraAdminApi.getDiscountCode(id), toDiscountCode),
  deleteDiscountCode: tijaraAdminApi.deleteDiscountCode,

  listOffers: (params = {}) => mapList(tijaraAdminApi.listOffers, toOffer, params),
  createOffer: async (payload, image) => {
    const offer = await mapData(() => tijaraAdminApi.createOffer(payload, image), toOffer);
    if (offer?.id && offer.is_active !== false) {
      announce({
        type: 'offer',
        title: { ar: 'عرض جديد', en: 'New offer' },
        body: { ar: offer.name_i18n?.ar || offer.name, en: offer.name_i18n?.en || offer.name },
        link: `/offers?offer=${encodeURIComponent(offer.id)}`,
        adminLink: '/admin/offers',
      });
    }
    return offer;
  },
  updateOffer: (id, payload, image) => mapData(() => tijaraAdminApi.updateOffer(id, payload, image), toOffer),
  getOffer: (id) => mapData(() => tijaraAdminApi.getOffer(id), toOffer),
  // The offers page (إدارة العروض): the API's discounts.
  listPromotions: (params = {}) => mapList(tijaraAdminApi.listDiscounts, toPromotion, params),
  // The list does not carry the chosen products, so the edit form reads the offer itself.
  getPromotion: async (id) => {
    const { data: body } = await tijaraAdminApi.getDiscount(id);
    const raw = body?.discount || body?.data || body || {};
    return toPromotion({ ...raw, products: raw.products ?? body?.products });
  },
  createPromotion: async (payload, image = null) => {
    const { data: body } = await tijaraAdminApi.createDiscount(payload, image);
    const offer = toPromotion(body?.discount || body?.data || body || {});
    // A new, active offer is announced to the customers (site bell + toast).
    if (offer.id && payload.is_active === 'true') {
      announce({
        type: 'offer',
        title: { ar: 'عرض جديد', en: 'New offer' },
        body: { ar: offer.name_i18n.ar || payload.name_ar, en: offer.name_i18n.en || payload.name_en },
        link: `/offers?offer=${encodeURIComponent(offer.id)}`,
        adminLink: '/admin/offers',
      });
    }
    return offer;
  },
  updatePromotion: (id, payload, image = null) => tijaraAdminApi.updateDiscount(id, payload, image),
  togglePromotion: (id) => tijaraAdminApi.toggleDiscountStatus(id),
  deletePromotion: (id) => tijaraAdminApi.deleteDiscount(id),
  // Every order, newest first (the endpoint pages 20 at a time), to count how often the offers were used.
  listOrdersForUsage: async () => {
    const first = await tijaraAdminApi.listOrders({ page: 1 });
    const orders = [...listFromResponse(first.data)];
    const lastPage = Math.min(Number(first.data?.meta?.last_page) || 1, MAX_PAGES);
    for (let page = 2; page <= lastPage; page += 1) {
      orders.push(...listFromResponse((await tijaraAdminApi.listOrders({ page })).data));
    }
    return orders;
  },
  deleteOffer: tijaraAdminApi.deleteOffer,
};

export default adminCatalogService;
