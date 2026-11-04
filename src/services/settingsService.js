import api from '../config/axios';
import { API_TTL, getCached, parseCollectionResponse, parseDataResponse } from './apiClient';
import { SOCIAL_KEYS as SOCIAL_LINK_KEYS, normalizeSocialLink } from '../domain/socialLinks';

const SOCIAL_KEYS = new Set(['whatsapp', 'facebook', 'instagram', 'x_twitter', 'linkedin', 'youtube', 'snapchat', 'tiktok', 'social_links']);

const unwrapSettings = (payload) => {
  const body = payload?.data ?? payload;
  const value = body?.settings ?? body?.data ?? body;
  if (Array.isArray(value)) return value;
  return Object.entries(value || {}).map(([key, settingValue]) => ({ key, value: settingValue }));
};

const groupForKey = (key) => {
  if (SOCIAL_KEYS.has(key)) return 'social';
  if (key.startsWith('home_')) return 'homepage';
  if (key.startsWith('about_')) return 'about';
  if (['vat_percentage', 'default_shipping_cost', 'shipping_cost', 'tax_rate', 'free_delivery_threshold'].includes(key)) return 'commerce';
  return 'general';
};

const hasValue = (value) => value !== undefined && value !== null && value !== '';

// A link that cannot be turned into a web address is saved as empty (the dashboard already told the admin).
const sanitizeSocialValue = (key, raw) => {
  if (!hasValue(raw)) return null;
  return normalizeSocialLink(key, raw).value || null;
};

const assetUrlFrom = (payload) => {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.data?.image, payload?.image];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (typeof candidate === 'object') {
      const value = candidate.image_url || candidate.url || candidate.image || candidate.path || candidate.file || candidate.src;
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return '';
};

export const buildSettingsPayload = (settings = {}) => {
  const normalized = { ...settings };
  const socialKeys = SOCIAL_LINK_KEYS;
  let existingSocialLinks = normalized.social_links;
  if (typeof existingSocialLinks === 'string') {
    try { existingSocialLinks = JSON.parse(existingSocialLinks); } catch { existingSocialLinks = {}; }
  }
  if (Array.isArray(existingSocialLinks)) {
    existingSocialLinks = existingSocialLinks.reduce((links, item) => {
      if (item?.key) links[item.key] = item.value;
      return links;
    }, {});
  }
  const socialLinks = { ...(existingSocialLinks && typeof existingSocialLinks === 'object' ? existingSocialLinks : {}) };

  socialKeys.forEach((key) => {
    // A present-but-empty dashboard field means the link was intentionally
    // cleared. Do not keep an older value from social_links in that case.
    if (Object.hasOwn(normalized, key)) {
      const safeLink = sanitizeSocialValue(key, normalized[key]);
      normalized[key] = safeLink;
      socialLinks[key] = safeLink;
    } else if (socialLinks[key]) {
      socialLinks[key] = sanitizeSocialValue(key, socialLinks[key]);
    }
  });

  if (!Object.hasOwn(normalized, 'x_twitter') && hasValue(normalized.twitter)) {
    socialLinks.x_twitter = sanitizeSocialValue('x_twitter', normalized.twitter);
  }

  // The dashboard form edits shipping_cost / tax_rate, while the Site API (and
  // therefore the storefront checkout) reads default_shipping_cost / vat_percentage.
  // Both keys come back from the API, so the loaded values were silently winning
  // over what the admin typed and a changed VAT or shipping fee never reached
  // the customer. The edited form field must always win.
  if (hasValue(normalized.shipping_cost)) {
    normalized.default_shipping_cost = normalized.shipping_cost;
  }
  if (hasValue(normalized.tax_rate)) {
    const taxRate = Number(normalized.tax_rate);
    // The backend applies vat_percentage as a percentage (14 = 14%), not a fraction.
    if (Number.isFinite(taxRate)) normalized.vat_percentage = taxRate;
  }
  if (!hasValue(normalized.site_contact_phone) && hasValue(normalized.support_phone)) {
    normalized.site_contact_phone = normalized.support_phone;
  }
  normalized.social_links = socialLinks;

  return Object.entries(normalized).map(([key, value]) => ({
    key,
    group: groupForKey(key),
    value: value === '[]' ? null : value,
    is_active: true,
  }));
};

const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const settingsService = {
  async getAdminSettings() {
    const response = await api.get('/v1/settings');
    return unwrapSettings(response.data);
  },

  async bulkUpdate(settings) {
    const normalized = { ...(settings || {}) };
    const fileEntries = Object.entries(normalized)
      .filter(([, value]) => typeof File !== 'undefined' && value instanceof File);

    // Settings values are JSON, while Tijara's site-images endpoint accepts
    // multipart uploads. Upload each selected brand asset first, then persist
    // the returned URL/path in the settings bulk payload.
    for (const [key, file] of fileEntries) {
      const formData = new FormData();
      formData.append('title', `settings_${key}`);
      formData.append('image_file', file);
      const uploadResponse = await api.post('/v1/site-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = assetUrlFrom(uploadResponse.data);
      if (!uploadedUrl) {
        const error = new Error(`Settings asset upload returned no URL for ${key}`);
        error.code = 'SETTINGS_ASSET_UPLOAD_INVALID_RESPONSE';
        error.fileKey = key;
        throw error;
      }
      normalized[key] = uploadedUrl;
    }

    const payload = buildSettingsPayload(normalized);
    const response = await api.post('/v1/settings/bulk', { settings: payload });
    return unwrapSettings(response.data);
  },

  async getSettings(options = {}) {
    const body = await getCached('/frontend/settings', {}, {
      ttl: options.ttl ?? API_TTL.settings,
      signal: options.signal,
      retries: options.retries ?? 2,
      timeout: options.timeout ?? 4000,
    });
    return parseDataResponse(body);
  },

  async getSliders(params = { is_active: 1 }, options = {}) {
    const body = await getCached('/frontend/sliders', clean(params), {
      ttl: options.ttl ?? API_TTL.settings,
      signal: options.signal,
      retries: options.retries ?? 2,
      timeout: options.timeout ?? 4000,
    });
    return parseCollectionResponse(body).items;
  },

  async getCountries(options = {}) {
    const body = await getCached('/frontend/countries', {}, { signal: options.signal, retries: 2 });
    return parseCollectionResponse(body).items;
  },

  async getCities(countryId = null, options = {}) {
    const params = countryId ? { country_id: countryId } : {};
    const body = await getCached('/frontend/cities', params, { signal: options.signal, retries: 2 });
    return parseCollectionResponse(body).items;
  },

  async getShippingRates(options = {}) {
    const body = await getCached('/frontend/city-shipping-rates', {}, { signal: options.signal, retries: 2 });
    return parseCollectionResponse(body).items;
  },

  async getTopics(params = { status: 'published' }, options = {}) {
    const body = await getCached('/frontend/topics', clean(params), { signal: options.signal, retries: 2 });
    return parseCollectionResponse(body).items;
  },

  async getTopicBySlug(slug, options = {}) {
    const body = await getCached(`/frontend/topics/${encodeURIComponent(slug)}`, {}, { signal: options.signal, retries: 2 });
    return parseDataResponse(body);
  },

  async sendContactMessage(messageData) {
    const response = await api.post('/v1/site/contacts', {
      name: messageData.name,
      email: messageData.email,
      phone: messageData.phone,
      type: messageData.type || messageData.subject || 'Inquiry',
      message: messageData.message,
    });
    return response.data;
  },
};

export default settingsService;
