import api from '../../config/axios';
import { encodePathSegment } from '../../utils/adminSecurity';

// An emptied point list must reach the API as a blank value: an empty array sends nothing, so the old
// points would stay on the product (the API clears a field only when it receives it blank). The product
// discount is cleared the same way.
const CLEARABLE_POINT_FIELDS = ['key_features', 'tips', 'shipping_info'].flatMap((field) => [`${field}_en`, `${field}_ar`]);
const CLEARABLE_FIELDS = [...CLEARABLE_POINT_FIELDS, 'discount_percentage'];
const withClearedPoints = (payload) => {
  const next = { ...payload };
  CLEARABLE_POINT_FIELDS.forEach((key) => {
    if (Array.isArray(next[key]) && next[key].length === 0) next[key] = '';
  });
  return next;
};

const multipart = (payload, files = {}) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '' && !CLEARABLE_FIELDS.includes(key)) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => body.append(`${key}[${index}]`, item));
    } else {
      body.append(key, value);
    }
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

const json = { headers: { 'Content-Type': 'application/json' } };
const formHeaders = { headers: { 'Content-Type': 'multipart/form-data' } };

export const tijaraAdminApi = {
  listUsers: (params = {}) => api.get('/v1/users', { params }),
  createUser: (payload, image) => api.post('/v1/users', multipart(payload, { image_file: image }), formHeaders),
  updateUser: (id, payload, image) => api.put(`/v1/users/${encodePathSegment(id, 'user id')}`, multipart(payload, { image_file: image }), formHeaders),
  getUser: (id) => api.get(`/v1/users/${encodePathSegment(id, 'user id')}`),
  deleteUser: (id) => api.delete(`/v1/users/${encodePathSegment(id, 'user id')}`),
  getProfile: () => api.get('/v1/profile'),
  updateProfile: (payload) => api.post('/v1/profile', payload, json),
  changePassword: (payload) => api.put('/v1/profile/password', payload, json),

  listCategories: (params = {}) => api.get('/v1/categories', { params }),
  createCategory: (payload, image) => api.post('/v1/categories', multipart(payload, { image_file: image }), formHeaders),
  updateCategory: (id, payload, image) => api.put(`/v1/categories/${encodePathSegment(id, 'category id')}`, multipart(payload, { image_file: image }), formHeaders),
  getCategory: (id) => api.get(`/v1/categories/${encodePathSegment(id, 'category id')}`),
  deleteCategory: (id) => api.delete(`/v1/categories/${encodePathSegment(id, 'category id')}`),

  listProducts: (params = {}) => api.get('/v1/products', { params }),
  createProduct: (payload, files = []) => api.post('/v1/products', multipart(payload, { images: files }), formHeaders),
  updateProduct: (id, payload, files = []) => api.put(`/v1/products/${encodePathSegment(id, 'product id')}`, multipart(withClearedPoints(payload), { images: files }), formHeaders),
  getProduct: (id) => api.get(`/v1/products/${encodePathSegment(id, 'product id')}`),
  deleteProduct: (id) => api.delete(`/v1/products/${encodePathSegment(id, 'product id')}`),
  adjustStock: (id, payload) => api.post(`/v1/products/${encodePathSegment(id, 'product id')}/adjust-stock`, multipart(payload), formHeaders),
  listStockMovements: (params = {}) => api.get('/v1/reports/movements', { params }),
  productStockMovements: (id, params = {}) => api.get(`/v1/reports/movements/product/${encodePathSegment(id, 'product id')}`, { params }),

  listAttributes: (params = {}) => api.get('/v1/attributes', { params }),
  createAttribute: (payload) => api.post('/v1/attributes', payload, json),
  updateAttribute: (id, payload) => api.put(`/v1/attributes/${encodePathSegment(id, 'attribute id')}`, payload, json),
  getAttribute: (id) => api.get(`/v1/attributes/${encodePathSegment(id, 'attribute id')}`),
  deleteAttribute: (id) => api.delete(`/v1/attributes/${encodePathSegment(id, 'attribute id')}`),
  createAttributeOption: (attributeId, payload) => api.post(`/v1/attributes/${encodePathSegment(attributeId, 'attribute id')}/options`, payload, json),
  updateAttributeOption: (attributeId, optionId, payload) => api.put(`/v1/attributes/${encodePathSegment(attributeId, 'attribute id')}/options/${encodePathSegment(optionId, 'option id')}`, payload, json),
  deleteAttributeOption: (attributeId, optionId) => api.delete(`/v1/attributes/${encodePathSegment(attributeId, 'attribute id')}/options/${encodePathSegment(optionId, 'option id')}`),

  listDiscountCodes: (params = {}) => api.get('/v1/discount_codes', { params }),
  // JSON unless an image is attached; then multipart with the image as `image_file`.
  createDiscountCode: (payload, image) => (image
    ? api.post('/v1/discount_codes', discountForm(payload, image), formHeaders)
    : api.post('/v1/discount_codes', payload, json)),
  // PHP does not parse multipart PUT bodies, so an image update is a POST with
  // Laravel's `_method=PUT` override.
  updateDiscountCode: (id, payload, image) => (image
    ? api.post(`/v1/discount_codes/${encodePathSegment(id, 'discount code id')}`, discountForm({ ...payload, _method: 'PUT' }, image), formHeaders)
    : api.put(`/v1/discount_codes/${encodePathSegment(id, 'discount code id')}`, payload, json)),
  getDiscountCode: (id) => api.get(`/v1/discount_codes/${encodePathSegment(id, 'discount code id')}`),
  deleteDiscountCode: (id) => api.delete(`/v1/discount_codes/${encodePathSegment(id, 'discount code id')}`),

  // Offers (إدارة العروض) are the API's discounts. PHP does not read a multipart PUT body, so an update is a
  // POST with Laravel's `_method=PUT` override.
  listDiscounts: (params = {}) => api.get('/v1/discounts', { params }),
  getDiscount: (id) => api.get(`/v1/discounts/${encodePathSegment(id, 'discount id')}`),
  createDiscount: (payload, image) => api.post('/v1/discounts', multipart(payload, { image_file: image }), formHeaders),
  updateDiscount: (id, payload, image) => api.post(`/v1/discounts/${encodePathSegment(id, 'discount id')}`, multipart({ ...payload, _method: 'PUT' }, { image_file: image }), formHeaders),
  toggleDiscountStatus: (id) => api.patch(`/v1/discounts/${encodePathSegment(id, 'discount id')}/toggle-status`),
  deleteDiscount: (id) => api.delete(`/v1/discounts/${encodePathSegment(id, 'discount id')}`),

  listOffers: (params = {}) => api.get('/v1/offers', { params }),
  createOffer: (payload, image) => api.post('/v1/offers', multipart(payload, { image_file: image }), formHeaders),
  updateOffer: (id, payload, image) => api.put(`/v1/offers/${encodePathSegment(id, 'offer id')}`, multipart(payload, { image_file: image }), formHeaders),
  getOffer: (id) => api.get(`/v1/offers/${encodePathSegment(id, 'offer id')}`),
  deleteOffer: (id) => api.delete(`/v1/offers/${encodePathSegment(id, 'offer id')}`),

  listReviews: (params = {}) => api.get('/v1/reviews', { params }),
  updateReview: (id, payload) => api.patch(`/v1/reviews/${encodePathSegment(id, 'review id')}`, payload, json),
  deleteReview: (id) => api.delete(`/v1/reviews/${encodePathSegment(id, 'review id')}`),

  listContacts: (params = {}) => api.get('/v1/contacts', { params }),
  getContact: (id) => api.get(`/v1/contacts/${encodePathSegment(id, 'contact id')}`),
  deleteContact: (id) => api.delete(`/v1/contacts/${encodePathSegment(id, 'contact id')}`),
  markContactSeen: (id) => api.patch(`/v1/contacts/${encodePathSegment(id, 'contact id')}/seen`),

  listSliders: (params = {}) => api.get('/v1/sliders', { params }),
  createSlider: (payload, image) => api.post('/v1/sliders', multipart(payload, { image_file: image }), formHeaders),
  updateSlider: (id, payload, image) => api.put(`/v1/sliders/${encodePathSegment(id, 'slider id')}`, multipart(payload, { image_file: image }), formHeaders),
  getSlider: (id) => api.get(`/v1/sliders/${encodePathSegment(id, 'slider id')}`),
  deleteSlider: (id) => api.delete(`/v1/sliders/${encodePathSegment(id, 'slider id')}`),

  listOrders: (params = {}) => api.get('/v1/orders', { params }),
  getOrder: (id) => api.get(`/v1/orders/${encodePathSegment(id, 'order id')}`),
  updateOrder: (id, payload) => api.patch(`/v1/orders/${encodePathSegment(id, 'order id')}`, payload, json),
  deleteOrder: (id) => api.delete(`/v1/orders/${encodePathSegment(id, 'order id')}`),
};

export default tijaraAdminApi;
