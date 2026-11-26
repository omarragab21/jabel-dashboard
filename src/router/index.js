import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import AppLayout from '../components/AppLayout.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { trackPageView } from '../utils/metaPixel.js';
import { setRouter } from '../config/axios.js';
import { hasValidAdminSession } from '../utils/adminSecurity.js';
import { editorRoutes } from '../composables/useEditorRoute.js';

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
      ...editorRoutes('categories', 'Categories', () => import('../views/CategoriesView.vue')),
      // DISABLED until the backend ships this API (staging answers 404 and it is not in the Postman collection).
      // The page code is kept; uncomment the route to bring it back.
      // ...editorRoutes('brands', 'Brands', () => import('../views/BrandsView.vue')),
      // Attributes: the attribute form and the value form each have their own page.
      ...(() => {
        const attributesView = () => import('../views/AttributesView.vue');
        const meta = { pagePath: '/admin/attributes' };
        return [
          ...editorRoutes('attributes', 'Attributes', attributesView),
          { path: 'attributes/values/new', name: 'AttributeValueNew', component: attributesView, meta },
          { path: 'attributes/values/:id/edit', name: 'AttributeValueEdit', component: attributesView, meta },
        ];
      })(),
      // The add / edit pages are views of the products screen with their own URL (refresh keeps you on them).
      { path: 'products', name: 'Products', component: () => import('../views/ProductsView.vue'), meta: { pagePath: '/admin/products' } },
      { path: 'products/new', name: 'ProductNew', component: () => import('../views/ProductsView.vue'), meta: { pagePath: '/admin/products' } },
      { path: 'products/:id/edit', name: 'ProductEdit', component: () => import('../views/ProductsView.vue'), meta: { pagePath: '/admin/products' } },
      // Every add / edit form has its own page: <list>/new and <list>/:id/edit (see useEditorRoute).
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
      ...editorRoutes('discounts', 'DiscountCodes', () => import('../views/DiscountsView.vue'), { view: true }),
      ...editorRoutes('offers', 'Offers', () => import('../views/OfferManagementView.vue')),
      { path: 'promotions', redirect: '/admin/offers' },
      { path: 'payments', name: 'Payments', component: () => import('../views/PaymentsView.vue') },
      // Removed/unfinished pages (collector, driver notifications, bundles, dynamic pages, articles)
      // intentionally have no route: opening them directly falls through to the not-found page.
      { path: 'messages', name: 'Messages', component: () => import('../views/MessagesView.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('../views/InventoryView.vue') },
      { path: 'inventory/:id', name: 'InventoryProduct', component: () => import('../views/InventoryProductView.vue') },
      ...editorRoutes('admins', 'Admins', () => import('../views/AdminsView.vue')),
      { path: 'profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
      ...editorRoutes('sliders', 'Sliders', () => import('../views/SlidersView.vue')),
      ...editorRoutes('branches', 'Branches', () => import('../views/BranchesView.vue')),
      ...editorRoutes('topics', 'Topics', () => import('../views/TopicsView.vue')),
      ...editorRoutes('permissions', 'Permissions', () => import('../views/PermissionsView.vue')),
      { path: 'financial-reports', name: 'FinancialReports', component: () => import('../views/FinancialReportsView.vue') },
      { path: 'accounts', redirect: '/admin/financial-reports' },
      // DISABLED until the backend ships this API (staging answers 404 and it is not in the Postman collection).
      // The page code is kept; uncomment the route to bring it back.
      // ...editorRoutes('countries', 'Countries', () => import('../views/CountriesView.vue')),
      ...editorRoutes('cities', 'Cities', () => import('../views/CitiesView.vue')),
      ...editorRoutes('areas', 'Areas', () => import('../views/AreasView.vue')),
      /* DISABLED until the backend ships this API (staging answers 404 and it is not in the Postman collection).
      The page code is kept; uncomment the route to bring it back.
      ...(() => {
        const shippingRatesView = () => import('../views/CityShippingRatesView.vue');
        return [
          ...editorRoutes('city-shipping-rates', 'CityShippingRates', shippingRatesView),
          { path: 'city-shipping-rates/bulk', name: 'CityShippingRatesBulk', component: shippingRatesView, meta: { pagePath: '/admin/city-shipping-rates' } },
        ];
      })(),
      */
      { path: 'activity-log', name: 'ActivityLog', component: () => import('../views/ActivityLogsView.vue') },
      { path: 'settings', redirect: '/admin/settings/general' },
      // Each settings page edits one group of settings; SettingsView reads the group from the route.
      ...['general', 'homepage', 'producttabs', 'commerce', 'contact', 'location', 'branding', 'seo', 'newsbar', 'about', 'status', 'preview'].map((section) => ({
        path: `settings/${section}`,
        name: `Settings-${section}`,
        component: () => import('../views/SettingsView.vue'),
        meta: { settingsSection: section },
      })),
      // Privacy policy and terms live in Firebase until the backend exposes them.
      { path: 'settings/privacy', name: 'Settings-privacy', component: () => import('../views/LegalPageView.vue'), meta: { legalPage: 'privacy' } },
      { path: 'settings/terms', name: 'Settings-terms', component: () => import('../views/LegalPageView.vue'), meta: { legalPage: 'terms' } },
      { path: 'settings/returns', name: 'Settings-returns', component: () => import('../views/LegalPageView.vue'), meta: { legalPage: 'returns' } },
      { path: 'settings/faq', name: 'Settings-faq', component: () => import('../views/LegalPageView.vue'), meta: { legalPage: 'faq' } },
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
