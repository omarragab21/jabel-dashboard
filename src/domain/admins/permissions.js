// إدارة الصلاحيات: which dashboard modules an administrator can open and what they can do in each one.
//
// A permission set is { [moduleKey]: ['read', 'create', 'update', 'delete'] } (only the actions that are allowed;
// a module with no action is simply absent). It is sent to the API next to `role`, and the sidebar / router will
// read the same shape later to show or hide each module for the signed-in admin.
//
// Rules the editor keeps:
//   - `read` is the gate: create / update / delete without `read` make no sense, so ticking one ticks `read`
//     and clearing `read` clears the rest of that module.
//   - A module only offers the actions it really has (the dashboard is read-only, a settings page is read + update ...).

export const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'];

export const ACTION_LABELS = {
  read: ['عرض', 'Read'],
  create: ['إضافة', 'Create'],
  update: ['تعديل', 'Update'],
  delete: ['حذف', 'Delete'],
};

const FULL = PERMISSION_ACTIONS;
const READ_ONLY = ['read'];
const READ_UPDATE = ['read', 'update'];

// Same order and grouping as the sidebar. `route` is where the module lives, for the routing step later.
export const PERMISSION_GROUPS = [
  {
    key: 'overview',
    label: ['نظرة عامة', 'Overview'],
    modules: [
      { key: 'dashboard', route: '/admin/dashboard', label: ['لوحة القيادة', 'Dashboard'], actions: READ_ONLY },
    ],
  },
  {
    key: 'catalog',
    label: ['الكتالوج والمخزون', 'Catalog & inventory'],
    modules: [
      { key: 'categories', route: '/admin/categories', label: ['أقسام المنتجات', 'Product categories'], actions: FULL },
      { key: 'products', route: '/admin/products', label: ['المنتجات', 'Products'], actions: FULL },
      { key: 'attributes', route: '/admin/attributes', label: ['خصائص المنتجات', 'Product attributes'], actions: FULL },
      { key: 'inventory', route: '/admin/inventory', label: ['إدارة المخزون', 'Inventory'], actions: FULL },
    ],
  },
  {
    key: 'sales',
    label: ['المبيعات والعملاء', 'Sales & customers'],
    modules: [
      { key: 'orders', route: '/admin/orders', label: ['الطلبات', 'Orders'], actions: FULL },
      { key: 'returns', route: '/admin/returns', label: ['المرتجعات', 'Returns'], actions: FULL },
      { key: 'reviews', route: '/admin/reviews', label: ['تقييمات المنتجات', 'Product reviews'], actions: FULL },
      { key: 'customers', route: '/admin/customers', label: ['العملاء', 'Customers'], actions: FULL },
      { key: 'messages', route: '/admin/messages', label: ['رسائل العملاء', 'Customer messages'], actions: FULL },
    ],
  },
  {
    key: 'marketing',
    label: ['التسويق', 'Marketing'],
    modules: [
      { key: 'discounts', route: '/admin/discounts', label: ['أكواد الخصم', 'Discount codes'], actions: FULL },
      { key: 'offers', route: '/admin/offers', label: ['إدارة العروض', 'Offers'], actions: FULL },
      { key: 'sliders', route: '/admin/sliders', label: ['البانرات الرئيسية', 'Homepage Banners'], actions: FULL },
    ],
  },
  {
    key: 'finance',
    label: ['المالية والتكاملات', 'Finance & integrations'],
    modules: [
      { key: 'financial_reports', route: '/admin/financial-reports', label: ['التقارير المالية', 'Financial reports'], actions: READ_ONLY },
      { key: 'integrations', route: '/admin/integrations', label: ['التكاملات', 'Integrations'], actions: READ_UPDATE },
    ],
  },
  {
    key: 'team',
    label: ['الفريق', 'Team'],
    modules: [
      { key: 'admins', route: '/admin/admins', label: ['المسؤولون', 'Administrators'], actions: FULL },
    ],
  },
  {
    key: 'settings',
    label: ['إعداد الموقع', 'Site setup'],
    modules: [
      { key: 'settings_general', route: '/admin/settings/general', label: ['بيانات الموقع', 'Site information'], actions: READ_UPDATE },
      { key: 'settings_homepage', route: '/admin/settings/homepage', label: ['الصفحة الرئيسية', 'Homepage'], actions: READ_UPDATE },
      { key: 'settings_producttabs', route: '/admin/settings/producttabs', label: ['تفاصيل المنتج', 'Product details'], actions: READ_UPDATE },
      { key: 'settings_commerce', route: '/admin/settings/commerce', label: ['الأسعار والشحن', 'Prices & shipping'], actions: READ_UPDATE },
      { key: 'settings_contact', route: '/admin/settings/contact', label: ['التواصل والبريد', 'Contact & email'], actions: READ_UPDATE },
      { key: 'settings_location', route: '/admin/settings/location', label: ['العنوان وساعات العمل', 'Address & working hours'], actions: READ_UPDATE },
      { key: 'settings_branding', route: '/admin/settings/branding', label: ['الهوية البصرية', 'Branding'], actions: READ_UPDATE },
      { key: 'settings_newsbar', route: '/admin/settings/newsbar', label: ['شريط الأخبار', 'News bar'], actions: READ_UPDATE },
      { key: 'settings_about', route: '/admin/settings/about', label: ['من نحن', 'About us'], actions: READ_UPDATE },
      { key: 'settings_status', route: '/admin/settings/status', label: ['حالة الموقع', 'Website status'], actions: READ_UPDATE },
      { key: 'settings_preview', route: '/admin/settings/preview', label: ['معاينة الموقع', 'Site preview'], actions: READ_ONLY },
      { key: 'settings_privacy', route: '/admin/settings/privacy', label: ['سياسة الخصوصية', 'Privacy policy'], actions: READ_UPDATE },
      { key: 'settings_terms', route: '/admin/settings/terms', label: ['الشروط والأحكام', 'Terms & conditions'], actions: READ_UPDATE },
      { key: 'settings_returns', route: '/admin/settings/returns', label: ['سياسة الإرجاع والاستبدال', 'Returns & exchange policy'], actions: READ_UPDATE },
      { key: 'settings_faq', route: '/admin/settings/faq', label: ['الأسئلة الشائعة', 'FAQ'], actions: READ_UPDATE },
    ],
  },
];

