import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_AR } from '../constants/currencies';

// The currency label follows the dashboard language: «ر.س» in Arabic, «SAR» in English.
export const useCurrencyLabel = () => {
  const { locale } = useI18n();
  const cur = computed(() => (locale.value === 'en' ? DEFAULT_CURRENCY : DEFAULT_CURRENCY_AR));
  return { cur };
};
