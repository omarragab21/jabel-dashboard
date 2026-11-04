// Privacy policy and Terms & Conditions text, stored in the site settings API under the key "legal_pages"
// ({ privacy: {...}, terms: {...} }) next to every other site setting. The website reads the same key.
import api from '../config/axios';
import { settingsService } from './settingsService';

export const LEGAL_PAGE_IDS = ['privacy', 'terms'];
const SETTING_KEY = 'legal_pages';

const str = (value) => (typeof value === 'string' ? value : '');

const cleanSection = (section) => ({
  title_ar: str(section?.title_ar).trim(),
  title_en: str(section?.title_en).trim(),
  text_ar: str(section?.text_ar).trim(),
  text_en: str(section?.text_en).trim(),
});

const cleanBanner = (banner) => ({
  title_ar: str(banner?.title_ar).trim(),
  title_en: str(banner?.title_en).trim(),
  text_ar: str(banner?.text_ar).trim(),
  text_en: str(banner?.text_en).trim(),
});

// What the box shows until the dashboard saves something else (same texts as the Figma design).
// Once the dashboard has saved the page, an emptied box stays empty and is removed from the page.
const DEFAULT_BANNERS = {
  privacy: {
    title_ar: 'ملفات تعريف الارتباط وتفضيلات التتبع',
    title_en: 'Cookies & Tracking Preferences',
    text_ar: 'نستخدم ملفات تعريف الارتباط لتحسين أداء التصفح وتقديم تجربة شخصية تليق باختياراتك.',
    text_en: 'We use cookies to improve browsing performance and offer a personalised experience that suits your choices.',
  },
  terms: {
    title_ar: 'تنبيه قانوني هام',
    title_en: 'Important legal notice',
    text_ar: 'تُعتبر هذه الشروط بمثابة اتفاقية قانونية ملزمة لجميع مستخدمي المنصة والمشترين من متجرنا.',
    text_en: 'These terms are a binding legal agreement for all platform users and buyers from our store.',
  },
};

const asObject = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

/** Every stored page, as { privacy, terms } (missing pages are simply absent). */
const readAll = async () => {
  const rows = await settingsService.getAdminSettings();
  return asObject(rows.find((row) => row.key === SETTING_KEY)?.value);
};

/** A stored page in the shape the editor works with. */
const toPage = (data, id) => ({
  updated_at: /^\d{4}-\d{2}$/.test(str(data?.updated_at)) ? data.updated_at : currentMonth(),
  tagline_ar: str(data?.tagline_ar),
  tagline_en: str(data?.tagline_en),
  banner: data?.banner === undefined ? { ...DEFAULT_BANNERS[id] } : cleanBanner(asObject(data.banner)),
  sections: (Array.isArray(data?.sections) ? data.sections : [])
    .map((section, index) => ({ position: Number(section?.position) || index + 1, ...cleanSection(section) }))
    .sort((a, b) => a.position - b.position)
    .map(({ position: _position, ...section }) => section),
});

/** Loads a page; `saved` is false while the API has nothing stored for it (the editor then starts empty). */
export const loadLegalPage = async (id) => {
  const data = (await readAll())[id];
  return { saved: Boolean(data && Array.isArray(data.sections) && data.sections.length), page: toPage(data, id) };
};

/** Saves one page, keeping the other one untouched, then reads it back to confirm the API really stored it. */
export const saveLegalPage = async (id, page) => {
  const all = await readAll();
  all[id] = {
    updated_at: page.updated_at,
    tagline_ar: str(page.tagline_ar).trim(),
    tagline_en: str(page.tagline_en).trim(),
    banner: cleanBanner(page.banner),
    sections: page.sections.map((section, index) => ({ position: index + 1, ...cleanSection(section) })),
  };
  await api.post('/v1/settings/bulk', { settings: [{ key: SETTING_KEY, group: 'general', value: all, is_active: true }] });
  const stored = (await readAll())[id];
  if (!stored || (stored.sections || []).length !== all[id].sections.length) {
    const error = new Error('LEGAL_PAGES_NOT_PERSISTED');
    error.code = 'LEGAL_PAGES_NOT_PERSISTED';
    throw error;
  }
};
