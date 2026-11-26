// Building a product's variants from its attributes (the "add product" flow of the dashboard).
//
// The API models a product as one or more purchasable variants (SKUs). Each variant has its own price, stock,
// pictures and `option_ids` (one option per attribute, e.g. Colour: Red + Size: M). Instead of adding the variants
// one by one, the admin picks the attributes and the values of each (Colour: 1, 2, 3 · Size: S, M) and every
// combination becomes a variant row: 3 × 2 = 6 rows to price and stock.
//
//   groups: [{ attributeId, name, options: [{ id, label, color? }] }]   the chosen values per attribute, in order
//   row:    { key, optionIds, options, price, number, is_active, files }  one variant to create
//
// Everything here is pure (no Vue, no requests) so it can be tested on its own.
import { variantPayload } from './productVariants.js';

// The API has no limit, but a form with hundreds of rows cannot be reviewed; the admin narrows the values instead.
export const MAX_VARIANTS = 100;

const isFilled = (value) => value !== '' && value !== null && value !== undefined;

/** Stable identity of a combination: its option ids, sorted ("4-17"). Survives re-ordering of the attributes. */
export const variantKey = (optionIds = []) => [...optionIds].map(Number).sort((a, b) => a - b).join('-');

/** Only the attributes that have at least one chosen value take part in the combinations. */
export const activeGroups = (groups = []) => groups.filter((group) => Array.isArray(group?.options) && group.options.length > 0);

/** How many variants the chosen values make: the product of the number of values of each attribute. */
export const combinationCount = (groups = []) => {
  const active = activeGroups(groups);
  if (!active.length) return 0;
  return active.reduce((total, group) => total * group.options.length, 1);
};

/** Every combination, one option from each attribute, as arrays of options (first attribute varies slowest). */
export const buildCombinations = (groups = []) => activeGroups(groups).reduce(
  (combos, group) => combos.flatMap((combo) => group.options.map((option) => [...combo, { ...option, attributeId: group.attributeId, attributeName: group.name }])),
  [[]],
).filter((combo) => combo.length > 0);

/**
 * The variant rows for the chosen values. A combination that already has a row keeps what the admin typed
 * (price, stock, active, pictures, and the id of a saved variant); a new one starts from `defaults`. A combination
 * the admin removed (`excluded` keys) stays removed. Exactly one row is the main variant: the previous main when
 * it is still there, otherwise the first.
 *
 * Rows of a variant that is already saved (they carry an `id`) are kept even when the values no longer generate
 * them if they are the main variant or `pinned` (it has no options, or an option the attributes list does not
 * know, so it cannot be generated): the admin never loses those by ticking another value. Un-ticking a value does
 * drop the other saved variants that used it; the save asks before deleting them.
 */
export const syncVariantRows = (groups, previousRows = [], { defaults = {}, excluded = [], archive = [] } = {}) => {
  const skipped = new Set(excluded);
  // `archive`: saved variants hidden for a moment (a value un-ticked): ticking it again brings the same variant
  // back (same id, stock and price), not a new one.
  const before = new Map([...archive, ...previousRows].map((row) => [row.key, row]));
  const fresh = buildCombinations(groups)
    .map((combo) => ({ combo, key: variantKey(combo.map((option) => option.id)) }))
    .filter(({ key }) => !skipped.has(key));
  const rows = fresh.map(({ combo, key }) => {
    const kept = before.get(key);
    const base = {
      key,
      optionIds: combo.map((option) => Number(option.id)),
      options: combo.map((option) => ({ id: option.id, label: option.label, color: option.color ?? null, attributeName: option.attributeName })),
    };
    if (kept) return { ...kept, ...base, is_active: kept.is_active !== false, files: kept.files || [], is_main: kept.is_main === true };
    return { ...base, price: defaults.price ?? '', number: defaults.number ?? '', is_active: true, files: [], is_main: false };
  });
  const made = new Set(rows.map((row) => row.key));
  previousRows
    .filter((row) => row.id != null && !made.has(row.key) && (row.is_main || row.pinned))
    .forEach((row) => rows.push(row));
  if (rows.length && !rows.some((row) => row.is_main)) rows[0] = { ...rows[0], is_main: true };
  // Never more than one main: keep the first that claims it.
  let seen = false;
  return rows.map((row) => {
    if (!row.is_main) return row;
    if (seen) return { ...row, is_main: false };
    seen = true;
    return row;
  });
};

