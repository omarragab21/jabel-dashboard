<template>
  <div class="app-layout" :dir="currentLang === 'ar' ? 'rtl' : 'ltr'">
    <!-- Mobile Backdrop -->
    <div
      v-if="mobileSidebarOpen"
      class="sidebar-backdrop"
      @click="mobileSidebarOpen = false"
      aria-hidden="true"
    ></div>

    <!-- ===== SIDEBAR ===== -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': collapsed, 'mobile-open': mobileSidebarOpen }">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <img v-if="!collapsed" src="/brand/tijara-logo.svg" alt="Tijara" class="logo-img" />
          <img v-else src="/brand/tijara-icon-light.svg" alt="Tijara" class="logo-mark" />
        </div>
        <button
          class="mobile-close-btn"
          @click="mobileSidebarOpen = false"
          :aria-label="currentLang === 'en' ? 'Close menu' : 'إغلاق القائمة'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <template v-for="item in menuItems" :key="item.route || item.label">
          <!-- Single Link -->
          <router-link
            v-if="!item.children"
            :to="item.route"
            class="nav-item"
            :class="{ active: route.path === item.route || route.path.startsWith(item.route + '/') }"
            :aria-label="collapsed ? localizeMenuLabel(item.label) : undefined"
            @click="mobileSidebarOpen = false"
            @mouseenter="showTip($event, localizeMenuLabel(item.label))"
            @mouseleave="hideTip"
            @focus="showTip($event, localizeMenuLabel(item.label))"
            @blur="hideTip"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span class="nav-label" v-show="!collapsed">{{ localizeMenuLabel(item.label) }}</span>
            <span v-if="item.route === '/admin/orders' && !collapsed && ordersCount > 0" class="nav-badge">{{ ordersCount }}</span>
            <span v-if="item.route === '/admin/orders' && collapsed && ordersCount > 0" class="nav-badge-dot" aria-hidden="true"></span>
          </router-link>

          <!-- Dropdown Group -->
          <div v-else class="nav-group" :class="{ expanded: expandedGroup === item.label, active: isGroupActive(item) }">
            <button
              class="nav-group-header"
              :aria-label="collapsed ? localizeMenuLabel(item.label) : undefined"
              @click="toggleGroup(item.label)"
              @mouseenter="showTip($event, localizeMenuLabel(item.label))"
              @mouseleave="hideTip"
              @focus="showTip($event, localizeMenuLabel(item.label))"
              @blur="hideTip"
            >
              <span class="nav-icon" v-html="item.icon"></span>
              <span class="nav-label" v-show="!collapsed">{{ localizeMenuLabel(item.label) }}</span>
              <svg
                v-show="!collapsed"
                class="nav-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div v-show="expandedGroup === item.label && !collapsed" class="nav-group-children">
              <router-link
                v-for="child in item.children"
                :key="child.route"
                :to="child.route"
                class="nav-sub-item"
                :class="{ active: route.path === child.route || route.path.startsWith(child.route + '/') }"
                @click="mobileSidebarOpen = false"
              >
                <span v-if="child.icon" class="nav-sub-icon" v-html="child.icon"></span>
                <span class="nav-label">{{ localizeMenuLabel(child.label) }}</span>
              </router-link>
            </div>
          </div>
        </template>
      </nav>
    </aside>

    <!-- Name tooltip for the icon-only sidebar -->
    <div v-if="tip.visible" class="sidebar-tip" :class="{ 'is-rtl': tip.rtl }" :style="{ top: tip.y + 'px', left: tip.x + 'px' }" role="tooltip">{{ tip.text }}</div>

    <!-- ===== MAIN AREA ===== -->
    <div class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <!-- Left: user -->
        <div class="topbar-left">
          <!-- Phones / tablets: burger opens the drawer -->
          <button
            class="mobile-toggle-btn"
            @click="mobileSidebarOpen = !mobileSidebarOpen"
            :aria-expanded="mobileSidebarOpen"
            :aria-label="currentLang === 'en' ? 'Navigation menu' : 'قائمة التنقل'"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <nav class="breadcrumb">
            <!-- Desktop: this arrow collapses / expands the sidebar -->
            <button
              class="sidebar-toggle-btn"
              :class="{ 'points-end': pointsToEnd }"
              @click="toggleSidebar"
              :aria-expanded="!collapsed"
              :aria-label="collapsed ? (currentLang === 'ar' ? 'توسيع القائمة' : 'Expand menu') : (currentLang === 'ar' ? 'تصغير القائمة' : 'Collapse menu')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span class="breadcrumb-item home">{{ t('admin.profile.dashboard') }}</span>
          </nav>
        </div>

        <!-- Right: breadcrumb -->
        <div class="topbar-right">
          <!-- Open the live website (address set in Settings > Site preview) -->
          <a
            v-if="previewUrl"
            class="preview-site-btn"
            :href="previewUrl"
            target="_blank"
            rel="noopener noreferrer"
            :title="currentLang === 'ar' ? 'معاينة الموقع' : 'Preview site'"
            data-testid="preview-site"
          >
            <svg width="16" height="16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>
            <span class="preview-site-label">{{ currentLang === 'ar' ? 'معاينة الموقع' : 'Preview site' }}</span>
          </a>
          <router-link
            v-else
            class="preview-site-btn"
            to="/admin/settings/preview"
            :title="currentLang === 'ar' ? 'أضف رابط الموقع من الإعدادات' : 'Add the site link in settings'"
            data-testid="preview-site"
          >
            <svg width="16" height="16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>
            <span class="preview-site-label">{{ currentLang === 'ar' ? 'معاينة الموقع' : 'Preview site' }}</span>
          </router-link>
          <!-- Reload the data of the current screen -->
          <button
            class="refresh-btn"
            :class="{ spinning: refreshing }"
            :disabled="refreshing"
            @click="refreshCurrentPage"
            :title="currentLang === 'ar' ? 'تحديث البيانات' : 'Refresh data'"
            :aria-label="currentLang === 'ar' ? 'تحديث البيانات' : 'Refresh data'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
          <!-- Notifications -->
          <NotificationBell />

          <!-- User Menu -->
          <div class="user-menu" data-testid="user-menu" @click="userMenuOpen = !userMenuOpen">
            <span class="user-name" data-testid="admin-name">{{ adminName }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>

            <!-- Dropdown -->
            <div v-if="userMenuOpen" class="user-dropdown" @click.stop>
              <!-- Header -->
              <div class="dropdown-header">
                <div class="user-info">
                  <span class="user-role">{{ adminName }}</span>
                  <span class="user-email" v-if="adminEmail" data-testid="admin-email">{{ adminEmail }}</span>
                  <span class="user-badge">{{ displayAdminRole }}</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <router-link to="/admin/profile" class="dropdown-item profile-item" data-testid="menu-profile" @click="userMenuOpen = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{{ t('admin.profile.my_profile') }}</span>
              </router-link>

              <div class="dropdown-divider"></div>

              <div class="lang-row">
                <span class="lang-row-label">{{ t('admin.profile.language') }}</span>
                <!-- Fixed LTR so English is always on the left and Arabic on the right. -->
                <div class="lang-switch" dir="ltr" role="radiogroup" :aria-label="t('admin.profile.language')">
                  <button
                    type="button"
                    role="radio"
                    class="lang-option"
                    :class="{ active: currentLang === 'en' }"
                    :aria-checked="currentLang === 'en'"
                    @click.stop="setLanguage('en')"
                  >English</button>
                  <button
                    type="button"
                    role="radio"
                    class="lang-option lang-option-ar"
                    :class="{ active: currentLang === 'ar' }"
                    :aria-checked="currentLang === 'ar'"
                    @click.stop="setLanguage('ar')"
                  >عربي</button>
                </div>
              </div>

              <!-- Dark mode is intentionally kept disabled for the dashboard. -->
              <!--
              <div class="dropdown-item split-item" @click="toggleTheme">
                <label class="toggle-switch" @click.stop>
                  <input type="checkbox" v-model="isDark" />
                  <span class="slider"></span>
                </label>
                <div class="theme-switch-container">
                  <span>الوضع الليلي</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                </div>
              </div>
              -->

              <div class="dropdown-divider"></div>

              <!-- Logout -->
              <button @click="handleLogout" class="dropdown-item logout-item justify-start">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>{{ t('admin.profile.logout') }}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <!-- Pages stay alive after the first visit: switching tabs never refetches.
             A page is rebuilt (and refetched) only after a write, a manual
             refresh or a language change, see pageKey(). -->
        <router-view v-slot="{ Component, route: viewRoute }">
          <keep-alive :max="CACHED_PAGES_MAX" exclude="ReturnDetailView">
            <component :is="Component" :key="pageKey(viewRoute)" />
          </keep-alive>
        </router-view>
      </main>
    </div>
    <AppDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../config/axios';
import AppDialog from './AppDialog.vue';
import adminOrderService from '../application/adminOrderService';
import { useTheme } from '../composables/useTheme';
import { freshness, markDataChanged } from '../utils/dataFreshness';
import { clearAdminSessionArtifacts } from '../utils/adminSecurity';
import NotificationBell from './NotificationBell.vue';
import { useSitePreview } from '../composables/useSitePreview';
import { useAdminProfile } from '../composables/useAdminProfile';
import adminManagementService from '../application/adminManagementService';

const { isDark, toggleTheme } = useTheme();

const router = useRouter();
const { previewUrl } = useSitePreview();
const route = useRoute();
// The header shows the signed-in admin as the API knows them: stored at login, then refreshed from
// GET /v1/profile on every load, so a name changed elsewhere shows up here.
const { profile: storedAdmin, apply: applyAdminProfile } = useAdminProfile();
const adminName = computed(() => storedAdmin.value?.name || t('admin.profile.admin'));
const adminEmail = computed(() => storedAdmin.value?.email || '');
const adminRole = computed(() => storedAdmin.value?.role || '');
const SIDEBAR_KEY = 'admin_sidebar_collapsed';
const readCollapsed = () => {
  try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
};
const sidebarCollapsed = ref(readCollapsed());
// On phones/tablets the sidebar is a drawer, so "collapsed" only applies to the desktop layout
const isMobile = ref(typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches);
const collapsed = computed(() => sidebarCollapsed.value && !isMobile.value);
let mobileQuery = null;
const onMobileChange = (e) => { isMobile.value = e.matches; hideTip(); };

// The arrow points toward the sidebar's edge while it is open (collapse) and away from it once it is collapsed
const pointsToEnd = computed(() => (currentLang.value === 'ar') !== collapsed.value);

const toggleSidebar = () => {
  if (isMobile.value) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value;
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
  hideTip();
  try { localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0'); } catch { /* storage unavailable */ }
};

// Name tooltip beside the hovered icon while the sidebar is collapsed
const tip = reactive({ visible: false, text: '', x: 0, y: 0, rtl: true });
const showTip = (event, text) => {
  if (!collapsed.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const rtl = currentLang.value === 'ar';
  tip.text = text;
  tip.y = rect.top + rect.height / 2;
  tip.x = rtl ? rect.left - 10 : rect.right + 10;
  tip.rtl = rtl;
  tip.visible = true;
};
const hideTip = () => { tip.visible = false; };
const mobileSidebarOpen = ref(false);
const userMenuOpen = ref(false);
const ordersCount = ref(0);
const expandedGroup = ref('');

const toggleGroup = (label) => {
  // A group's pages are not visible in the icon rail, so open the sidebar first
  if (collapsed.value) {
    sidebarCollapsed.value = false;
    hideTip();
    try { localStorage.setItem(SIDEBAR_KEY, '0'); } catch { /* storage unavailable */ }
    expandedGroup.value = label;
    return;
  }
  expandedGroup.value = expandedGroup.value === label ? '' : label;
};

const isGroupActive = (item) => {
  if (!item.children) return false;
  return item.children.some(child =>
    route.path === child.route || route.path.startsWith(child.route + '/')
  );
};

const { locale, t } = useI18n();
const currentLang = computed(() => locale.value);
const displayAdminRole = computed(() => {
  if (!adminRole.value || ['admin', 'administrator', 'super_admin', 'المدير', 'مدير النظام', 'مدير النظام (سوبر)'].includes(String(adminRole.value).toLowerCase())) {
    return t('admin.profile.admin');
  }
  return adminRole.value;
});

const refreshAdminProfile = async () => {
  try {
    applyAdminProfile(await adminManagementService.getProfile());
  } catch {
    // Keep what the login stored; an expired session is handled by the API interceptor.
  }
};

const menuLabelKeys = {
  'لوحة القيادة': 'admin.nav.dashboard',
  'أقسام المنتجات': 'admin.nav.categories',
  'العلامات التجارية': 'admin.nav.brands',
  'المنتجات': 'admin.nav.products',
  'خصائص المنتجات': 'admin.nav.attributes',
  'تغذية المنتجات (Feeds)': 'admin.nav.feeds',
  'إدارة المخزون': 'admin.nav.inventory',
  'الطلبات': 'admin.nav.orders',
  'المرتجعات': 'admin.nav.returns',
  'الصفحات الديناميكية': 'admin.nav.pages',
  'تقييمات المنتجات': 'admin.nav.reviews',
  'العملاء': 'admin.nav.customers',
  'أكواد الخصم': 'admin.nav.coupons',
  'إدارة العروض': 'admin.nav.offers',
  'إدارة الباقات': 'admin.nav.discounts',
  'إعلانات السلايدر': 'admin.nav.sliders',
  'بوابات الدفع': 'admin.nav.payments',
  'إدارة مناطق التوصيل': 'admin.nav.shipping',
  'الدول': 'admin.nav.countries',
  'المدن': 'admin.nav.cities',
  'أسعار الشحن': 'admin.nav.shipping',
  'رسائل العملاء': 'admin.nav.messages',
  'المسؤولون': 'admin.nav.admins',
  'الفروع': 'admin.nav.branches',
  'سجل النشاطات': 'admin.nav.activity',
  'إدارة الصلاحيات': 'admin.nav.permissions',
  'التقارير المالية': 'admin.nav.accounts',
  'التكاملات': 'admin.nav.integrations',
  'إعداد الموقع': 'admin.nav.settings',
  'بيانات الموقع': 'admin.nav.settings_general',
  'الصفحة الرئيسية': 'admin.nav.settings_homepage',
  'تفاصيل المنتج': 'admin.nav.settings_producttabs',
  'الأسعار والشحن': 'admin.nav.settings_commerce',
  'التواصل والبريد': 'admin.nav.settings_contact',
  'العنوان وساعات العمل': 'admin.nav.settings_location',
  'الهوية البصرية': 'admin.nav.settings_branding',
  'من نحن': 'admin.nav.settings_about',
  'معاينة الموقع': 'admin.nav.settings_preview',
  'سياسة الخصوصية': 'admin.nav.settings_privacy',
  'الشروط والأحكام': 'admin.nav.settings_terms',
};
const localizeMenuLabel = (label) => t(menuLabelKeys[label] || label);

let lastOrdersFetchTime = 0;
const ORDERS_CACHE_TTL = 30000; // 30 seconds

const refreshOrdersCount = () => fetchOrdersCount(true);
onMounted(() => window.addEventListener('admin-orders-new', refreshOrdersCount));
onUnmounted(() => window.removeEventListener('admin-orders-new', refreshOrdersCount));

const fetchOrdersCount = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastOrdersFetchTime < ORDERS_CACHE_TTL) {
        return;
    }
    try {
        lastOrdersFetchTime = now;
        ordersCount.value = await adminOrderService.countOrders();
    } catch (err) {
        console.error('Failed to fetch orders count', err);
    }
};

const handleOrdersUpdated = () => {
    fetchOrdersCount(true);
};

// ─── Page cache (keep-alive) ───────────────────────────────────────────────────
// Every visited screen is kept in memory, so its API calls run once per session.
// pageGen[path] is part of the component key: bumping it throws the cached copy
// away, and the next visit builds it again with fresh data.
const CACHED_PAGES_MAX = 20;
const pageGen = reactive({});
const visitedPaths = new Set();
const pageKey = (r) => `${r.path}#${pageGen[r.path] || 0}`;
const invalidatePage = (path) => { pageGen[path] = (pageGen[path] || 0) + 1; };

watch(() => route.path, (path) => visitedPaths.add(path), { immediate: true });

// Another screen changed data: every cached screen except the one on display is
// stale. The visible screen already updates itself after its own write.
watch(() => freshness.version, () => {
  visitedPaths.forEach((path) => { if (path !== route.path) invalidatePage(path); });
});

const refreshing = ref(false);
const refreshCurrentPage = () => {
  if (refreshing.value) return;
  refreshing.value = true;
  markDataChanged();
  invalidatePage(route.path);
  setTimeout(() => { refreshing.value = false; }, 800);
};

const setLanguage = (newLang) => {
  if (newLang === locale.value) return;
  locale.value = newLang;
  localStorage.setItem('lang', newLang);
  document.documentElement.lang = newLang;
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  // Responses are localised through Accept-Language, so cached screens reload.
  markDataChanged();
  invalidatePage(route.path);
};

const updateFaviconFromSettings = () => {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = '/brand/tijara-icon-dark.svg';
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && mobileSidebarOpen.value) {
    mobileSidebarOpen.value = false;
  }
};

