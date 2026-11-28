// News bar lines and site images, built on any object with the tijaraAdminApi calls (node tests pass a fake API).
import { dataFromResponse, listFromResponse } from '../domain/catalog/adminCatalog.js';
import { toNewsLine, toNewsLinePayload } from '../domain/newsLines.js';
import { toggledActive } from '../domain/locations.js';

export const PER_PAGE = 100;
export const MAX_PAGES = 50;

const listAll = async (request, mapper, params = {}) => {
  const first = await request({ per_page: PER_PAGE, ...params, page: 1 });
  const rows = [...listFromResponse(first?.data)];
  const lastPage = Math.min(Number(first?.data?.meta?.last_page) || 1, MAX_PAGES);
  for (let page = 2; page <= lastPage; page += 1) {
    const next = await request({ per_page: PER_PAGE, ...params, page });
    rows.push(...listFromResponse(next?.data));
  }
  const seen = new Set();
  return rows.map(mapper).filter((item) => {
    if (!item) return false;
    if (item.id !== null && seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const one = (request, mapper) => request.then((response) => {
  const data = dataFromResponse(response?.data);
  return data && typeof data === 'object' && !Array.isArray(data) ? mapper(data) : null;
});

export const toSiteImage = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? null,
    title: String(raw.title ?? raw.name ?? '').trim(),
    image_url: String(raw.image_url ?? raw.url ?? raw.image ?? '').trim(),
    created_at: raw.created_at || '',
  };
};

export const createNewsLineService = (api) => ({
  list: (params) => listAll(api.listNewsLines, toNewsLine, params),
  get: (id) => one(api.getNewsLine(id), toNewsLine),
  create: (form, image) => one(api.createNewsLine(toNewsLinePayload(form), image || undefined), toNewsLine),
  update: (id, form, image) => one(api.updateNewsLine(id, toNewsLinePayload(form), image || undefined), toNewsLine),
  remove: (id) => api.deleteNewsLine(id),
  // Resolves to the new is_active (the server's value when it sends one).
  toggle: (id, previous) => api.toggleNewsLineStatus(id).then((response) => toggledActive(response?.data, previous)),
});

export const createSiteImageService = (api) => ({
  list: (params) => listAll(api.listSiteImages, toSiteImage, params),
  get: (id) => one(api.getSiteImage(id), toSiteImage),
  update: (id, { title }, image) => one(api.updateSiteImage(id, { title: String(title || '').trim() || undefined }, image || undefined), toSiteImage),
  remove: (id) => api.deleteSiteImage(id),
});