export const PERMISSION_MODULES = PERMISSION_GROUPS.flatMap((group) => group.modules.map((module) => ({ ...module, group: group.key })));
const MODULE_BY_KEY = Object.fromEntries(PERMISSION_MODULES.map((module) => [module.key, module]));

export const moduleLabel = (key, lang = 'ar') => {
  const pair = MODULE_BY_KEY[key]?.label;
  return pair ? pair[lang === 'ar' ? 0 : 1] : String(key);
};

/** Every module with every action it offers. */
export const allPermissions = () => Object.fromEntries(PERMISSION_MODULES.map((module) => [module.key, [...module.actions]]));

// ---- Roles --------------------------------------------------------------------------------------------------------
// Each role starts from a preset that the admin can still adjust. `custom` starts empty. `super_admin` always has
// everything (it is also the only role the API accepts today).

const preset = (spec) => Object.fromEntries(Object.entries(spec).map(([key, actions]) => [key, actions === 'all' ? [...MODULE_BY_KEY[key].actions] : actions]));

export const ROLE_PRESETS = {
  super_admin: allPermissions(),
  sales_manager: preset({
    dashboard: 'all', orders: ['read', 'create', 'update'], returns: ['read', 'update'], customers: ['read', 'update'],
    reviews: ['read', 'update'], messages: ['read', 'update'], products: ['read'], inventory: ['read'],
    discounts: ['read'], offers: ['read'], financial_reports: 'all',
  }),
  catalog_manager: preset({
    dashboard: 'all', categories: 'all', products: 'all', attributes: 'all', inventory: ['read', 'update'], reviews: ['read'],
  }),
  inventory_manager: preset({
    dashboard: 'all', products: ['read'], inventory: 'all', orders: ['read'], returns: ['read', 'update'],
  }),
  marketing_manager: preset({
    dashboard: 'all', discounts: 'all', offers: 'all', sliders: 'all', customers: ['read'], products: ['read'],
    settings_homepage: 'all', settings_newsbar: 'all', settings_about: 'all',
  }),
  customer_support: preset({
    dashboard: 'all', orders: ['read', 'update'], returns: ['read', 'update'], customers: ['read'],
    reviews: ['read', 'update', 'delete'], messages: 'all',
  }),
  accountant: preset({
    dashboard: 'all', financial_reports: 'all', orders: ['read'], returns: ['read'], customers: ['read'],
  }),
  custom: {},
};

export const ROLE_KEYS = Object.keys(ROLE_PRESETS);

export const ROLE_LABELS = {
  super_admin: ['أدمن', 'Admin'],
  sales_manager: ['مدير مبيعات', 'Sales manager'],
  catalog_manager: ['مدير المنتجات', 'Catalog manager'],
  inventory_manager: ['مدير المخزون', 'Inventory manager'],
  marketing_manager: ['مدير تسويق', 'Marketing manager'],
  customer_support: ['خدمة العملاء', 'Customer support'],
  accountant: ['محاسب', 'Accountant'],
  custom: ['مخصص', 'Custom'],
};

