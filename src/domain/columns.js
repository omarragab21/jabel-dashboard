// Which columns of a table are hidden ("الأعمدة" picker). A choice is a list of column positions (0-based) and is
// remembered per table in the browser, together with the number of columns it was made for, so a table that gained
// or lost a column never hides the wrong one.

const PREFIX = 'admin.columns.';

/** Adds or removes `index` from the hidden list (hidden = !shown). Returns a new sorted list. */
export const toggleColumn = (hidden = [], index, shown) => {
  const rest = hidden.filter((value) => value !== index);
  return (shown ? rest : [...rest, index]).sort((a, b) => a - b);
};

/** Titled columns still visible (icon-only columns have no title and always stay). */
export const visibleLabeledCount = (headers = [], hidden = []) => headers.filter((header) => header.label && !hidden.includes(header.index)).length;

/**
 * CSS that hides the given columns of the table marked data-col-key="<key>": the header cell and the matching cell of
 * every row. Cells with a colspan (empty / loading / detail rows) are left alone.
 */
export const columnRules = (key, hidden = []) => {
  const table = `table[data-col-key="${String(key).replace(/["\\]/g, '')}"]`;
  return hidden
    .filter((index) => Number.isInteger(index) && index >= 0)
    .map((index) => `${table} > thead > tr > :nth-child(${index + 1}), ${table} > tbody > tr > :nth-child(${index + 1}):not([colspan]) { display: none !important; }`)
    .join('\n');
};

const store = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

export const saveHiddenColumns = (key, hidden, count) => {
  const storage = store();
  if (!storage) return;
  try {
    if (!hidden.length) storage.removeItem(PREFIX + key);
    else storage.setItem(PREFIX + key, JSON.stringify({ count, hidden }));
  } catch { /* storage full or blocked: the choice just is not remembered */ }
};

export const loadHiddenColumns = (key, count) => {
  const storage = store();
  if (!storage) return [];
  try {
    const saved = JSON.parse(storage.getItem(PREFIX + key) || 'null');
    if (!saved || saved.count !== count || !Array.isArray(saved.hidden)) return [];
    return saved.hidden.filter((index) => Number.isInteger(index) && index >= 0 && index < count);
  } catch { return []; }
};