/**
 * The builder state of a product that already has variants (editing). `variants` is the API list
 * ([{ id, price, number, is_main, is_active, attributes: { "<attribute>": [{ id, name }] }, images }]) and
 * `optionIndex` maps an option id to { attributeId, attributeName, label, color } (from the attributes list).
 * Returns { groups, rows, excluded, defaults }: the values in use per attribute, one row per saved variant, and the
 * combinations that do not exist (so they are not generated). A product whose variants carry no known option has
 * no builder rows: it is a simple product.
 */
export const stateFromVariants = (variants = [], optionIndex = new Map(), attributeOrder = []) => {
  const empty = { groups: [], rows: [], excluded: [], defaults: { price: '', number: '' } };
  const groupMap = new Map();
  const used = new Set();
  const rows = variants.map((variant) => {
    const raw = variant?.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes)
      ? Object.values(variant.attributes).flatMap((options) => (Array.isArray(options) ? options : []))
      : [];
    const options = raw.filter((option) => Number.isFinite(Number(option?.id))).map((option) => {
      const info = optionIndex.get(String(option.id));
      if (info) {
        const group = groupMap.get(String(info.attributeId)) || { attributeId: info.attributeId, name: info.attributeName, options: [] };
        if (!group.options.some((item) => String(item.id) === String(option.id))) group.options.push({ id: option.id, label: info.label, color: info.color ?? null });
        groupMap.set(String(info.attributeId), group);
      }
      return { id: option.id, label: info?.label ?? String(option.name ?? ''), color: info?.color ?? null, attributeName: info?.attributeName };
    });
    const optionIds = options.map((option) => Number(option.id));
    let key = variantKey(optionIds);
    if (!key || used.has(key)) key = `v${variant.id}`;
    used.add(key);
    const price = Number(variant.price);
    return {
      key,
      id: variant.id,
      optionIds,
      options,
      price: Number.isFinite(price) ? price : '',
      number: Number.isFinite(Number(variant.number)) ? Number(variant.number) : 0,
      is_active: variant.is_active !== false,
      is_main: variant.is_main === true,
      files: [],
      existing: true,
      pinned: !optionIds.length || options.some((option) => !optionIndex.has(String(option.id))),
      images: (variant.images || []).map((image) => (typeof image === 'string' ? image : image?.image_url || image?.url)).filter(Boolean),
      orig: { price: Number.isFinite(price) ? price : null, is_active: variant.is_active !== false, is_main: variant.is_main === true },
    };
  });
  if (!groupMap.size || !rows.length) return empty;
  if (!rows.some((row) => row.is_main)) rows[0].is_main = true;
  const order = new Map(attributeOrder.map((id, index) => [String(id), index]));
  const groups = [...groupMap.values()].sort((a, b) => (order.get(String(a.attributeId)) ?? 0) - (order.get(String(b.attributeId)) ?? 0));
  const existingKeys = new Set(rows.map((row) => row.key));
  const excluded = buildCombinations(groups).map((combo) => variantKey(combo.map((option) => option.id))).filter((key) => !existingKeys.has(key));
  return { ...empty, groups, rows, excluded };
};

/** "Red · M": the option names of a row. */
export const rowLabel = (row, separator = ' · ') => (row?.options || []).map((option) => option.label).filter(Boolean).join(separator);

/** The same value for every row (price for all, stock for all). */
export const applyToAll = (rows, field, value) => rows.map((row) => ({ ...row, [field]: value }));

/** Makes one row the main variant. */
export const setMainRow = (rows, key) => rows.map((row) => ({ ...row, is_main: row.key === key }));

/** Removes a row; the next one becomes the main when the main was removed. */
export const removeRow = (rows, key) => {
  const left = rows.filter((row) => row.key !== key);
  if (left.length && !left.some((row) => row.is_main)) left[0] = { ...left[0], is_main: true };
  return left;
};