// Open the sidebar group that holds the current page (e.g. Settings > Visual identity).
const expandActiveGroup = () => {
  const group = menuItems.find(isGroupActive);
  if (group) expandedGroup.value = group.label;
};

watch(() => route.path, () => {
  mobileSidebarOpen.value = false;
  fetchOrdersCount();
  expandActiveGroup();
});

onMounted(() => {
  refreshAdminProfile();
  expandActiveGroup();

  mobileQuery = window.matchMedia('(max-width: 1024px)');
  isMobile.value = mobileQuery.matches;
  mobileQuery.addEventListener('change', onMobileChange);

  document.addEventListener('click', closeUserMenu);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('orders-updated', handleOrdersUpdated);
  fetchOrdersCount();
  updateFaviconFromSettings();
});

onUnmounted(() => {
  mobileQuery?.removeEventListener('change', onMobileChange);
  document.removeEventListener('click', closeUserMenu);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('orders-updated', handleOrdersUpdated);
});

const closeUserMenu = (e) => {
  if (!e.target.closest('.user-menu')) userMenuOpen.value = false;
};

const handleLogout = async () => {
  try {
    await api.post('/v1/logout');
  } catch (err) {
    console.error(err);
  } finally {
    clearAdminSessionArtifacts(localStorage);
    visitedPaths.forEach((path) => invalidatePage(path));
    visitedPaths.clear();
    router.push('/admin/login');
  }
};

