import { getPresetColorHex, normalizeHexColor } from '../constants/colors.js';

const firstText = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';

export const localizedText = (value, fallback = '') => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return firstText(value.ar, value.en, value.name, value.label, fallback);
  }
  return firstText(value, fallback);
};

const normalizeValue = (value, index, isColor) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const label = localizedText(value.label ?? value.name ?? value.value, '');
    return {
      ...value,
      id: value.id ?? `${label}-${index}`,
      label,
      is_active: value.is_active !== false && value.is_active !== 0,
      color: value.color ?? value.color_code ?? value.hex ?? null,
    };
  }

  const raw = String(value ?? '').trim();
  const [label, color] = raw.split('|', 2);
  return {
    id: `${label}-${index}`,
    label: label.trim(),
    is_active: true,
    color: isColor ? (color?.trim() || null) : null,
  };
};

/**
 * Convert every API color shape into one stable contract for the UI:
 * { label, name, hex, color, id }.
 * Supports strings such as "أسود ملكي|#111827", nested i18n labels,
 * and objects using hex/color/color_code/colorHex fields.
 */
export const normalizeColorOption = (value, index = 0) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const rawValue = source.value ?? source.label ?? source.name ?? source.title ?? value;
  const rawText = localizedText(rawValue).trim();
  const [pipeLabel, pipeHex] = rawText.split('|', 2);
  const label = String(pipeLabel || rawText).replace(/\s+/g, ' ').trim();
  const explicitHex = source.hex ?? source.color ?? source.color_code ?? source.colorHex ?? pipeHex;
  const hex = normalizeHexColor(explicitHex) || getPresetColorHex(label);

  return {
    ...source,
    id: source.id ?? `${label}-${index}`,
    label,
    name: label,
    hex,
    color: hex,
    is_active: source.is_active !== false && source.is_active !== 0,
  };
};

export const normalizeColorOptions = (options = []) => (
  (Array.isArray(options) ? options : [])
    .map((option, index) => normalizeColorOption(option, index))
    .filter((option) => option.label)
);

export const extractColorOptions = (product = {}) => {
  if (!product || typeof product !== 'object') return [];
  if (Array.isArray(product.color_options) && product.color_options.length > 0) {
    return dedupeColorOptions(product.color_options);
  }

  const attributes = product.attributes || product.raw_attributes;
  if (!attributes || typeof attributes !== 'object') return [];
  const colorEntry = Object.entries(attributes).find(([key]) => isColorAttribute({ name: key, label: key }));
  return dedupeColorOptions(colorEntry?.[1]);
};

export const isColorAttribute = (attribute = {}) => {
  const name = localizedText(attribute.name).toLowerCase();
  const label = localizedText(attribute.label).toLowerCase();
  return attribute.type === 'color' || [name, label].some((value) => (
    value.includes('color') ||
    value.includes('لون') ||
    value.includes('الوان') ||
    value.includes('ألوان')
  ));
};

export const isSizeAttribute = (attribute = {}) => {
  const name = localizedText(attribute.name).toLowerCase();
  const label = localizedText(attribute.label).toLowerCase();
  return ['size', 'مقاس', 'حجم'].some((token) => name.includes(token) || label.includes(token));
};

/** Normalize the API's values_list contract and the dashboard's nested values contract. */
export const normalizeProductAttribute = (attribute = {}) => {
  const color = isColorAttribute(attribute);
  const rawValues = Array.isArray(attribute.values)
    ? attribute.values
    : (Array.isArray(attribute.values_list) ? attribute.values_list : []);

  return {
    ...attribute,
    name: localizedText(attribute.name),
    label: localizedText(attribute.label, localizedText(attribute.name)),
    type: attribute.type || 'select',
    is_active: attribute.is_active !== false && attribute.is_active !== 0,
    values: (color ? normalizeColorOptions(rawValues) : rawValues.map((value, index) => normalizeValue(value, index, false)))
      .filter((value) => value.label),
  };
};

export const normalizeProductAttributes = (attributes) => (
  Array.isArray(attributes) ? attributes.map(normalizeProductAttribute) : []
);

/** Keep a product's visual color choices unique by their displayed label. */
export const dedupeColorOptions = (options = []) => {
  const seen = new Set();

  return normalizeColorOptions(options).filter((option) => {
    const normalizedLabel = option.label
      .replace(/\s+/g, ' ')
      .trim();
    const key = normalizedLabel.toLocaleLowerCase();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
