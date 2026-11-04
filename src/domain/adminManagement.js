import { sanitizeAssetUrl } from '../utils/adminSecurity.js';
import { sanitizeUrl } from '../utils/sanitize.js';

const firstText = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';

const localized = (translations, field, fallback = '') => ({
  ar: firstText(translations?.ar?.[field], fallback),
  en: firstText(translations?.en?.[field], fallback),
});

const imageUrl = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return sanitizeAssetUrl(value, '');
  return imageUrl(value.image_url || value.url || value.image || value.path);
};

export const toAdminUser = (raw = {}) => {
  raw = raw || {};
  const translations = raw.translations || {};
  const nameI18n = localized(translations, 'name', raw.name || raw.name_en || raw.name_ar);
  const status = raw.status ?? raw.is_active;
  return {
    ...raw,
    id: raw.id,
    name: firstText(raw.name, nameI18n.ar, nameI18n.en),
    name_i18n: nameI18n,
    email: raw.email || '',
    phone: raw.phone_number ?? raw.phone ?? '',
    role: raw.role || 'admin',
    is_active: status !== false && status !== 0 && status !== '0',
    avatar: imageUrl(raw.image_url || raw.avatar || raw.image),
    createdAt: raw.created_at || raw.createdAt || '',
  };
};

// Same fields the API validates on POST/PUT /v1/users (name, phone_number, email, role, status, password).
export const toAdminUserPayload = (form = {}) => ({
  name: String(form.name || form.name_en || form.name_ar || '').trim(),
  email: String(form.email || '').trim(),
  phone_number: String(form.phone ?? form.phone_number ?? '').trim(),
  role: form.role || 'super_admin',
  status: form.is_active === false ? 0 : 1,
  ...(form.password ? { password: form.password } : {}),
});

export const toAdminUserUpdatePayload = toAdminUserPayload;

export const toAdminSlider = (raw = {}) => {
  raw = raw || {};
  const titleI18n = raw.title_i18n || localized(raw.translations, 'title', raw.title);
  const descriptionI18n = raw.description_i18n || localized(raw.translations, 'description', raw.description);
  const rawStatus = raw.status ?? raw.is_active;
  const status = rawStatus === 'scheduled' ? 'scheduled' : (rawStatus === false || rawStatus === 0 || rawStatus === '0' || rawStatus === 'inactive' ? 'inactive' : 'active');
  return {
    ...raw,
    id: raw.id,
    title_i18n: titleI18n,
    description_i18n: descriptionI18n,
    title: firstText(raw.title, titleI18n.ar, titleI18n.en),
    description: firstText(raw.description, descriptionI18n.ar, descriptionI18n.en),
    image: imageUrl(raw.image_url || raw.image),
    link: raw.link ? sanitizeUrl(raw.link, '') : '',
    status,
    order: Number(raw.order ?? raw.sort_order ?? 0),
  };
};

export const toAdminSliderPayload = (form = {}) => ({
  title_en: String(form.title_en || '').trim(),
  title_ar: String(form.title_ar || '').trim(),
  description_en: String(form.description_en || '').trim(),
  description_ar: String(form.description_ar || '').trim(),
  link: form.link ? sanitizeUrl(String(form.link).trim(), '') : '',
  status: form.status === 'active' || form.status === true ? 1 : 0,
  order: Number(form.order) || 0,
});
