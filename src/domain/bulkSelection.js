// Pure helpers behind the table checkboxes and the bulk-action bar (no Vue, so they are easy to test).

/** Ids from `anchor` to `target` (both included) in the order the rows are shown; [] when either is not shown. */
export const rangeIds = (order = [], anchor, target) => {
  const from = order.indexOf(anchor);
  const to = order.indexOf(target);
  if (from < 0 || to < 0) return [];
  const [start, end] = from <= to ? [from, to] : [to, from];
  return order.slice(start, end + 1);
};

/** State of the "select all" box for the rows on screen: 'none' | 'some' | 'all'. */
export const headerState = (visibleIds = [], selected = new Set()) => {
  if (!visibleIds.length || !selected.size) return 'none';
  let count = 0;
  for (const id of visibleIds) if (selected.has(id)) count += 1;
  if (!count) return 'none';
  return count === visibleIds.length ? 'all' : 'some';
};

/**
 * Runs `worker(item)` for every item with at most `concurrency` requests in flight, so a bulk action on 200 rows does
 * not fire 200 requests at once nor wait for them one by one. Never throws: returns which items worked and which failed.
 */
export const runInBatches = async (items = [], worker, { concurrency = 4, onProgress } = {}) => {
  const done = [];
  const failed = [];
  let next = 0;
  let finished = 0;
  const lane = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      try {
        await worker(item);
        done.push(item);
      } catch (error) {
        failed.push({ item, error });
      }
      finished += 1;
      if (onProgress) onProgress(finished, items.length);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, lane));
  return { done, failed };
};

const cleanCell = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/** CSV text (with a BOM so Excel reads Arabic correctly). */
export const toCsv = (rows = []) => {
  const quote = (value) => {
    const text = cleanCell(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `\uFEFF${rows.map((row) => row.map(quote).join(',')).join('\r\n')}`;
};

/** Tab-separated text: pastes straight into Excel / Google Sheets as a table. */
export const toTsv = (rows = []) => rows.map((row) => row.map((value) => cleanCell(value).replace(/\t/g, ' ')).join('\t')).join('\n');

/** Short reason for a failed item, taken from the server answer when it has one. */
export const failureReason = (error) => {
  const data = error?.response?.data;
  const text = (typeof data?.message === 'string' && data.message)
    || (data?.errors && Object.values(data.errors).flat().find((value) => typeof value === 'string'))
    || error?.message
    || '';
  return cleanCell(text).slice(0, 160);
};
