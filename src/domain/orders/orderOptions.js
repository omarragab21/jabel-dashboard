// Chosen product options travel with each order item, in `items[].description`:
//   { "choices": [ { "quantity": 1, "options": [ { "id": 119, "attribute": "اللون", "name": "أسود ملكي" } ] } ] }
// Older orders carry them in the notes:  [MG-OPTIONS]{"v":1,"items":[{"p":75,"q":1,"o":[119]}]}[/MG-OPTIONS]
// The notes otherwise hold the customer's text and, once cancelled, the reason ([MG-CANCEL]).
//
// Written by the website (website/src/domain/order/orderOptions.js); keep the
// format in sync. The dashboard only reads it.

const BLOCK = /\s*\[MG-OPTIONS\]([\s\S]*?)\[\/MG-OPTIONS\]\s*/;

/** Notes without the options block (what the customer actually wrote). */
export const stripOrderOptions = (notes) => String(notes ?? '').replace(BLOCK, '\n').replace(/\s*\[MG-CANCEL\][\s\S]*?\[\/MG-CANCEL\]\s*/, '\n').trim();

// A cancellation reason travels in the notes too, because the order API does not keep a
// `cancellation_reason` field:  [MG-CANCEL]why[/MG-CANCEL]
const CANCEL_OPEN = '[MG-CANCEL]';
const CANCEL_CLOSE = '[/MG-CANCEL]';
const CANCEL_BLOCK = /\s*\[MG-CANCEL\]([\s\S]*?)\[\/MG-CANCEL\]\s*/;
const NOTES_LIMIT = 1000;

/** The cancellation reason stored in an order's notes ('' when there is none). */
export const parseCancelReason = (notes) => {
  const match = String(notes ?? '').match(CANCEL_BLOCK);
  return match ? match[1].trim() : '';
};

/**
 * Notes with the cancellation reason added (or replaced). The customer's text is shortened first when the
 * API limit (1000 characters) is tight; the options block and the reason are kept.
 */
export const withCancelReason = (notes, reason) => {
  const cleanReason = String(reason ?? '').replace(/\[\/?MG-CANCEL\]/g, '').trim();
  const withoutCancel = String(notes ?? '').replace(CANCEL_BLOCK, '\n').trim();
  if (!cleanReason) return withoutCancel;
  const optionsMatch = withoutCancel.match(BLOCK);
  const optionsBlock = optionsMatch ? optionsMatch[0].trim() : '';
  let text = withoutCancel.replace(BLOCK, '\n').trim();
  const block = `${CANCEL_OPEN}${cleanReason}${CANCEL_CLOSE}`;
  const join = (customerText) => [customerText, optionsBlock, block].filter(Boolean).join('\n\n');
  let result = join(text);
  if (result.length > NOTES_LIMIT) {
    text = text.slice(0, Math.max(0, text.length - (result.length - NOTES_LIMIT))).trim();
    result = join(text);
  }
  return result.length > NOTES_LIMIT ? result.slice(0, NOTES_LIMIT - CANCEL_CLOSE.length) + CANCEL_CLOSE : result;
};

/** [{ p, q, o }] from an order's notes; [] when there is no valid block. */
export const parseOrderOptions = (notes) => {
  const match = String(notes ?? '').match(BLOCK);
  if (!match) return [];
  try {
    const data = JSON.parse(match[1]);
    return (Array.isArray(data?.items) ? data.items : [])
      .map((entry) => ({
        p: Number(entry?.p),
        q: Math.max(1, Math.floor(Number(entry?.q) || 1)),
        o: (Array.isArray(entry?.o) ? entry.o : []).map(Number).filter(Number.isFinite),
      }))
      .filter((entry) => Number.isFinite(entry.p) && entry.o.length);
  } catch {
    return [];
  }
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * The chosen options of one order item: [{ quantity, options: [{ id, group, name, hex }] }].
 * Read from the item's `description`; older orders fall back to the notes block (`entries`).
 * Names come from the product's options in the language the order was fetched in, else as stored.
 */
export const orderItemChoices = (orderItem, entries = [], lang = '') => {
  const productId = Number(orderItem?.product_id ?? orderItem?.product?.id);
  const productOptions = orderItem?.product?.options ?? orderItem?.options;
  const available = new Map(
    (Array.isArray(productOptions) ? productOptions : [])
      .map((option) => [Number(option.id), option]),
  );
  const resolve = (id, stored = {}) => {
    const option = available.get(Number(id));
    if (!option && !stored.name) return null;
    const code = String(option?.value_code ?? '');
    return {
      id: Number(id),
      group: String(option?.attribute?.translations?.[lang]?.name ?? option?.attribute_name ?? stored.attribute ?? ''),
      name: String(option?.translations?.[lang]?.name ?? option?.name ?? stored.name ?? ''),
      hex: option && (option.type === 'color_swatch' || HEX.test(code)) ? code : null,
    };
  };

  const described = orderItem?.description?.choices;
  if (Array.isArray(described)) {
    return described
      .map((choice) => ({
        quantity: Math.max(1, Math.floor(Number(choice?.quantity) || 1)),
        options: (Array.isArray(choice?.options) ? choice.options : []).map((option) => resolve(option?.id, option)).filter(Boolean),
      }))
      .filter((choice) => choice.options.length);
  }

  return entries
    .filter((entry) => entry.p === productId)
    .map((entry) => ({ quantity: entry.q, options: entry.o.map((id) => resolve(id)).filter(Boolean) }))
    .filter((choice) => choice.options.length);
};