const menuItems = [
  {
    route: '/admin/dashboard',
    label: 'لوحة القيادة',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    route: '/admin/categories',
    label: 'أقسام المنتجات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  },
  {
    route: '/admin/products',
    label: 'المنتجات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  },
  {
    route: '/admin/attributes',
    label: 'خصائص المنتجات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  },
  {
    route: '/admin/inventory',
    label: 'إدارة المخزون',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12"/></svg>`,
  },
  {
    route: '/admin/orders',
    label: 'الطلبات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
  },
  {
    route: '/admin/returns',
    label: 'المرتجعات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 0 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 0-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`,
  },
  {
    route: '/admin/reviews',
    label: 'تقييمات المنتجات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"/><path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z"/></svg>`,
  },
  {
    route: '/admin/customers',
    label: 'العملاء',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    route: '/admin/admins',
    label: 'المسؤولون',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>`,
  },
  {
    route: '/admin/discounts',
    label: 'أكواد الخصم',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  },
  {
    route: '/admin/offers',
    label: 'إدارة العروض',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  },
  {
    route: '/admin/sliders',
    label: 'إعلانات السلايدر',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  },
  // {
  //   route: '/admin/payments',
  //   label: 'بوابات الدفع',
  //   icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  // },
  /*
  {
    label: 'إدارة مناطق التوصيل',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
    children: [
      {
        route: '/admin/countries',
        label: 'الدول',
      },
      {
        route: '/admin/cities',
        label: 'المدن',
      },
      {
        route: '/admin/city-shipping-rates',
        label: 'أسعار الشحن',
      },
    ],
  },
  */
  {
    route: '/admin/messages',
    label: 'رسائل العملاء',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
  {
    route: '/admin/financial-reports',
    label: 'التقارير المالية',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15 8.5h-4.25a1.75 1.75 0 0 0 0 3.5h2.5a1.75 1.75 0 0 1 0 3.5H9"/></svg>`,
  },
  // {
  //   route: '/admin/activity-log',
  //   label: 'سجل النشاطات',
  //   icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/></svg>`,
  // },
  {
    route: '/admin/integrations',
    label: 'التكاملات',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`,
  },
  {
    label: 'إعداد الموقع',
    children: [
      { route: '/admin/settings/general', label: 'بيانات الموقع', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M351.9 280l-190.9 0c2.9 64.5 17.2 123.9 37.5 167.4 11.4 24.5 23.7 41.8 35.1 52.4 11.2 10.5 18.9 12.2 22.9 12.2s11.7-1.7 22.9-12.2c11.4-10.6 23.7-28 35.1-52.4 20.3-43.5 34.6-102.9 37.5-167.4zM160.9 232l190.9 0C349 167.5 334.7 108.1 314.4 64.6 303 40.2 290.7 22.8 279.3 12.2 268.1 1.7 260.4 0 256.4 0s-11.7 1.7-22.9 12.2c-11.4 10.6-23.7 28-35.1 52.4-20.3 43.5-34.6 102.9-37.5 167.4zm-48 0C116.4 146.4 138.5 66.9 170.8 14.7 78.7 47.3 10.9 131.2 1.5 232l111.4 0zM1.5 280c9.4 100.8 77.2 184.7 169.3 217.3-32.3-52.2-54.4-131.7-57.9-217.3L1.5 280zm398.4 0c-3.5 85.6-25.6 165.1-57.9 217.3 92.1-32.7 159.9-116.5 169.3-217.3l-111.4 0zm111.4-48C501.9 131.2 434.1 47.3 342 14.7 374.3 66.9 396.4 146.4 399.9 232l111.4 0z"/></svg>` },
      { route: '/admin/settings/homepage', label: 'الصفحة الرئيسية', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c.2 35.5-28.5 64.3-64 64.3l-320.4 0c-35.3 0-64-28.7-64-64l0-160.4-32 0c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>` },
      { route: '/admin/settings/producttabs', label: 'تفاصيل المنتج', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M0 96C0 60.7 28.7 32 64 32H512c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM160 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0 192a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM224 160c0 13.3 10.7 24 24 24H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H248c-13.3 0-24 10.7-24 24zm0 96c0 13.3 10.7 24 24 24H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H248c-13.3 0-24 10.7-24 24zm0 96c0 13.3 10.7 24 24 24H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H248c-13.3 0-24 10.7-24 24z"/></svg>` },
      { route: '/admin/settings/commerce', label: 'الأسعار والشحن', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M64 96c0-35.3 28.7-64 64-64l288 0c35.3 0 64 28.7 64 64l0 32 50.7 0c17 0 33.3 6.7 45.3 18.7L621.3 192c12 12 18.7 28.3 18.7 45.3L640 384c0 35.3-28.7 64-64 64l-3.3 0c-10.4 36.9-44.4 64-84.7 64s-74.2-27.1-84.7-64l-102.6 0c-10.4 36.9-44.4 64-84.7 64s-74.2-27.1-84.7-64l-3.3 0c-35.3 0-64-28.7-64-64l0-48-40 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L24 240c-13.3 0-24-10.7-24-24s10.7-24 24-24l176 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L24 144c-13.3 0-24-10.7-24-24S10.7 96 24 96l40 0zM576 288l0-50.7-45.3-45.3-50.7 0 0 96 96 0zM256 424a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm232 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>` },
      { route: '/admin/settings/contact', label: 'التواصل والبريد', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M48 64c-26.5 0-48 21.5-48 48 0 15.1 7.1 29.3 19.2 38.4l208 156c17.1 12.8 40.5 12.8 57.6 0l208-156c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48L48 64zM0 196L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-188-198.4 148.8c-34.1 25.6-81.1 25.6-115.2 0L0 196z"/></svg>` },
      { route: '/admin/settings/location', label: 'العنوان وساعات العمل', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 188.6C0 84.4 86 0 192 0S384 84.4 384 188.6c0 119.3-120.2 262.3-170.4 316.8-11.8 12.8-31.5 12.8-43.3 0-50.2-54.5-170.4-197.5-170.4-316.8zM192 256a64 64 0 1 0 0-128 64 64 0 1 0 0 128z"/></svg>` },
      { route: '/admin/settings/branding', label: 'الهوية البصرية', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M512 256c0 .9 0 1.8 0 2.7-.4 36.5-33.6 61.3-70.1 61.3L344 320c-26.5 0-48 21.5-48 48 0 3.4 .4 6.7 1 9.9 2.1 10.2 6.5 20 10.8 29.9 6.1 13.8 12.1 27.5 12.1 42 0 31.8-21.6 60.7-53.4 62-3.5 .1-7 .2-10.6 .2-141.4 0-256-114.6-256-256S114.6 0 256 0 512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>` },
      { route: '/admin/settings/newsbar', label: 'شريط الأخبار', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M2 15h10"/><path d="M9 18l3-3-3-3"/></svg>` },
      { route: '/admin/settings/about', label: 'من نحن', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM224 160a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm-8 64l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/></svg>` },
      { route: '/admin/settings/preview', label: 'معاينة الموقع', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>` },
      { route: '/admin/settings/privacy', label: 'سياسة الخصوصية', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9L457.8 82.8c22 9.3 38.4 31 38.3 57.2-.5 99.2-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0-172.4-82.5-213.1-264-213.6-363.2-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.9 1 251.4 0 256 0zm0 66.8l0 378.1c138-66.8 175.1-214.8 176-303.4l-176-74.6 0 0z"/></svg>` },
      { route: '/admin/settings/terms', label: 'الشروط والأحكام', icon: `<svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 64C0 28.7 28.7 0 64 0L213.5 0c17 0 33.3 6.7 45.3 18.7L365.3 125.3c12 12 18.7 28.3 18.7 45.3L384 448c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm208-5.5l0 93.5c0 13.3 10.7 24 24 24L325.5 176 208 58.5zM88 64C74.7 64 64 74.7 64 88s10.7 24 24 24l48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64zm0 96c-13.3 0-24 10.7-24 24s10.7 24 24 24l48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0zm70.3 160c-11.3 0-21.9 5.1-28.9 13.9L69.3 409c-8.3 10.3-6.6 25.5 3.7 33.7s25.5 6.6 33.7-3.8l47.1-58.8 15.2 50.7c3 10.2 12.4 17.1 23 17.1l104 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-86.1 0-16.1-53.6c-4.7-15.7-19.1-26.4-35.5-26.4z"/></svg>` },
    ],
    icon: `<svg width="18" height="18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M195.1 9.5C198.1-5.3 211.2-16 226.4-16l59.8 0c15.2 0 28.3 10.7 31.3 25.5L332 79.5c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L447 233.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9l-29.9 51.8c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5l-59.8 0c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8L73.5 432.3c-14.4 4.8-30.2-1.2-37.8-14.4L5.8 366.1c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7L12.3 185.8c-11.4-10.1-14-26.8-6.5-39.9L35.7 94.1c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8L195.1 9.5zM256.3 336a80 80 0 1 0 -.6-160 80 80 0 1 0 .6 160z"/></svg>`,
  },
];
</script>

<style scoped>
/* ===== Layout ===== */
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg-main);
  color: var(--text-main);
  position: relative;
  width: 100%;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sidebar-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.sidebar-toggle-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}
/* The chevron is drawn pointing left; flip it when it has to point right */
.sidebar-toggle-btn svg {
  transition: transform 0.25s ease;
}
.sidebar-toggle-btn.points-end svg {
  transform: rotate(180deg);
}

.preview-site-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 34px;
  padding: 0 0.75rem;
  margin-inline-end: 0.35rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: #660033;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s;
}
.preview-site-btn:hover { background: var(--bg-main); }
@media (max-width: 640px) {
  .preview-site-label { display: none; }
  .preview-site-btn { padding: 0; width: 34px; justify-content: center; }
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-inline-end: 0.35rem;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-main);
  cursor: pointer;
  transition: background 0.2s;
}
.refresh-btn:hover:not(:disabled) { background: var(--bg-main); }
.refresh-btn:disabled { cursor: default; }
.refresh-btn.spinning svg { animation: refresh-spin 0.8s linear infinite; }
@keyframes refresh-spin { to { transform: rotate(360deg); } }