/**
 * The first thing wrong with the rows, or null: { key, field: 'price' | 'number', code: 'price' | 'stock' }.
 * Every row needs a price (0 or more) and a whole-number stock (0 or more), whether or not it is active.
 */
export const validateVariantRows = (rows = []) => {
  for (const row of rows) {
    if (!isFilled(row.price) || !(Number(row.price) >= 0)) return { key: row.key, field: 'price', code: 'price' };
    if (!isFilled(row.number) || !Number.isInteger(Number(row.number)) || Number(row.number) < 0) return { key: row.key, field: 'number', code: 'stock' };
  }
  return null;
};

/** Totals for the summary card: how many variants, how many active, the stock, and the cheapest / dearest price. */
export const variantSummary = (rows = []) => {
  // A blank price is "not typed yet", not 0 (Number('') is 0), so it is checked before converting.
  const prices = rows.filter((row) => isFilled(row.price)).map((row) => Number(row.price)).filter(Number.isFinite);
  return {
    count: rows.length,
    active: rows.filter((row) => row.is_active !== false).length,
    stock: rows.reduce((sum, row) => sum + (Number.isFinite(Number(row.number)) ? Math.max(0, Math.floor(Number(row.number))) : 0), 0),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
  };
};

/** The option ids a variant is saved with: the product's shared specification options plus its own combination. */
export const rowOptionIds = (row, sharedIds = []) => [...new Set([...sharedIds, ...(row?.optionIds || [])].map(Number).filter(Number.isFinite))];

/**
 * What to send to the API for the rows: the main row goes into `POST /products` (price, number, option_ids, and the
 * product's pictures), every other row is added afterwards with `POST /products/{id}/variants`.
 * Returns { main: { price, number, option_ids }, others: [{ key, label, payload, files }] }.
 */
export const variantRequests = (rows = [], sharedIds = []) => {
  const main = rows.find((row) => row.is_main) || rows[0];
  if (!main) return { main: null, others: [] };
  const request = (row) => variantPayload(row, rowOptionIds(row, sharedIds));
  const { price, number, option_ids: optionIds } = request(main);
  return {
    main: { price, number, option_ids: optionIds },
    others: rows.filter((row) => row !== main).map((row) => ({ key: row.key, label: rowLabel(row), payload: request(row), files: row.files || [] })),
  };
};

/**
 * What saving an edited product has to do, from the builder rows:
 *   updates: saved variants whose price / status changed or that got pictures (not the anchor, see below)
 *   creates: new rows, added to the product
 *   deletes: ids of saved variants that are no longer in the rows
 *   newMainId: the saved variant the admin made the main one, when it was not before
 * `anchorId` is the product's own id (its main variant): it is saved with the product itself, so it is neither
 * updated nor deleted here. Stock of a saved variant is not changed here (that is "adjust stock").
 */
export const planEditChanges = (rows = [], { originalIds = [], anchorId = null, sharedIds = [] } = {}) => {
  const kept = new Set(rows.filter((row) => row.id != null).map((row) => String(row.id)));
  const deletes = originalIds.filter((id) => !kept.has(String(id)) && String(id) !== String(anchorId));
  const updates = rows
    .filter((row) => row.id != null && String(row.id) !== String(anchorId))
    .filter((row) => Number(row.price) !== row.orig?.price || (row.is_active !== false) !== row.orig?.is_active || (row.files || []).length > 0)
    .map((row) => ({ id: row.id, label: rowLabel(row), payload: { price: Number(row.price), is_active: row.is_active !== false }, files: row.files || [] }));
  const creates = rows
    .filter((row) => row.id == null)
    .map((row) => ({ key: row.key, label: rowLabel(row), payload: variantPayload(row, rowOptionIds(row, sharedIds)), files: row.files || [] }));
  const main = rows.find((row) => row.is_main);
  const newMainId = main && main.id != null && !main.orig?.is_main ? main.id : null;
  return { updates, creates, deletes, newMainId };
};
