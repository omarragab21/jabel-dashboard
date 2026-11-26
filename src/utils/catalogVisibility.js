// Presentation-only filter for QA records (by id) that must not appear in the
// customer-facing/admin catalog views. Backend data is not changed by this helper.
// It matches ids only: hiding by name made real products called "Test ..." or "QA ..." vanish.
const TEST_PRODUCT_IDS = new Set([42, 55]);
const TEST_CATEGORY_IDS = new Set([61]);

const searchableText = (record = {}) => [
  record.name,
  record.name_ar,
  record.name_en,
  record.slug,
  record.sku,
].filter(Boolean).join(' ').toLowerCase();

export const isTestProduct = (product = {}) => {
  const id = Number(product.id ?? product.product_id);
  if (TEST_PRODUCT_IDS.has(id)) return true;
  return false;
};

export const isTestCategory = (category = {}) => {
  const id = Number(category.id ?? category.category_id);
  if (TEST_CATEGORY_IDS.has(id)) return true;
  return false;
};

export const visibleProducts = (products = []) => products.filter((product) => !isTestProduct(product));
export const visibleCategories = (categories = []) => categories.filter((category) => !isTestCategory(category));