.mobile-toggle-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.mobile-toggle-btn:hover {
  background: var(--bg-main);
}

.mobile-close-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  margin-inline-start: auto;
  transition: background 0.2s, color 0.2s;
}
.mobile-close-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

.sidebar-backdrop {
  display: none;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: #ffffff;
  border-inline-end: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.25s ease, min-width 0.25s ease, transform 0.25s ease;
  scrollbar-width: none;
  box-shadow: -2px 0 8px rgba(0,0,0,0.02);
  z-index: 40;
}
.sidebar::-webkit-scrollbar { display: none; }

/* Icon rail (desktop): only the icons show; the name appears in a tooltip on hover */
.sidebar-collapsed {
  width: 72px;
  min-width: 72px;
}
.sidebar-collapsed .sidebar-logo {
  padding: 0;
}
/* The collapsed sidebar shows the square Tijara mark */
.sidebar-collapsed .logo-mark {
  width: 34px;
  height: 34px;
  object-fit: contain;
}
.sidebar-collapsed .sidebar-nav {
  padding: 1rem 0.6rem;
}
.sidebar-collapsed .nav-item,
.sidebar-collapsed .nav-group-header {
  justify-content: center;
  gap: 0;
  padding: 0.7rem 0;
  position: relative;
}
.sidebar-collapsed .nav-label {
  display: none;
}
.sidebar-collapsed .nav-badge-dot {
  position: absolute;
  top: 8px;
  inset-inline-end: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #ffffff;
}

