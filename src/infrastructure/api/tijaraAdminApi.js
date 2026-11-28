import api from '../../config/axios';
import { encodePathSegment } from '../../utils/adminSecurity';

// An emptied point list must reach the API as a blank value: an empty array sends nothing, so the old
// points would stay on the product (the API clears a field only when it receives it blank). The product
// discount is cleared the same way.
const CLEARABLE_POINT_FIELDS = ['product_description', 'key_features', 'tips', 'shipping_info'].flatMap((field) => [`${field}_en`, `${field}_ar`]);
const CLEARABLE_FIELDS = [...CLEARABLE_POINT_FIELDS, 'discount_percentage', 'button_text_en', 'button_text_ar'];
const withClearedPoints = (payload) => {
  const next = { ...payload };
  CLEARABLE_POINT_FIELDS.forEach((key) => {
    if (Array.isArray(next[key]) && next[key].length === 0) next[key] = '';
  });
  return next;
};

// Arrays become key[0], key[1] ... and plain objects key[name] (nested as deep as needed), which PHP/Laravel reads back
// as the same arrays: { permissions: { orders: ['read'] } } -> permissions[orders][0]=read.
const appendField = (body, key, value) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) value.forEach((item, index) => appendField(body, `${key}[${index}]`, item));
  else if (typeof value === 'object' && !(typeof Blob !== 'undefined' && value instanceof Blob)) Object.entries(value).forEach(([name, item]) => appendField(body, `${key}[${name}]`, item));
  else body.append(key, value);
};

const multipart = (payload, files = {}) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '' && !CLEARABLE_FIELDS.includes(key)) return;
    appendField(body, key, value);
  });
  Object.entries(files).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((file) => body.append(`${key}[]`, file));
    else if (value) body.append(key, value);
  });
  return body;
};

// Multipart values are strings: booleans go as 1/0 and nulls as '' (Laravel turns
// empty strings into null), so clearing a field such as end_date still works.
const discountForm = (payload, image) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (typeof value === 'boolean') body.append(key, value ? '1' : '0');
    else body.append(key, value === null ? '' : value);
  });
  body.append('image_file', image);
  return body;
};

// Variant forms: booleans go as 1/0, arrays as key[0], key[1]..., and the pictures as images[].
export const variantForm = (payload, files = []) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') body.append(key, value ? '1' : '0');
    else appendField(body, key, value);
  });
  files.forEach((file) => body.append('images[]', file));
  return body;
};

const json = { headers: { 'Content-Type': 'application/json' } };
const formHeaders = { headers: { 'Content-Type': 'multipart/form-data' } };

