// The cities / areas / branches service, built on any object with the tijaraAdminApi location calls
// (so node tests can pass a fake API). Lists walk every page: the API pages by 15 by default.
import { dataFromResponse, listFromResponse } from '../domain/catalog/adminCatalog.js';
import {
  toArea, toAreaPayload, toBranch, toBranchPayload, toCity, toCityPayload, toggledActive,
} from '../domain/locations.js';

export const PER_PAGE = 100;
export const MAX_PAGES = 50;

export const createLocationService = (api) => {
  const listAll = async (request, mapper, params = {}) => {
    const first = await request({ per_page: PER_PAGE, ...params, page: 1 });
    const rows = [...listFromResponse(first?.data)];
    const lastPage = Math.min(Number(first?.data?.meta?.last_page) || 1, MAX_PAGES);
    for (let page = 2; page <= lastPage; page += 1) {
      const next = await request({ per_page: PER_PAGE, ...params, page });
      rows.push(...listFromResponse(next?.data));
    }
    // The same row on two pages (a row added while paging) is kept once.
    const seen = new Set();
    const items = [];
    for (const item of rows.map(mapper)) {
      if (!item || (item.id !== null && seen.has(item.id))) continue;
      seen.add(item.id);
      items.push(item);
    }
    return items;
  };

  const one = (request, mapper) => request.then((response) => {
    const data = dataFromResponse(response?.data);
    return data && typeof data === 'object' && !Array.isArray(data) ? mapper(data) : null;
  });

  // Resolves to the new is_active (the server's value when it sends one).
  const toggle = (request, previous) => request.then((response) => toggledActive(response?.data, previous));

  return {
    listCities: (params) => listAll(api.listCities, toCity, params),
    getCity: (id) => one(api.getCity(id), toCity),
    createCity: (form) => one(api.createCity(toCityPayload(form)), toCity),
    updateCity: (id, form) => one(api.updateCity(id, toCityPayload(form)), toCity),
    deleteCity: (id) => api.deleteCity(id),
    toggleCity: (id, previous) => toggle(api.toggleCityStatus(id), previous),

    listAreas: (params) => listAll(api.listAreas, toArea, params),
    getArea: (id) => one(api.getArea(id), toArea),
    createArea: (form) => one(api.createArea(toAreaPayload(form)), toArea),
    updateArea: (id, form) => one(api.updateArea(id, toAreaPayload(form)), toArea),
    deleteArea: (id) => api.deleteArea(id),
    toggleArea: (id, previous) => toggle(api.toggleAreaStatus(id), previous),

    listBranches: (params) => listAll(api.listBranches, toBranch, params),
    getBranch: (id) => one(api.getBranch(id), toBranch),
    createBranch: (form) => one(api.createBranch(toBranchPayload(form)), toBranch),
    updateBranch: (id, form) => one(api.updateBranch(id, toBranchPayload(form)), toBranch),
    deleteBranch: (id) => api.deleteBranch(id),
    toggleBranch: (id, previous) => toggle(api.toggleBranchStatus(id), previous),
  };
};
