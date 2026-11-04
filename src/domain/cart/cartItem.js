export const hasVariantAttributes = (attributes) => (
  Boolean(attributes)
  && typeof attributes === 'object'
  && Object.keys(attributes).length > 0
);

export const createCartItemKey = (productId, attributes) => {
  if (!hasVariantAttributes(attributes)) return null;

  const attributesKey = Object.keys(attributes)
    .sort()
    .map((key) => `${key}:${attributes[key]}`)
    .join('|');

  return `${productId}_${attributesKey}`;
};

export const normalizeCartItems = (items) => items
  .filter((item) => item && typeof item === 'object' && item.id !== null && item.id !== undefined)
  .map((item) => {
    const normalizedItem = {
      ...item,
      quantity: Math.min(999, Math.max(1, Math.floor(Number(item.quantity) || 1))),
    };

    if (hasVariantAttributes(item.selectedAttributes)) {
      normalizedItem.selectedAttributes = item.selectedAttributes;
      normalizedItem.cart_item_key = item.cart_item_key
        || createCartItemKey(item.id, item.selectedAttributes);
    } else if (item.cart_item_key) {
      normalizedItem.cart_item_key = item.cart_item_key;
    }

    return normalizedItem;
  });
