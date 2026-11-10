import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import AppLayout from '../components/AppLayout.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { trackPageView } from '../utils/metaPixel.js';
import { setRouter } from '../config/axios.js';
import { hasValidAdminSession } from '../utils/adminSecurity.js';

const routes = [
  { path: '/', redirect: '/admin/dashboard' },
  { path: '/admin/login', name: 'Login', component: LoginView },
  {
    path: '/admin',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'categories', name: 'Categories', component: () => import('../views/CategoriesView.vue') },
      { path: 'brands', name: 'Brands', component: () => import('../views/BrandsView.vue') },
      { path: 'attributes', name: 'Attributes', component: () => import('../views/AttributesView.vue') },
      { path: 'products', name: 'Products', component: () => import('../views/ProductsView.vue') },
      { path: 'integrations', name: 'Integrations', component: () => import('../views/DataFeedsView.vue') },
      { path: 'data-feeds', redirect: '/admin/integrations' },
      { path: 'orders', name: 'Orders', component: () => import('../views/OrdersView.vue') },
      { path: 'returns', name: 'Returns', component: () => import('../views/ReturnsView.vue') },
      { path: 'returns/:id', name: 'ReturnDetail', component: () => import('../views/ReturnDetailView.vue') },
      { path: 'reviews', name: 'Reviews', component: () => import('../views/ReviewsView.vue') },
      { path: 'customers', name: 'Customers', component: () => import('../views/CustomersView.vue') },
      { path: 'customers/:id', name: 'CustomerDetail', component: () => import('../views/CustomerDetailView.vue') },
      // Keep the old URL as a compatibility redirect, but use the Tijara
      // discount-codes screen/API as the single Admin destination.
      { path: 'coupons', redirect: '/admin/discounts' },
      { path: 'discounts', name: 'DiscountCodes', component: () => import('../views/DiscountsView.vue') },
      { path: 'offers', name: 'Offers', component: () => import('../views/OfferManagementView.vue') },
      { path: 'promotions', redirect: '/admin/offers' },
      { path: 'payments', name: 'Payments', component: () => import('../views/PaymentsView.vue') },
      // Removed/unfinished pages (collector, driver notifications, bundles, dynamic pages, articles)
      // intentionally have no route: opening them directly falls through to the not-found page.
      { path: 'messages', name: 'Messages', component: () => import('../views/MessagesView.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('../views/InventoryView.vue') },
      { path: 'inventory/:id', name: 'InventoryProduct', component: () => import('../views/InventoryProductView.vue') },
      { path: 'admins', name: 'Admins', component: () => import('../views/AdminsView.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
      { path: 'sliders', name: 'Sliders', component: () => import('../views/SlidersView.vue') },
      { path: 'branches', name: 'Branches', component: () => import('../views/BranchesView.vue') },
      { path: 'topics', name: 'Topics', component: () => import('../views/TopicsView.vue') },
      { path: 'permissions', name: 'Permissions', component: () => import('../views/PermissionsView.vue') },
      { path: 'financial-reports', name: 'FinancialReports', component: () => import('../views/FinancialReportsView.vue') },
      { path: 'accounts', redirect: '/admin/financial-reports' },
      { path: 'countries', name: 'Countries', component: () => import('../views/CountriesView.vue') },
      { path: 'cities', name: 'Cities', component: () => import('../views/CitiesView.vue') },
      { path: 'city-shipping-rates', name: 'CityShippingRates', component: () => import('../views/CityShippingRatesView.vue') },
      { path: 'activity-log', name: 'ActivityLog', component: () => import('../views/ActivityLogsView.vue') },
      { path: 'settings', redirect: '/admin/settings/general' },
      // Each settings page edits one group of settings; SettingsView reads the group from the route.
      ...['general', 'homepage', 'producttabs', 'commerce', 'contact', 'location', 'branding', 'newsbar', 'about', 'preview'].map((section) => ({
        path: `settings/${section}`,
        name: `Settings-${section}`,
        component: () => import('../views/SettingsView.vue'),
        meta: { settingsSection: section },
      })),
      // Privacy policy and terms live in Firebase until the backend exposes them.
      { path: 'settings/privacy', name: 'Settings-privacy', component: () => import('../views/LegalPageView.vue'), meta: { legalPage: 'privacy' } },
      { path: 'settings/terms', name: 'Settings-terms', component: () => import('../views/LegalPageView.vue'), meta: { legalPage: 'terms' } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'AdminNotFound', component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0, behavior: 'smooth' };
  },
});

setRouter(router);
if (import.meta.env?.DEV && typeof window !== 'undefined') window.__appRouter = router;

router.beforeEach((to, from, next) => {
  const isAdminAuthenticated = hasValidAdminSession();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (requiresAuth && !isAdminAuthenticated) next('/admin/login');
  else if (to.name === 'Login' && isAdminAuthenticated) next('/admin/dashboard');
  else next();
});

router.afterEach((to) => {
  trackPageView({
    page_path: to.fullPath,
    page_title: to.name ? String(to.name) : document.title,
  });
});

export default router;