.sidebar-tip {
  position: fixed;
  z-index: 2000;
  transform: translateY(-50%);
  padding: 0.35rem 0.7rem;
  background: #660033;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  pointer-events: none;
}
.sidebar-tip.is-rtl {
  transform: translate(-100%, -50%);
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  /* Same height as the top bar, so the line under the logo continues the top bar's bottom line. */
  height: 56px;
  box-sizing: border-box;
  padding: 0 1rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
/* The logo box hugs the image (no text line box), so it sits exactly in the middle of the bar. */
.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.logo-img, .logo-mark { display: block; }
.logo-img {
  width: auto;
  height: 30px;
  object-fit: contain;
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  align-items: center;
}
.logo-ar {
  font-size: 1.1rem;
  font-weight: 800;
  color: #660033;
}
.logo-en {
  font-size: 0.75rem;
  color: #660033;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Nav Items */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem 0.8rem;
  gap: 0.25rem;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 1rem;
  color: var(--nav-text);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border-radius: 8px;
  white-space: nowrap;
}
.nav-item:hover {
  background: rgba(102, 0, 51, 0.07);
  color: var(--primary);
}
.nav-item.active {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(102, 0, 51, 0.22);
}
.nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.nav-icon svg {
  width: 18px;
  height: 18px;
}
.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-badge {
  background: #fff;
  color: #660033;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 50px;
  min-width: 24px;
  text-align: center;
}
.nav-item:not(.active) .nav-badge {
  background: #f1eef3;
  color: var(--nav-text);
}

/* Nav Group Dropdown */
.nav-group {
  display: flex;
  flex-direction: column;
}
.nav-group-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 1rem;
  color: var(--nav-text);
  background: none;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  white-space: nowrap;
}
/* A <button> centres its text by default; keep the group title right next to its icon like the plain links */
.nav-group-header .nav-label {
  text-align: start;
}
.nav-group-header:hover {
  background: rgba(102, 0, 51, 0.07);
  color: var(--primary);
}
/* Selected group looks like a selected link (e.g. التكاملات, التقارير المالية) */
.nav-group.active .nav-group-header {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(102, 0, 51, 0.22);
}
.nav-chevron {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.nav-group.expanded .nav-chevron {
  transform: rotate(180deg);
}
.nav-group-children {
  display: flex;
  flex-direction: column;
  padding-inline-start: 2.35rem;
  gap: 0.15rem;
}
.nav-sub-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  color: var(--nav-text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.nav-sub-item {
  gap: 0.6rem;
}
.nav-sub-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
}
.nav-sub-icon :deep(svg) {
  fill: currentColor;
}
.nav-sub-item:hover {
  background: rgba(102, 0, 51, 0.07);
  color: var(--primary);
}
.nav-sub-item.active {
  background: rgba(102, 0, 51, 0.1);
  color: var(--primary);
  font-weight: 600;
}

/* ===== TOPBAR ===== */
.topbar {
  height: 56px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
}
.topbar-right {
  display: flex;
  align-items: center;
}
.topbar-left {
  display: flex;
  align-items: center;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #6b7280;
}
.breadcrumb-item {
  color: var(--text-main);
  font-weight: 500;
}

/* Notification */
.notification-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  transition: all 0.2s;
  margin-left: 0.5rem;
}
.notification-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}
.notification-badge {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  border: 2px solid var(--bg-topbar);
}

