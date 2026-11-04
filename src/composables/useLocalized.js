import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const parseLocalized = (value) => {
  if (!value) return value;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' ? parsed : value;
  } catch {
    return value;
  }
};

const pickLocalized = (value, lang = 'ar') => {
  const parsed = parseLocalized(value);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed || '';
  }

  return parsed[lang] || parsed.ar || parsed.en || Object.values(parsed).find(Boolean) || '';
};

export function useLocalized() {
  const { locale } = useI18n();
  const currentLang = computed(() => locale.value || localStorage.getItem('lang') || 'ar');

  const localizedValue = (value) => pickLocalized(value, currentLang.value);

  const localized = (item, field) => {
    if (!item) return '';

    const i18nValue = item[`${field}_i18n`];
    if (i18nValue) return localizedValue(i18nValue);

    return localizedValue(item[field]);
  };

  return {
    currentLang,
    localized,
    localizedValue,
  };
}
