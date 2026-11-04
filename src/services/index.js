export { orderService } from './orderService';
export { authService } from './authService';
export { settingsService } from './settingsService';
export { adminCatalogService } from '../application/adminCatalogService';
export { adminOrderService } from '../application/adminOrderService';
export { adminManagementService } from '../application/adminManagementService';
export {
  API_TTL,
  clearApiCache,
  createRequestKey,
  getCached,
  getCacheState,
  getStaleCached,
  invalidateCache,
  parseCollectionResponse,
  parseDataResponse,
} from './apiClient';

export default {
  order: () => import('./orderService').then(m => m.orderService),
  auth: () => import('./authService').then(m => m.authService),
  settings: () => import('./settingsService').then(m => m.settingsService),
  adminManagement: () => import('../application/adminManagementService').then(m => m.adminManagementService),
};
