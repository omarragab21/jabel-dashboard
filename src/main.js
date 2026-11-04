import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './style.css';
import App from './App.vue';
import router from './router/index.js';
import i18n from './i18n/index.js';
import { watch } from 'vue';
import { useTheme } from './composables/useTheme.js';

const { initTheme } = useTheme();
initTheme();

let lang = localStorage.getItem('lang');
if (!lang || (lang !== 'ar' && lang !== 'en')) {
  lang = 'ar';
  localStorage.setItem('lang', 'ar');
}
document.documentElement.lang = lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

// Browser tab title follows the dashboard language.
const TAB_TITLES = { ar: 'لوحة تحكم تجارة | Tijara', en: 'Tijara Dashboard | Tijara' };
watch(() => i18n.global.locale.value, (value) => {
  document.title = TAB_TITLES[value] || TAB_TITLES.ar;
}, { immediate: true });

const app = createApp(App);
app.use(i18n);
app.use(router);
app.mount('#app');
