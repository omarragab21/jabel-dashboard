const PRODUCT_FALLBACK_SKUS = {
  25: 'O604S',
  26: 'H95GLCX',
  27: 'HO90GL',
};

const PRODUCT_FALLBACK_SUBTITLES = {
  25: { ar: 'شواية دوارة، أمان إيطالي', en: 'Rotary grill, Italian safety' },
  26: { ar: 'حوامل زهر، أمان كامل', en: 'Cast iron grates, full safety' },
  27: { ar: 'قوة شفط فائقة، هادئ', en: 'Super suction power, quiet' },
};

export function getCartItemSku(item) {
  if (item.sku) return item.sku;
  if (item.model_number) return item.model_number;
  if (item.model) return item.model;
  if (PRODUCT_FALLBACK_SKUS[String(item.id)]) return PRODUCT_FALLBACK_SKUS[String(item.id)];
  return item.code || '';
}

export function getCartItemSubtitle(item, { isEnglish = false } = {}) {
  if (item.subtitle) return item.subtitle;

  const attributes = item.selectedAttributes || item.attributes;
  if (attributes && typeof attributes === 'object') {
    const parts = [];
    const color = attributes.color || attributes['اللون'] || attributes.Color;
    if (color) {
      const normalizedColor = typeof color === 'string' && color.includes('|')
        ? color.split('|')[0].trim()
        : String(color).trim();
      parts.push(normalizedColor);
    }

    const size = attributes.size || attributes['المقاس'] || attributes.Size || attributes['الحجم'];
    if (size) parts.push(String(size).trim());
    if (parts.length > 0) return parts.join(isEnglish ? ', ' : '، ');
  }

  const fallbackSubtitle = PRODUCT_FALLBACK_SUBTITLES[String(item.id)];
  if (fallbackSubtitle) return fallbackSubtitle[isEnglish ? 'en' : 'ar'];

  if (item.description_i18n) {
    const languageKey = isEnglish ? 'en' : 'ar';
    const description = item.description_i18n[languageKey]
      || item.description_i18n.ar
      || item.description_i18n.en;
    if (description) {
      const parts = description.split(isEnglish ? ',' : '،');
      return parts.slice(0, 2).join(isEnglish ? ', ' : '، ');
    }
  }

  return item.short_description || '';
}
