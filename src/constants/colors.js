/**
 * Shared color mapping and utility functions for product attributes, swatches, and cart variants.
 */

export const colorMap = {
  'أحمر': '#ef4444',
  'red': '#ef4444',
  'أزرق': '#3b82f6',
  'blue': '#3b82f6',
  'أخضر': '#10b981',
  'green': '#10b981',
  'أسود': '#111827',
  'black': '#111827',
  'أبيض': '#ffffff',
  'white': '#ffffff',
  'وردي': '#ec4899',
  'pink': '#ec4899',
  'ذهبي': '#f59e0b',
  'gold': '#f59e0b',
  'فضي': '#9ca3af',
  'silver': '#9ca3af',
  'ستانلس ستيل': '#d1d5db',
  'ستانلس': '#d1d5db',
  'stainless': '#d1d5db',
  'رمادي': '#6b7280',
  'gray': '#6b7280',
  'grey': '#6b7280',
  'برتقالي': '#f97316',
  'orange': '#f97316',
  'أصفر': '#eab308',
  'yellow': '#eab308',
  'بني': '#92400e',
  'brown': '#92400e',
  'بيج': '#f5f5dc',
  'beige': '#f5f5dc',
  'نحاسي': '#b87333',
  'copper': '#b87333',
  'بنفسجي': '#8b5cf6',
  'purple': '#8b5cf6',
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Return a canonical, CSS-safe hex value or null for malformed input. */
export const normalizeHexColor = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const candidate = raw.startsWith('#') ? raw : `#${raw}`;
  if (!HEX_COLOR_PATTERN.test(candidate)) return null;
  const hex = candidate.slice(1).toLowerCase();
  if (hex.length === 3 || hex.length === 4) {
    return `#${hex.split('').map((part) => `${part}${part}`).join('')}`;
  }
  return `#${hex}`;
};

export const getPresetColorHex = (label) => {
  const raw = String(label ?? '').trim();
  const explicitHex = normalizeHexColor(raw);
  if (explicitHex) return explicitHex;
  const l = raw.split('|', 1)[0].toLowerCase().trim();
  if (!l) return '#6b7280';
  if (colorMap[l]) return colorMap[l];

  // API labels are often descriptive, e.g. "أسود ملكي" or "أسود / فضي".
  // Match the longest known color token so every product still gets a real swatch.
  const matchingKey = Object.keys(colorMap)
    .sort((a, b) => b.length - a.length)
    .find((key) => l.includes(key.toLowerCase()));
  return matchingKey ? colorMap[matchingKey] : '#6b7280';
};

export const getActualColor = (colorName) => {
  if (!colorName) return 'transparent';
  return normalizeHexColor(colorName) || getPresetColorHex(colorName);
};

export const isLightColor = (hex) => {
  const normalized = normalizeHexColor(hex) || getPresetColorHex(hex);
  if (normalized.length >= 7) {
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.75;
  }
  return false;
};
