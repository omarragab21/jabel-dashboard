// Drag-and-drop ordering of a list (categories, offers, discount codes ...), the same idea as the homepage banners:
// every item has its own position 1..N in `sort_order`, and moving a row renumbers the rows around it.
//
// The pure parts live here so they can be tested without a browser.

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** True when at least one item carries a numeric `field` (the API stores an order at all). */
export const hasOrderField = (items = [], field = 'sort_order') => items.some((item) => item && item[field] !== undefined && item[field] !== null && item[field] !== '');

/**
 * The list ordered by `field`. Items keep the order they came in when they tie (so an API that sends no order, or
 * the same number everywhere, is shown exactly as it arrives). Pass `tieBy` to break ties another way.
 */
export const sortByOrder = (items = [], field = 'sort_order', tieBy = null) => [...items].sort((a, b) => num(a[field]) - num(b[field]) || (tieBy ? tieBy(a, b) : 0));

/** Moves item `movedId` next to item `targetId` (before it, or after it when `after`). Returns a new list. */
export const moveItem = (list = [], movedId, targetId, after = false) => {
  const moved = list.find((item) => String(item.id) === String(movedId));
  if (!moved || String(movedId) === String(targetId)) return [...list];
  const rest = list.filter((item) => item !== moved);
  const index = rest.findIndex((item) => String(item.id) === String(targetId));
  if (index < 0) return [...list];
  rest.splice(index + (after ? 1 : 0), 0, moved);
  return rest;
};

/** Rows whose stored `field` differs from their position 1..N in `list`: [{ item, position }]. */
export const positionChanges = (list = [], field = 'sort_order') => list
  .map((item, index) => ({ item, position: index + 1 }))
  .filter(({ item, position }) => num(item[field]) !== position || item[field] === undefined || item[field] === null || item[field] === '');

/**
 * Did the server keep the order? `expected` is the list in the order it was saved, `fetched` what the API returned
 * afterwards. False when the API sends no `field` at all (it does not support ordering) or the numbers differ.
 */
export const orderPersisted = (expected = [], fetched = [], field = 'sort_order') => {
  if (!hasOrderField(fetched, field)) return false;
  const byId = new Map(fetched.map((item) => [String(item.id), item]));
  return expected.every((item, index) => {
    const stored = byId.get(String(item.id));
    return stored ? num(stored[field]) === index + 1 : true;
  });
};

/**
 * Applies the new positions to the rows right away (so the table shows the new order at once) and returns a function
 * that puts every row back exactly as it was, for when the save fails.
 */
export const applyPositions = (changes = [], field = 'sort_order') => {
  const previous = changes.map(({ item }) => [item, item[field]]);
  changes.forEach(({ item, position }) => { item[field] = position; });
  return () => previous.forEach(([item, value]) => { item[field] = value; });
};
