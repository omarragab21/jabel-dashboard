// Decides whether a bilingual value (Arabic / English) really holds text.
// "Really" means: after removing HTML tags, entities like &nbsp;, invisible Unicode characters
// (zero-width spaces, direction marks, BOM, non-breaking spaces) and lines that are only a bullet,
// something readable is left. A field that only *looks* filled ("   ", "<p><br></p>", "\u200F", "-")
// counts as empty, so the dashboard never reports a missing translation as present.

// Whitespace plus the invisible / formatting characters editors and copy-paste leave behind.
// U+034F (combining grapheme joiner) sits outside the class: a combining mark inside one is ambiguous.
const INVISIBLE = /\u034F|[\s\u00A0\u00AD\u061C\u115F\u1160\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000\u3164\uFEFF\uFFA0]/g;
const HTML_TAG = /<[^>]*>/g;
const HTML_SPACE = /&(nbsp|#160|#x0*a0|zwnj|zwj|lrm|rlm|shy);/gi;
const BULLET_ONLY_LINE = /^[\s\-–—•*❖·]+$/gm;

export function hasText(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasText);
  if (typeof value === 'object') return Object.values(value).some(hasText);
  const text = String(value)
    .replace(HTML_TAG, ' ')
    .replace(HTML_SPACE, ' ')
    .replace(BULLET_ONLY_LINE, '')
    .replace(INVISIBLE, '');
  return text.length > 0;
}

/**
 * 'complete'   both languages are written
 * 'missing-ar' only English is written
 * 'missing-en' only Arabic is written
 * 'empty'      neither is written
 */
export function bilingualStatus(ar, en) {
  const hasAr = hasText(ar);
  const hasEn = hasText(en);
  if (hasAr && hasEn) return 'complete';
  if (hasEn) return 'missing-ar';
  if (hasAr) return 'missing-en';
  return 'empty';
}

/** The languages still to fill, in the order they should be shown (the dashboard language first). */
export function missingLanguages(ar, en, preferred = 'ar') {
  const missing = [];
  if (!hasText(ar)) missing.push('ar');
  if (!hasText(en)) missing.push('en');
  return missing.sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : 0));
}
