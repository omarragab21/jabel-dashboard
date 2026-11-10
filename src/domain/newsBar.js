// News bar under the website header (Settings > News bar), saved in the settings API under the
// key-value row `news_bar_items` and shown by the website in this order.
//
// Each item: { id, text_ar, text_en, is_active }
export const NEWS_BAR_KEY = 'news_bar_items';

// No built-in news: the list starts empty and only holds what the admin writes.
export const DEFAULT_NEWS_ITEMS = Object.freeze([]);

export const newNewsId = () => `news-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const normalizeNewsItem = (item, index = 0) => ({
  id: String(item?.id || `news-${index + 1}`),
  text_ar: String(item?.text_ar || '').trim(),
  text_en: String(item?.text_en || '').trim(),
  is_active: item?.is_active !== false && item?.is_active !== 0 && item?.is_active !== '0',
});

/** The saved list (an empty list when every item was deleted), or null when nothing valid is saved yet. */
export const parseNewsItems = (value) => {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return null; }
  }
  if (!Array.isArray(parsed)) return null;
  return parsed.map(normalizeNewsItem);
};

export const seedNewsItems = () => DEFAULT_NEWS_ITEMS.map((item) => ({ ...item }));
