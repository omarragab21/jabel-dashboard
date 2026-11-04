<template>
  <div class="customer-page">
    <!-- Header: back, avatar, name + status, email | phone -->
    <div class="profile-header">
      <div class="profile-identity">
        <router-link to="/admin/customers" class="back-btn" :aria-label="tx('رجوع للعملاء', 'Back to customers')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </router-link>
        <div class="profile-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="profile-text">
          <div class="profile-name-row">
            <h2 class="profile-name">{{ customer?.name || (loading ? '…' : '—') }}</h2>
            <span v-if="customer" :class="['status-pill', customer.is_active ? 'active' : 'inactive']">{{ customer.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}</span>
          </div>
          <p v-if="customer" class="profile-contact">
            <bdi dir="ltr">{{ customer.phone || '—' }}</bdi> | <bdi dir="ltr">{{ customer.email || '—' }}</bdi>
          </p>
        </div>
      </div>
    </div>

    <div v-if="error" class="state-box error">{{ error }}</div>

    <template v-else>
      <!-- Stat cards -->
      <div class="stats-grid" data-testid="customer-stats">
        <div class="stat-card">
          <span class="stat-label">{{ tx('إجمالي الطلبات', 'Total orders') }}</span>
          <strong class="stat-value">{{ loading ? '…' : stats.ordersCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ tx('إجمالي الإنفاق', 'Total spent') }}</span>
          <strong class="stat-value"><bdi dir="ltr">{{ loading ? '…' : formatPrice(stats.totalSpent) }}</bdi> <small>{{ cur }}</small></strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ tx('المدينة', 'City') }}</span>
          <strong class="stat-value">{{ loading ? '…' : (stats.city || '—') }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ tx('تاريخ الانضمام', 'Joined') }}</span>
          <strong class="stat-value"><bdi dir="ltr">{{ loading ? '…' : (stats.joined || '—') }}</bdi></strong>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar" role="tablist">
        <button v-for="tab in tabs" :key="tab.key" type="button" role="tab" class="tab-btn" :class="{ active: activeTab === tab.key }" :aria-selected="activeTab === tab.key" :data-testid="`tab-${tab.key}`" @click="activeTab = tab.key">
          <span class="tab-icon" aria-hidden="true">
            <svg v-if="tab.key === 'orders'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <svg v-else-if="tab.key === 'addresses'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <span>{{ tab.label }}</span>
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="loading" class="state-box">{{ tx('جاري التحميل...', 'Loading...') }}</div>

      <!-- سجل الطلبات -->
      <div v-else-if="activeTab === 'orders'" class="table-card" data-testid="panel-orders">
        <table v-if="orders.length" class="data-table">
          <thead>
            <tr>
              <th class="text-start">{{ tx('رقم الطلب', 'Order number') }}</th>
              <th>{{ tx('التاريخ', 'Date') }}</th>
              <th>{{ tx('المنتجات', 'Products') }}</th>
              <th>{{ tx('المبلغ', 'Amount') }}</th>
              <th>{{ tx('الحالة', 'Status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="text-start"><router-link class="order-link" :to="{ path: '/admin/orders', query: { search: order.number } }"><bdi dir="ltr">{{ order.number }}</bdi></router-link></td>
              <td><bdi dir="ltr">{{ order.date }}</bdi></td>
              <td>{{ order.itemsCount }}</td>
              <td><bdi dir="ltr">{{ formatPrice(order.total) }}</bdi> {{ cur }}</td>
              <td><span :class="['order-status', order.status]">{{ order.statusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-text">{{ tx('لا توجد طلبات لهذا العميل.', 'This customer has no orders.') }}</p>
      </div>

      <!-- عناوين الشحن -->
      <div v-else-if="activeTab === 'addresses'" data-testid="panel-addresses">
        <div v-if="addresses.length" class="address-grid">
          <div v-for="address in addresses" :key="address.id" class="address-card" :class="{ default: address.isDefault }">
            <div class="address-head">
              <span class="address-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                {{ address.title || tx('عنوان', 'Address') }}
              </span>
              <span v-if="address.isDefault" class="default-pill">{{ tx('افتراضي', 'Default') }}</span>
            </div>
            <p class="address-line">{{ address.address }}</p>
            <p v-if="address.notes" class="address-notes">{{ address.notes }}</p>
            <div class="address-meta">
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                {{ [address.city, address.area].filter(Boolean).join(' · ') || '—' }}
              </span>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <bdi dir="ltr">{{ address.phone || '—' }}</bdi>
              </span>
            </div>
          </div>
        </div>
        <div v-else class="table-card"><p class="empty-text">{{ tx('لا توجد عناوين شحن لهذا العميل.', 'This customer has no shipping addresses.') }}</p></div>
      </div>

      <!-- التقييمات -->
      <div v-else class="table-card" data-testid="panel-reviews">
        <table v-if="reviews.length" class="data-table">
          <thead>
            <tr>
              <th class="text-start">{{ tx('المنتج', 'Product') }}</th>
              <th>{{ tx('التقييم', 'Rating') }}</th>
              <th>{{ tx('التعليق', 'Comment') }}</th>
              <th>{{ tx('التاريخ', 'Date') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in reviews" :key="review.id">
              <td class="text-start">{{ review.productName || '—' }}</td>
              <td>
                <span class="stars" :aria-label="`${review.rating} / 5`" dir="ltr">
                  <span v-for="n in 5" :key="n" :class="['star', { on: n <= review.rating }]">★</span>
                </span>
              </td>
              <td class="comment-cell">{{ review.comment || '—' }}</td>
              <td><bdi dir="ltr">{{ review.date }}</bdi></td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-text">{{ tx('لا توجد تقييمات لهذا العميل.', 'This customer has no reviews.') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import adminManagementService from '../application/adminManagementService';
import adminOrderService from '../application/adminOrderService';
import { customerAddresses, customerOrders, customerReviews, customerStats } from '../domain/customers/customerProfile';

const { tx } = useAdminText();
const { cur } = useCurrencyLabel();
const route = useRoute();

const customer = ref(null);
const allOrders = ref([]);
const allReviews = ref([]);
const loading = ref(true);
const error = ref('');
const activeTab = ref('orders');

const formatPrice = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const orders = computed(() => (customer.value ? customerOrders(customer.value, allOrders.value) : []));
const addresses = computed(() => (customer.value ? customerAddresses(customer.value) : []));
const reviews = computed(() => (customer.value ? customerReviews(customer.value, allReviews.value) : []));
const stats = computed(() => customerStats(customer.value || {}, orders.value, addresses.value));

const tabs = computed(() => [
  { key: 'orders', label: tx('سجل الطلبات', 'Order history'), count: orders.value.length },
  { key: 'addresses', label: tx('عناوين الشحن', 'Shipping addresses'), count: addresses.value.length },
  { key: 'reviews', label: tx('التقييمات', 'Reviews'), count: reviews.value.length },
]);

// One request for the customer (orders, addresses and reviews), plus the orders and reviews lists that
// fill in what the customer record leaves out (each order's items, each review's product).
const load = async (id) => {
  loading.value = true;
  error.value = '';
  try {
    const [user, ordersList, reviewsList] = await Promise.all([
      adminManagementService.getUser(id),
      adminOrderService.listOrders().catch(() => []),
      adminManagementService.listReviews({}).catch(() => []),
    ]);
    customer.value = user;
    allOrders.value = ordersList;
    allReviews.value = reviewsList;
  } catch (err) {
    customer.value = null;
    error.value = err.response?.status === 404 ? tx('العميل غير موجود.', 'Customer not found.') : tx('فشل تحميل بيانات العميل.', 'Failed to load the customer.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => { if (id) { activeTab.value = 'orders'; load(id); } });
</script>

<style scoped>
.customer-page { display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem; }

.profile-header { display: flex; align-items: center; justify-content: space-between; }
.profile-identity { display: flex; align-items: center; gap: 0.9rem; }
.back-btn { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; text-decoration: none; }
.back-btn:hover { background: #f3f4f6; color: #111827; }
.profile-avatar { width: 48px; height: 48px; border-radius: 50%; background: #fdf2f8; color: #660033; display: flex; align-items: center; justify-content: center; }
.profile-name-row { display: flex; align-items: center; gap: 0.6rem; }
.profile-name { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
.profile-contact { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.85rem; }
.status-pill { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 999px; }
.status-pill.active { background: #ecfdf5; color: #059669; }
.status-pill.inactive { background: #f3f4f6; color: #6b7280; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.9rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
.stat-label { font-size: 0.75rem; color: #6b7280; font-weight: 600; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #111827; text-align: left; }
.stat-value small { font-size: 0.8rem; color: #6b7280; font-weight: 600; }

.tabs-bar { display: flex; gap: 0.25rem; border-bottom: 1px solid #e5e7eb; }
.tab-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.75rem 1rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: inherit; font-size: 0.88rem; font-weight: 600; color: #6b7280; cursor: pointer; }
.tab-btn.active { color: #660033; border-bottom-color: #660033; }
.tab-icon { display: inline-flex; }
.tab-count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #f3f4f6; color: #6b7280; font-size: 0.7rem; display: inline-flex; align-items: center; justify-content: center; }
.tab-btn.active .tab-count { background: #fdf2f8; color: #660033; }

.table-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.95rem 1.25rem; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 0.85rem; color: #374151; }
.data-table th { background: #f9fafb; font-size: 0.75rem; font-weight: 700; color: #6b7280; }
.data-table tbody tr:last-child td { border-bottom: none; }
.text-start { text-align: start !important; }
.order-link { color: #660033; font-weight: 700; text-decoration: none; }
.order-link:hover { text-decoration: underline; }
.order-status { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: #eff6ff; color: #2563eb; }
.order-status.delivered, .order-status.completed { background: #ecfdf5; color: #059669; }
.order-status.cancelled { background: #fef2f2; color: #dc2626; }
.order-status.pending { background: #fffbeb; color: #b45309; }
.comment-cell { max-width: 360px; }
.stars { display: inline-flex; gap: 2px; font-size: 1rem; }
.star { color: #d1d5db; }
.star.on { color: #f59e0b; }

.address-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.address-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.address-card.default { border: 2px solid #e9c5d6; }
.address-head { display: flex; align-items: center; justify-content: space-between; }
.address-title { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 700; color: #111827; }
.address-title svg { color: #660033; }
.default-pill { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 999px; background: #fdf2f8; color: #660033; }
.address-line { margin: 0; color: #111827; font-size: 0.9rem; }
.address-notes { margin: 0; color: #6b7280; font-size: 0.8rem; }
.address-meta { display: flex; gap: 1rem; color: #6b7280; font-size: 0.78rem; }
.address-meta span { display: inline-flex; align-items: center; gap: 0.3rem; }

.state-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2.5rem 1rem; text-align: center; color: #6b7280; }
.state-box.error { color: #dc2626; }
.empty-text { margin: 0; padding: 2.5rem 1rem; text-align: center; color: #6b7280; }

@media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) {
  .stats-grid, .address-grid { grid-template-columns: 1fr; }
  .tabs-bar { overflow-x: auto; }
  .tab-btn { white-space: nowrap; }
}
</style>
