// News bar lines (/v1/dashboard/new-paper-lines, "New Paper Lines" in the Postman collection).
// Pure helpers (no Vue, no HTTP) so every rule is covered by node tests.
//
// Request body (multipart): description_ar*, description_en*, link, is_active (1/0), image_file, delete_image (1).
// The resource is read defensively: the text may come as description_ar / description_en, as
// translations.{ar,en}.description, or only as the localized `description`.
import { parseNewsItems } from './newsBar.js';

const text = (value) => (value === null || value === undefined ? '' : String(value).trim());
const firstText = (...values) => values.map(text).find(Boolean) || '';
const toBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') return !['0', 'false', 'inactive', 'off', 'no'].includes(value.trim().toLowerCase());
  return Boolean(value);
};
const ARABIC_LETTERS = /[؀-ۿ]/;

const translation = (raw, lang) => {
  const translations = raw?.translations;
  if (Array.isArray(translations)) return translations.find((row) => row?.locale === lang) || {};
  return translations && typeof translations === 'object' ? translations[lang] || {} : {};
};

export const toNewsLine = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const localized = text(raw.description);
  let ar = firstText(raw.description_ar, translation(raw, 'ar').description);
  let en = firstText(raw.description_en, translation(raw, 'en').description);
  // Only the localized text came back: file it under the language it is written in.
  if (!ar && !en && localized) {
    if (ARABIC_LETTERS.test(localized)) ar = localized; else en = localized;
  }
  return {
    id: raw.id ?? null,
    description_ar: ar,
    description_en: en,
    link: text(raw.link),
    image_url: firstText(raw.image_url, raw.image, raw.image_path),
    is_active: toBool(raw.is_active ?? raw.status),
    created_at: raw.created_at || '',
  };
};

export const localizedNewsText = (line, lang = 'ar') => (
  lang === 'en' ? firstText(line?.description_en, line?.description_ar) : firstText(line?.description_ar, line?.description_en)
);

export const emptyNewsLineForm = () => ({ description_ar: '', description_en: '', link: '', is_active: true, delete_image: false });

export const newsLineFormFrom = (line) => ({
  description_ar: text(line?.description_ar),
  description_en: text(line?.description_en),
  link: text(line?.link),
  is_active: line?.is_active !== false,
  delete_image: false,
});

// The API accepts only a full address (Laravel `url` rule): a site path such as /offers is refused there.
const LINK = /^https?:\/\/[^\s/]+\.[^\s]+$/i;

/** { field: reason } for the form; empty when it can be saved. */
export const validateNewsLineForm = (form = {}) => {
  const errors = {};
  if (!text(form.description_ar)) errors.description_ar = 'required';
  if (!text(form.description_en)) errors.description_en = 'required';
  else if (ARABIC_LETTERS.test(form.description_en)) errors.description_en = 'arabic_in_english';
  if (text(form.description_ar).length > 1000) errors.description_ar = 'too_long';
  if (text(form.description_en).length > 1000) errors.description_en = 'too_long';
  if (text(form.link) && !LINK.test(text(form.link))) errors.link = 'invalid';
  return errors;
};

/** Body for create / update. The link is sent blank to clear it; is_active goes as 1/0 (Laravel booleans). */
export const toNewsLinePayload = (form = {}) => ({
  description_ar: text(form.description_ar),
  description_en: text(form.description_en),
  link: text(form.link) || undefined,
  is_active: form.is_active === false ? 0 : 1,
  ...(form.delete_image ? { delete_image: 1 } : {}),
});

/**
 * The news items the old settings row (`news_bar_items`) still holds, as new-line forms, so the admin can move
 * them to the API in one click. Items without Arabic or English text are skipped (the API needs both).
 */
export const legacyNewsForms = (settingValue) => (parseNewsItems(settingValue) || [])
  .map((item) => ({
    description_ar: firstText(item.text_ar, item.text_en),
    description_en: firstText(item.text_en, item.text_ar),
    link: '',
    is_active: item.is_active !== false,
    delete_image: false,
  }))
  .filter((form) => form.description_ar && form.description_en);

export const filterNewsLines = (lines = [], { query = '', status = '' } = {}) => {
  const needle = text(query).toLowerCase();
  return lines.filter((line) => {
    if (status === 'active' && !line.is_active) return false;
    if (status === 'inactive' && line.is_active) return false;
    if (!needle) return true;
    return [line.description_ar, line.description_en, line.link].some((value) => text(value).toLowerCase().includes(needle));
  });
};
