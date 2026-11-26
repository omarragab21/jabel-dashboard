import tijaraAdminApi from '../infrastructure/api/tijaraAdminApi';
import { createLocationService } from './createLocationService';

export const locationService = createLocationService(tijaraAdminApi);
export default locationService;
