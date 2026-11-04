import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { settingsService } from '../services/settingsService';
import { API_TTL } from '../services/apiClient';

export const defaultSettings = {
  site_name: 'ماسترجاز | Mastergas',
  logo: '/brand/tijara-logo-full.png',
  footer_logo: '/brand/tijara-logo-full.png',
  favicon: '/brand/tijara-logo.png',
  currency: 'JOD',
  currency_ar: 'د.أ',
  currency_en: 'JOD',
  free_delivery_threshold: 500,
  shipping_cost: 25,
  tax_rate: 15,
  support_phone: '+966500000000',
  support_email: 'info@mastergas.com.sa',
  address_ar: 'المملكة العربية السعودية',
  address_en: 'Saudi Arabia',
};

const settings = ref(null);
const loading = ref(false);
let fetchPromise = null;
let fetchedAt = 0;

const isIrisAsset = (value) => {
  if (!value) return false;
  const text = String(value).toLowerCase();
  return ['iris', 't3jcwn2n2rvkxvcva', 'dobvpg934hatbpm5', 'yugdc4mk4vmsf6el'].some((token) => text.includes(token));
};

const normalizeSettings = (data) => {
  const settingsObj = { ...defaultSettings };
  const entries = Array.isArray(data)
    ? data
    : Object.entries(data || {}).map(([key, value]) => ({ key, value }));

  entries.forEach((setting) => {
    if (!setting?.key) return;
    let value = setting.value;
    if (['logo', 'footer_logo', 'favicon', 'site_name', 'site_title'].includes(setting.key) && isIrisAsset(value)) {
      value = setting.key === 'footer_logo' ? defaultSettings.footer_logo : setting.key === 'site_name' || setting.key === 'site_title' ? defaultSettings.site_name : defaultSettings.logo;
    }
    settingsObj[setting.key] = value;
  });
  if (settingsObj.social_links && typeof settingsObj.social_links === 'object') {
    Object.assign(settingsObj, settingsObj.social_links);
  }
  if (settingsObj.default_shipping_cost !== undefined) {
    settingsObj.shipping_cost = settingsObj.default_shipping_cost;
  }
  if (settingsObj.vat_percentage !== undefined) {
    // vat_percentage is already a percentage (14 = 14%), as the backend applies it.
    const vat = Number(settingsObj.vat_percentage);
    settingsObj.tax_rate = Number.isFinite(vat) ? vat : settingsObj.tax_rate;
  }
  if (settingsObj.site_contact_phone !== undefined) {
    settingsObj.support_phone = settingsObj.site_contact_phone;
  }
  return settingsObj;
};

export function useSettings() {
  const { locale } = useI18n();

  const fetchSettings = async (options = {}) => {
    const fresh = settings.value && Date.now() - fetchedAt < (options.ttl ?? API_TTL.settings);
    if (fresh && !options.force) return settings.value;
    if (fetchPromise) return fetchPromise;

    loading.value = true;
    fetchPromise = settingsService.getSettings(options)
      .then((data) => {
        settings.value = normalizeSettings(data);
        fetchedAt = Date.now();
        return settings.value;
      })
      .catch((error) => {
        if (!settings.value) settings.value = { ...defaultSettings };
        return settings.value;
      })
      .finally(() => {
        loading.value = false;
        fetchPromise = null;
      });
    return fetchPromise;
  };

  const currency = computed(() => {
    // Follows the dashboard language: «د.أ» in Arabic, «JOD» in English.
    return locale.value === 'en' ? 'JOD' : 'د.أ';
  });

  const getSetting = (key, defaultValue = null) => settings.value?.[key] ?? defaultSettings[key] ?? defaultValue;

  return { settings, loading, fetchSettings, currency, getSetting };
}
