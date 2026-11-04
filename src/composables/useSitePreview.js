// «معاينة الموقع»: the address of the live website, set in Settings > Site preview and stored in the
// settings API as `site_preview_url`. The top bar button opens it in a new tab.
import { ref } from 'vue';
import { settingsService } from '../services/settingsService';

export const SITE_PREVIEW_KEY = 'site_preview_url';

const previewUrl = ref('');
let loaded = null;

/** A usable http(s) address, or '' ("mastergas.com" becomes "https://mastergas.com"). */
export const normalizePreviewUrl = (raw) => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') && url.hostname !== 'localhost') return '';
    return url.href;
  } catch {
    return '';
  }
};

const load = async () => {
  try {
    const rows = await settingsService.getAdminSettings();
    const list = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
    previewUrl.value = normalizePreviewUrl(list.find((row) => row?.key === SITE_PREVIEW_KEY)?.value);
  } catch {
    loaded = null; // try again next time
    // Without the settings the button sends the admin to the preview settings page.
  }
};

export function useSitePreview() {
  if (!loaded) loaded = load();
  return {
    previewUrl,
    // Called after the settings are saved, so the top bar uses the new address right away.
    setPreviewUrl: (raw) => { previewUrl.value = normalizePreviewUrl(raw); },
  };
}