export const ROLE_DESCRIPTIONS = {
  super_admin: ['صلاحيات كاملة على كل الأقسام', 'Full access to every module'],
  sales_manager: ['الطلبات والمرتجعات والعملاء مع الاطلاع على المنتجات والتقارير', 'Orders, returns and customers, with view access to products and reports'],
  catalog_manager: ['الأقسام والمنتجات والخصائص والمخزون', 'Categories, products, attributes and stock'],
  inventory_manager: ['المخزون مع الاطلاع على المنتجات والطلبات', 'Stock, with view access to products and orders'],
  marketing_manager: ['الخصومات والعروض والبانرات وصفحات الموقع التسويقية', 'Discounts, offers, banners and the marketing pages of the site'],
  customer_support: ['الطلبات والمرتجعات والتقييمات ورسائل العملاء', 'Orders, returns, reviews and customer messages'],
  accountant: ['التقارير المالية مع الاطلاع على الطلبات', 'Financial reports, with view access to orders'],
  custom: ['اختر الصلاحيات بنفسك', 'Pick the permissions yourself'],
};

export const roleLabel = (role, lang = 'ar') => {
  const pair = ROLE_LABELS[String(role || '').toLowerCase()];
  return pair ? pair[lang === 'ar' ? 0 : 1] : String(role || '');
};

export const defaultPermissionsFor = (role) => normalizePermissions(ROLE_PRESETS[role] || {});

// ---- Normalising and editing ---------------------------------------------------------------------------------------

const orderedActions = (module, actions) => module.actions.filter((action) => actions.has(action));

/**
 * Any stored shape -> the canonical { module: [actions] }. Accepts that object, a list of "module.action" strings
 * or { module: { read: true, ... } }. Unknown modules / actions are dropped, `read` is added when another action
 * is present, and modules that end up with nothing are removed.
 */
export function normalizePermissions(value) {
  const sets = new Map();
  const add = (key, action) => {
    if (!MODULE_BY_KEY[key] || !MODULE_BY_KEY[key].actions.includes(action)) return;
    if (!sets.has(key)) sets.set(key, new Set());
    sets.get(key).add(action);
  };
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      const [key, action] = String(entry).split('.');
      add(key, action);
    });
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, actions]) => {
      if (Array.isArray(actions)) actions.forEach((action) => add(key, String(action)));
      else if (actions && typeof actions === 'object') Object.entries(actions).forEach(([action, on]) => { if (on === true || on === 1 || on === '1') add(key, action); });
    });
  }
  const result = {};
  PERMISSION_MODULES.forEach((module) => {
    const set = sets.get(module.key);
    if (!set || !set.size) return;
    if (module.actions.includes('read')) set.add('read');
    result[module.key] = orderedActions(module, set);
  });
  return result;
}

export const hasPermission = (permissions, key, action) => Boolean(permissions?.[key]?.includes(action));

/** Ticks / unticks one action, keeping `read` as the gate. Returns a new object. */
export function togglePermission(permissions, key, action, on) {
  const module = MODULE_BY_KEY[key];
  if (!module || !module.actions.includes(action)) return normalizePermissions(permissions);
  const set = new Set(permissions?.[key] || []);
  if (on) {
    set.add(action);
    if (module.actions.includes('read')) set.add('read');
  } else if (action === 'read') {
    set.clear();
  } else {
    set.delete(action);
  }
  const next = { ...normalizePermissions(permissions) };
  if (set.size) next[key] = orderedActions(module, set);
  else delete next[key];
  return next;
}

/** Ticks / unticks a whole module (every action it offers). */
export function toggleModule(permissions, key, on) {
  const module = MODULE_BY_KEY[key];
  const next = { ...normalizePermissions(permissions) };
  if (!module) return next;
  if (on) next[key] = [...module.actions];
  else delete next[key];
  return next;
}

/** Ticks / unticks every module of a group. */
export function toggleGroup(permissions, groupKey, on) {
  const group = PERMISSION_GROUPS.find((entry) => entry.key === groupKey);
  return (group?.modules || []).reduce((acc, module) => toggleModule(acc, module.key, on), normalizePermissions(permissions));
}

export const moduleState = (permissions, key) => {
  const module = MODULE_BY_KEY[key];
  const count = permissions?.[key]?.length || 0;
  if (!module || !count) return 'none';
  return count >= module.actions.length ? 'all' : 'some';
};

export const countModules = (permissions) => Object.keys(normalizePermissions(permissions)).length;

/** Same permission sets? (used to tell whether the admin changed the preset of the chosen role). */
export const samePermissions = (a, b) => JSON.stringify(normalizePermissions(a)) === JSON.stringify(normalizePermissions(b));

/** What the API receives: { module: [actions] } in a fixed order, super_admin always with everything. */
export const toPermissionsPayload = (role, permissions) => normalizePermissions(role === 'super_admin' ? allPermissions() : permissions);
