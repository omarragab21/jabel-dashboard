import tijaraAdminApi from '../infrastructure/api/tijaraAdminApi';
import { adminCatalogService } from './adminCatalogService';
import { toAdjustPayload, toMovementReport } from '../domain/inventory/inventory';
import { visibleProducts } from '../utils/catalogVisibility';

export const adminInventoryService = {
  // Every product in either state, so the counters cover the whole catalog.
  listStock: async () => visibleProducts(await adminCatalogService.listAllProducts({ include_inactive: 1, show_all: 1 })),
  getProduct: (id) => adminCatalogService.getProduct(id),
  listMovements: (query) => tijaraAdminApi.listStockMovements(query).then((response) => toMovementReport(response.data)),
  productMovements: (id, query) => tijaraAdminApi.productStockMovements(id, query).then((response) => toMovementReport(response.data)),
  adjustStock: (id, form) => tijaraAdminApi.adjustStock(id, toAdjustPayload(form)).then((response) => ({
    stock: Number(response.data?.data?.current_stock),
    message: response.data?.message || '',
  })),
};
