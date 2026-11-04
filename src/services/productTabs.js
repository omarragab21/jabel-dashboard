// The product page tabs saved in the settings API (key `product_tabs`), read by the product form
// so its field names match the tab names set in Settings > Product details.
import { settingsService } from './settingsService';
import { PRODUCT_TABS_KEY } from '../domain/productTabs';

// The raw saved value, or null when nothing is saved yet.
export const loadSavedProductTabs = async () => {
  const rows = await settingsService.getAdminSettings();
  const list = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
  return list.find((row) => row?.key === PRODUCT_TABS_KEY)?.value ?? null;
};
