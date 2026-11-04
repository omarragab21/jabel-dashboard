import { useI18n } from 'vue-i18n';

/**
 * Small bilingual helper for the legacy admin views while they are migrated
 * from inline Arabic copy to the shared i18n catalog.
 */
export const useAdminText = () => {
  const { locale } = useI18n();
  const tx = (ar, en) => (locale.value === 'en' ? en : ar);
  return { locale, tx };
};
