import tijaraAdminApi from '../infrastructure/api/tijaraAdminApi';
import { dataFromResponse, listFromResponse } from '../domain/catalog/adminCatalog';
import { toOrder, toStatusPayload } from '../domain/orders/adminOrder';

const MAX_PAGES = 50;

export const adminOrderService = {
  // The endpoint is fixed at 20 per page and ignores per_page; OrdersView
  // filters and counts client-side, so collect every page.
  listOrders: async (params = {}) => {
    const first = await tijaraAdminApi.listOrders({ ...params, page: 1 });
    const items = [...listFromResponse(first.data)];
    const lastPage = Math.min(Number(first.data?.meta?.last_page) || 1, MAX_PAGES);
    for (let page = 2; page <= lastPage; page += 1) {
      const next = await tijaraAdminApi.listOrders({ ...params, page });
      items.push(...listFromResponse(next.data));
    }
    return items.map(toOrder);
  },
  countOrders: (params = {}) => tijaraAdminApi.listOrders(params).then((response) => Number(response.data?.meta?.total) || 0),
  getOrder: (id) => tijaraAdminApi.getOrder(id).then((response) => toOrder(dataFromResponse(response.data))),
  updateStatus: async (order, status, reason = '') => {
    const payload = toStatusPayload(order.status, status, reason, order.rawNotes ?? '');
    const response = await tijaraAdminApi.updateOrder(order.id, payload);
    return toOrder(dataFromResponse(response.data));
  },
  deleteOrder: async (id) => {
    if (id === undefined || id === null || id === '') throw new Error('رقم الطلب غير موجود');
    return tijaraAdminApi.deleteOrder(id);
  },
};

export default adminOrderService;
