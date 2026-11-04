// Tabs of the product page, configured in the dashboard (Settings > Product details) and stored
// in the settings API under one row: `product_tabs` (JSON array, in display order).
//
// Each tab: { id, source, title_ar, title_en }
//   source = which product data the tab shows:
//     overview     → the product's overview text
//     features     → its feature points
//     specs        → the attributes picked on the product
//     installation → its installation points
//     shipping     → its shipping & returns points
// A source is used by one tab at most. «التقييمات» is always the last tab and is not configurable.
export const PRODUCT_TABS_KEY = 'product_tabs';

export const TAB_SOURCES = ['overview', 'features', 'specs', 'installation', 'shipping'];

export const DEFAULT_TAB_TITLES = Object.freeze({
  overview: { ar: 'نظرة عامة', en: 'Overview' },
  features: { ar: 'المميزات', en: 'Features' },
  specs: { ar: 'المواصفات الفنية', en: 'Technical Specifications' },
  installation: { ar: 'التركيب', en: 'Installation' },
  shipping: { ar: 'الشحن والإرجاع', en: 'Shipping & Returns' },
});

// Until something is saved the page keeps its original four tabs.
export const DEFAULT_PRODUCT_TABS = Object.freeze(
  ['overview', 'specs', 'installation', 'shipping'].map((source) => ({ id: source, source, title_ar: '', title_en: '' })),
);

const parse = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

export const normalizeTab = (tab) => ({
  id: String(tab?.source ?? ''),
  source: String(tab?.source ?? ''),
  title_ar: String(tab?.title_ar ?? '').trim(),
  title_en: String(tab?.title_en ?? '').trim(),
});

// The saved tabs in order (unknown or repeated sources dropped); null when never saved.
export const parseProductTabs = (value) => {
  const parsed = parse(value);
  if (!Array.isArray(parsed)) return null;
  const seen = new Set();
  return parsed
    .filter((tab) => TAB_SOURCES.includes(tab?.source) && !seen.has(tab.source) && seen.add(tab.source))
    .map(normalizeTab);
};

export const resolveProductTabs = (value) => parseProductTabs(value) ?? DEFAULT_PRODUCT_TABS.map(normalizeTab);

// The name shown for a tab in the page language: the saved name, else the other language's, else the default.
export const tabTitle = (tab, lang) => {
  const own = lang === 'ar' ? tab.title_ar : tab.title_en;
  return own || DEFAULT_TAB_TITLES[tab.source]?.[lang] || '';
};

// The name of the tab that shows a product data source (used for the field names in the product form).
export const sourceTitle = (value, source, lang) => {
  const tab = resolveProductTabs(value).find((item) => item.source === source);
  return tab ? tabTitle(tab, lang) : DEFAULT_TAB_TITLES[source]?.[lang] || '';
};
