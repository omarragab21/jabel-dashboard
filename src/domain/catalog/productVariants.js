// A variant (SKU) as the dashboard reads and writes it (API: /v1/dashboard/products/{id}/variants).
//   read:  { id, price, discount_price, final_price, has_discount, number (stock), is_main, is_active,
//            attributes: { "<attribute>": [{ id, name, value_code }] }, images }
//   write: price, is_active, is_main, option_ids[] (+ number when it is created), images[]

/** "150 ml, Red": the option names of a variant. */
export const variantOptionsText = (variant) => Object.values(variant?.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes) ? variant.attributes : {})
  .flatMap((options) => (Array.isArray(options) ? options : []))
  .map((option) => String(option?.name ?? '').trim())
  .filter(Boolean)
  .join(', ');

/**
 * { [attribute name]: option id | '' } for the edit form, matched by option id against the attributes list
 * ([{ name, values: [{ id }] }]), so it works in either language.
 */
export const variantSelection = (variant, attributes = []) => {
  const chosen = new Set(Object.values(variant?.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes) ? variant.attributes : {})
    .flatMap((options) => (Array.isArray(options) ? options : []))
    .map((option) => String(option?.id)));
  return Object.fromEntries(attributes.map((attribute) => [
    attribute.name,
    (attribute.values || []).find((value) => chosen.has(String(value.id)))?.id ?? '',
  ]));
};

/** The chosen option ids (empty choices skipped). */
export const optionIdsFromSelection = (selection = {}) => Object.values(selection)
  .filter((id) => id !== '' && id !== null && id !== undefined)
  .map(Number)
  .filter(Number.isFinite);

/** The request fields of the variant form. A new variant also sends its stock (`number`). */
export const variantPayload = (form, optionIds) => ({
  price: Number(form.price),
  is_active: form.is_active !== false,
  ...(form.id ? { is_main: form.is_main === true } : { number: Math.max(0, Math.floor(Number(form.number) || 0)) }),
  option_ids: optionIds,
});