/* User Menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  position: relative;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-menu:hover { background: var(--bg-main); }
.profile-item { text-decoration: none; justify-content: flex-start; gap: 0.5rem; }
.profile-item:hover { color: var(--primary); }
.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}
.user-menu > svg { color: #9ca3af; }

/* Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  /* Anchor to the menu's outer edge in both directions so it never runs off-screen. */
  inset-inline-end: 0;
  max-width: calc(100vw - 16px);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  min-width: 240px;
  z-index: 100;
  padding: 0.5rem;
  cursor: default;
}
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  text-align: start;
}
.user-role {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}
.user-email {
  font-size: 0.7rem;
  color: #6b7280;
}
.user-badge {
  font-size: 0.65rem;
  color: #660033;
  font-weight: 600;
  margin-top: 0.1rem;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.25rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.65rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}
.dropdown-item:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

.split-item {
  justify-content: space-between;
}

.lang-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
}
.lang-row-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
}
.lang-switch {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
}
.lang-option {
  min-width: 64px;
  padding: 0.3rem 0.8rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.lang-option:hover:not(.active) { color: var(--text-main); }
.lang-option.active {
  background: #660033;
  color: #ffffff;
}
.lang-option:focus-visible { outline: 2px solid #660033; outline-offset: 2px; }

.theme-switch-container {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-main);
}

.justify-end {
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--border-color);
  transition: .3s;
  border-radius: 34px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #660033;
}
input:checked + .slider:before {
  transform: translateX(14px);
}

.logout-item { color: #dc2626; gap: 0.5rem; justify-content: flex-start; }
.logout-item:hover { background: #fef2f2; color: #dc2626; }

/* ===== PAGE CONTENT ===== */
.page-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 1024px) {
  .sidebar-toggle-btn {
    display: none;
  }
  .mobile-toggle-btn {
    display: inline-flex;
  }
  .mobile-close-btn {
    display: inline-flex;
  }
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    z-index: 999;
  }
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    height: 100vh;
    height: 100dvh;
    z-index: 1000;
    transform: translateX(100%);
    box-shadow: -4px 0 20px rgba(0,0,0,0.15);
  }
  [dir="ltr"] .sidebar {
    right: auto;
    left: 0;
    transform: translateX(-100%);
    box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  }
  .sidebar:not(.mobile-open) {
    box-shadow: none;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .main-area {
    width: 100%;
    min-width: 0;
    flex: 1;
    height: 100%;
    overflow: hidden;
  }
  .page-content {
    padding: 1rem 0.75rem;
  }
}
</style>
