// Homepage product lists (Settings > Homepage), saved in the settings API under
// the key-value row `home_product_sections` and rendered by the website in order.
//
// Each list: { id, title_ar, title_en, source, category_id, limit, is_active }
//   source = 'featured' | 'new_arrivals' | 'category' (products of category_id;
//   the website's «عرض الكل» opens that category).
export const HOME_SECTIONS_KEY = 'home_product_sections';

export const SECTION_SOURCES = ['featured', 'new_arrivals', 'category'];
export const SECTION_LIMITS = [4, 8, 12];

const parseValue = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

const toLimit = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 4;
};

export const newSectionId = () => `list-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const normalizeHomeSection = (section, index = 0) => {
  const source = SECTION_SOURCES.includes(section?.source) ? section.source : 'category';
  const categoryId = section?.category_id ?? null;
  return {
    id: String(section?.id || `section-${index + 1}`),
    title_ar: String(section?.title_ar || '').trim(),
    title_en: String(section?.title_en || '').trim(),
    source,
    category_id: source === 'category' && categoryId !== null && categoryId !== '' ? String(categoryId) : null,
    limit: toLimit(section?.limit),
    is_active: section?.is_active !== false && section?.is_active !== 0 && section?.is_active !== '0',
  };
};

// The saved lists, or null when the key was never saved.
export const parseHomeSections = (value) => {
  const parsed = parseValue(value);
  if (!Array.isArray(parsed)) return null;
  return parsed.map(normalizeHomeSection);
};

// First open of the editor with nothing saved: no made-up lists. Only a list for each category that was
// picked in the older «الفئة المخصصة الأولى / الثانية» fields (real data from the API) is offered.
export const seedHomeSections = (legacyCategoryIds = [], categories = []) => {
  const nameOf = (id) => categories.find((category) => String(category.id) === String(id));
  const legacy = legacyCategoryIds
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map((id) => {
      const category = nameOf(id);
      return normalizeHomeSection({
        id: `category-${id}`,
        title_ar: category?.name_ar || category?.name || '',
        title_en: category?.name_en || '',
        source: 'category',
        category_id: id,
      });
    });
  return legacy;
};

// A list that cannot be shown: a category list without a category.
export const sectionProblem = (section) => (section.source === 'category' && !section.category_id ? 'missing_category' : null);
