import { reactive } from 'vue';

// Admin screens are kept alive after the first visit, so their data is loaded
// once per session instead of on every tab click. This counter says when that
// data may be out of date: it moves forward after any successful write and
// when the admin presses "refresh" or switches language.
export const freshness = reactive({ version: 0 });

export const markDataChanged = () => {
  freshness.version += 1;
  return freshness.version;
};

const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Requests that never change catalogue/order data.
const NON_DATA_PATHS = /^\/(v1\/(admin\/)?(login|logout|register)|frontend\/|v1\/site\/)/;

export const isDataWrite = (config = {}) => {
  const method = String(config.method || 'get').toLowerCase();
  if (!WRITE_METHODS.has(method)) return false;
  const path = String(config.url || '').split('?')[0].replace(/^\/api/, '');
  return !NON_DATA_PATHS.test(path);
};
