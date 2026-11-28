import tijaraAdminApi from '../infrastructure/api/tijaraAdminApi.js';
import { createNewsLineService, createSiteImageService } from './createNewsLineService.js';

export const newsLineService = createNewsLineService(tijaraAdminApi);
export const siteImageService = createSiteImageService(tijaraAdminApi);
export default newsLineService;