export const tijaraAdminApi = {
  listUsers: (params = {}) => api.get('/v1/dashboard/users', { params }),
  createUser: (payload, image) => api.post('/v1/dashboard/users', multipart(payload, { image_file: image }), formHeaders),
  updateUser: (id, payload, image) => api.put(`/v1/dashboard/users/${encodePathSegment(id, 'user id')}`, multipart(payload, { image_file: image }), formHeaders),
  getUser: (id) => api.get(`/v1/dashboard/users/${encodePathSegment(id, 'user id')}`),
  deleteUser: (id) => api.delete(`/v1/dashboard/users/${encodePathSegment(id, 'user id')}`),
  getProfile: () => api.get('/v1/dashboard/profile'),
  updateProfile: (payload) => api.post('/v1/dashboard/profile', payload, json),
  changePassword: (payload) => api.put('/v1/dashboard/profile/password', payload, json),

  listCategories: (params = {}) => api.get('/v1/dashboard/categories', { params }),
  createCategory: (payload, image) => api.post('/v1/dashboard/categories', multipart(payload, { image_file: image }), formHeaders),
  // Multipart goes as POST with Laravel's `_method=PUT` override (PHP does not parse multipart on a real PUT).
  updateCategory: (id, payload, image) => api.post(`/v1/dashboard/categories/${encodePathSegment(id, 'category id')}`, multipart({ ...payload, _method: 'PUT' }, { image_file: image }), formHeaders),
  getCategory: (id) => api.get(`/v1/dashboard/categories/${encodePathSegment(id, 'category id')}`),
  deleteCategory: (id) => api.delete(`/v1/dashboard/categories/${encodePathSegment(id, 'category id')}`),
  // One request for many categories: action = delete | activate | deactivate | toggle_status | reorder | change_parent
  // (change_parent takes inputs.parent_id, null makes them main categories).
  bulkCategoryAction: (action, targetIds, inputs = null) => api.post('/v1/dashboard/categories/actions', { action, target_ids: targetIds, ...(inputs ? { inputs } : {}) }),

  listProducts: (params = {}) => api.get('/v1/dashboard/products', { params }),
  createProduct: (payload, files = []) => api.post('/v1/dashboard/products', multipart(payload, { images: files }), formHeaders),
  updateProduct: (id, payload, files = []) => api.put(`/v1/dashboard/products/${encodePathSegment(id, 'product id')}`, multipart(withClearedPoints(payload), { images: files }), formHeaders),
  getProduct: (id) => api.get(`/v1/dashboard/products/${encodePathSegment(id, 'product id')}`),
  deleteProduct: (id) => api.delete(`/v1/dashboard/products/${encodePathSegment(id, 'product id')}`),
  // One request for many products: action = delete | activate | deactivate | toggle_status | feature | unfeature | change_category
  // (change_category needs inputs.category_id).
  bulkProductAction: (action, targetIds, inputs = null) => api.post('/v1/dashboard/products/actions', { action, target_ids: targetIds, ...(inputs ? { inputs } : {}) }),
  // A product has one or more variants (SKUs). The product's own id is its main variant; each variant has its own
  // price, stock, options (option_ids) and pictures. PHP does not read a multipart PUT body, so an update is a POST
  // with Laravel's `_method=PUT` override.
  listVariants: (productId) => api.get(`/v1/dashboard/products/${encodePathSegment(productId, 'product id')}/variants`),
  getVariant: (productId, variantId) => api.get(`/v1/dashboard/products/${encodePathSegment(productId, 'product id')}/variants/${encodePathSegment(variantId, 'variant id')}`),
  createVariant: (productId, payload, files = []) => api.post(`/v1/dashboard/products/${encodePathSegment(productId, 'product id')}/variants`, variantForm(payload, files), formHeaders),
  updateVariant: (productId, variantId, payload, files = []) => api.post(`/v1/dashboard/products/${encodePathSegment(productId, 'product id')}/variants/${encodePathSegment(variantId, 'variant id')}`, variantForm({ ...payload, _method: 'PUT' }, files), formHeaders),
  deleteVariant: (productId, variantId) => api.delete(`/v1/dashboard/products/${encodePathSegment(productId, 'product id')}/variants/${encodePathSegment(variantId, 'variant id')}`),
  adjustStock: (id, payload) => api.post(`/v1/dashboard/products/${encodePathSegment(id, 'product id')}/adjust-stock`, multipart(payload), formHeaders),
  listStockMovements: (params = {}) => api.get('/v1/dashboard/reports/movements', { params }),
  productStockMovements: (id, params = {}) => api.get(`/v1/dashboard/reports/movements/product/${encodePathSegment(id, 'product id')}`, { params }),

  listAttributes: (params = {}) => api.get('/v1/dashboard/attributes', { params }),
  createAttribute: (payload) => api.post('/v1/dashboard/attributes', payload, json),
  updateAttribute: (id, payload) => api.put(`/v1/dashboard/attributes/${encodePathSegment(id, 'attribute id')}`, payload, json),
  getAttribute: (id) => api.get(`/v1/dashboard/attributes/${encodePathSegment(id, 'attribute id')}`),
  deleteAttribute: (id) => api.delete(`/v1/dashboard/attributes/${encodePathSegment(id, 'attribute id')}`),
  createAttributeOption: (attributeId, payload) => api.post(`/v1/dashboard/attributes/${encodePathSegment(attributeId, 'attribute id')}/options`, payload, json),
  updateAttributeOption: (attributeId, optionId, payload) => api.put(`/v1/dashboard/attributes/${encodePathSegment(attributeId, 'attribute id')}/options/${encodePathSegment(optionId, 'option id')}`, payload, json),
  deleteAttributeOption: (attributeId, optionId) => api.delete(`/v1/dashboard/attributes/${encodePathSegment(attributeId, 'attribute id')}/options/${encodePathSegment(optionId, 'option id')}`),

  listDiscountCodes: (params = {}) => api.get('/v1/dashboard/discount-codes', { params }),
  // JSON unless an image is attached; then multipart with the image as `image_file`.
  createDiscountCode: (payload, image) => (image
    ? api.post('/v1/dashboard/discount-codes', discountForm(payload, image), formHeaders)
    : api.post('/v1/dashboard/discount-codes', payload, json)),
  // PHP does not parse multipart PUT bodies, so an image update is a POST with
  // Laravel's `_method=PUT` override.
  updateDiscountCode: (id, payload, image) => (image
    ? api.post(`/v1/dashboard/discount-codes/${encodePathSegment(id, 'discount code id')}`, discountForm({ ...payload, _method: 'PUT' }, image), formHeaders)
    : api.put(`/v1/dashboard/discount-codes/${encodePathSegment(id, 'discount code id')}`, payload, json)),
  getDiscountCode: (id) => api.get(`/v1/dashboard/discount-codes/${encodePathSegment(id, 'discount code id')}`),
  deleteDiscountCode: (id) => api.delete(`/v1/dashboard/discount-codes/${encodePathSegment(id, 'discount code id')}`),

  // Offers (إدارة العروض) are the API's discounts. PHP does not read a multipart PUT body, so an update is a
  // POST with Laravel's `_method=PUT` override.
  listDiscounts: (params = {}) => api.get('/v1/dashboard/discounts', { params }),
  getDiscount: (id) => api.get(`/v1/dashboard/discounts/${encodePathSegment(id, 'discount id')}`),
  createDiscount: (payload, image) => api.post('/v1/dashboard/discounts', multipart(payload, { image_file: image }), formHeaders),
  updateDiscount: (id, payload, image) => api.post(`/v1/dashboard/discounts/${encodePathSegment(id, 'discount id')}`, multipart({ ...payload, _method: 'PUT' }, { image_file: image }), formHeaders),
  toggleDiscountStatus: (id) => api.patch(`/v1/dashboard/discounts/${encodePathSegment(id, 'discount id')}/toggle-status`),
  deleteDiscount: (id) => api.delete(`/v1/dashboard/discounts/${encodePathSegment(id, 'discount id')}`),

  listOffers: (params = {}) => api.get('/v1/dashboard/offers', { params }),
  createOffer: (payload, image) => api.post('/v1/dashboard/offers', multipart(payload, { image_file: image }), formHeaders),
  updateOffer: (id, payload, image) => api.put(`/v1/dashboard/offers/${encodePathSegment(id, 'offer id')}`, multipart(payload, { image_file: image }), formHeaders),
  getOffer: (id) => api.get(`/v1/dashboard/offers/${encodePathSegment(id, 'offer id')}`),
  deleteOffer: (id) => api.delete(`/v1/dashboard/offers/${encodePathSegment(id, 'offer id')}`),

  listReviews: (params = {}) => api.get('/v1/dashboard/reviews', { params }),
  updateReview: (id, payload) => api.patch(`/v1/dashboard/reviews/${encodePathSegment(id, 'review id')}`, payload, json),
  deleteReview: (id) => api.delete(`/v1/dashboard/reviews/${encodePathSegment(id, 'review id')}`),

  listContacts: (params = {}) => api.get('/v1/dashboard/contacts', { params }),
  getContact: (id) => api.get(`/v1/dashboard/contacts/${encodePathSegment(id, 'contact id')}`),
  deleteContact: (id) => api.delete(`/v1/dashboard/contacts/${encodePathSegment(id, 'contact id')}`),
  markContactSeen: (id) => api.patch(`/v1/dashboard/contacts/${encodePathSegment(id, 'contact id')}/seen`),

  // Locations (JSON bodies). `lang` in a branch is its longitude.
  listCities: (params = {}) => api.get('/v1/dashboard/cities', { params }),
  getCity: (id) => api.get(`/v1/dashboard/cities/${encodePathSegment(id, 'city id')}`),
  createCity: (payload) => api.post('/v1/dashboard/cities', payload),
  updateCity: (id, payload) => api.put(`/v1/dashboard/cities/${encodePathSegment(id, 'city id')}`, payload),
  deleteCity: (id) => api.delete(`/v1/dashboard/cities/${encodePathSegment(id, 'city id')}`),
  toggleCityStatus: (id) => api.patch(`/v1/dashboard/cities/${encodePathSegment(id, 'city id')}/toggle-status`),
  listAreas: (params = {}) => api.get('/v1/dashboard/areas', { params }),
  getArea: (id) => api.get(`/v1/dashboard/areas/${encodePathSegment(id, 'area id')}`),
  createArea: (payload) => api.post('/v1/dashboard/areas', payload),
  updateArea: (id, payload) => api.put(`/v1/dashboard/areas/${encodePathSegment(id, 'area id')}`, payload),
  deleteArea: (id) => api.delete(`/v1/dashboard/areas/${encodePathSegment(id, 'area id')}`),
  toggleAreaStatus: (id) => api.patch(`/v1/dashboard/areas/${encodePathSegment(id, 'area id')}/toggle-status`),
  listBranches: (params = {}) => api.get('/v1/dashboard/branches', { params }),
  getBranch: (id) => api.get(`/v1/dashboard/branches/${encodePathSegment(id, 'branch id')}`),
  createBranch: (payload) => api.post('/v1/dashboard/branches', payload),
  updateBranch: (id, payload) => api.put(`/v1/dashboard/branches/${encodePathSegment(id, 'branch id')}`, payload),
  deleteBranch: (id) => api.delete(`/v1/dashboard/branches/${encodePathSegment(id, 'branch id')}`),
  toggleBranchStatus: (id) => api.patch(`/v1/dashboard/branches/${encodePathSegment(id, 'branch id')}/toggle-status`),

  listSliders: (params = {}) => api.get('/v1/dashboard/sliders', { params }),
  createSlider: (payload, image) => api.post('/v1/dashboard/sliders', multipart(payload, { image_file: image }), formHeaders),
  updateSlider: (id, payload, image) => api.put(`/v1/dashboard/sliders/${encodePathSegment(id, 'slider id')}`, multipart(payload, { image_file: image }), formHeaders),
  getSlider: (id) => api.get(`/v1/dashboard/sliders/${encodePathSegment(id, 'slider id')}`),
  deleteSlider: (id) => api.delete(`/v1/dashboard/sliders/${encodePathSegment(id, 'slider id')}`),

  listOrders: (params = {}) => api.get('/v1/dashboard/orders', { params }),
  getOrder: (id) => api.get(`/v1/dashboard/orders/${encodePathSegment(id, 'order id')}`),
  updateOrder: (id, payload) => api.patch(`/v1/dashboard/orders/${encodePathSegment(id, 'order id')}`, payload, json),

  // Discount products: add or remove some products without resending the whole list.
  attachDiscountProducts: (id, productIds) => api.post(`/v1/dashboard/discounts/${encodePathSegment(id, 'discount id')}/products/attach`, { product_ids: productIds }, json),
  detachDiscountProducts: (id, productIds) => api.post(`/v1/dashboard/discounts/${encodePathSegment(id, 'discount id')}/products/detach`, { product_ids: productIds }, json),

  // One setting row switched on / off.
  toggleSetting: (id) => api.patch(`/v1/dashboard/settings/${encodePathSegment(id, 'setting id')}/toggle`),

  // Site images (the pictures the settings pages upload): list, view, edit, delete.
  listSiteImages: (params = {}) => api.get('/v1/dashboard/site-images', { params }),
  getSiteImage: (id) => api.get(`/v1/dashboard/site-images/${encodePathSegment(id, 'site image id')}`),
  updateSiteImage: (id, payload, image) => api.post(`/v1/dashboard/site-images/${encodePathSegment(id, 'site image id')}`, multipart({ ...payload, _method: 'PUT' }, { image_file: image }), formHeaders),
  deleteSiteImage: (id) => api.delete(`/v1/dashboard/site-images/${encodePathSegment(id, 'site image id')}`),

  // News bar lines (New Paper Lines): { description_ar, description_en, link, is_active (1/0), image_file, delete_image }.
  listNewsLines: (params = {}) => api.get('/v1/dashboard/new-paper-lines', { params }),
  getNewsLine: (id) => api.get(`/v1/dashboard/new-paper-lines/${encodePathSegment(id, 'news line id')}`),
  createNewsLine: (payload, image) => api.post('/v1/dashboard/new-paper-lines', multipart(payload, { image_file: image }), formHeaders),
  updateNewsLine: (id, payload, image) => api.post(`/v1/dashboard/new-paper-lines/${encodePathSegment(id, 'news line id')}`, multipart({ ...payload, _method: 'PUT' }, { image_file: image }), formHeaders),
  toggleNewsLineStatus: (id) => api.patch(`/v1/dashboard/new-paper-lines/${encodePathSegment(id, 'news line id')}/toggle-status`),
  deleteNewsLine: (id) => api.delete(`/v1/dashboard/new-paper-lines/${encodePathSegment(id, 'news line id')}`),
};

export default tijaraAdminApi;
