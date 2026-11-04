<template>
  <div class="customers-page">
    <!-- View Mode: List -->
    <div class="list-view-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-titles">
          <div class="title-with-icon">
            <h2 class="page-title">{{ tx('إدارة العملاء', 'Customer Management') }}</h2>
            <div class="count-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <p class="page-subtitle">{{ tx('إدارة حسابات العملاء والمعلومات', 'Manage customer accounts and information') }}</p>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="list-stats-grid">
        <div class="list-stat-card">
          <div class="stat-icon-wrapper pink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <span class="list-stat-label">{{ tx('إجمالي العملاء', 'Total Customers') }}</span>
            <h3 class="list-stat-value">{{ customers.length }}</h3>
          </div>
        </div>
        <div class="list-stat-card">
          <div class="stat-icon-wrapper green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-info">
            <span class="list-stat-label">{{ tx('العملاء النشطون', 'Active Customers') }}</span>
            <h3 class="list-stat-value">{{ activeCount }}</h3>
          </div>
        </div>
        <div class="list-stat-card">
          <div class="stat-icon-wrapper gray">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div class="stat-info">
            <span class="list-stat-label">{{ tx('غير النشطين / المحظورون', 'Inactive / Blocked') }}</span>
            <h3 class="list-stat-value">{{ inactiveCount }}</h3>
          </div>
        </div>
        <div class="list-stat-card">
          <div class="stat-icon-wrapper blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-info">
            <span class="list-stat-label">{{ tx('انضموا هذا الشهر', 'Joined this month') }}</span>
            <h3 class="list-stat-value">{{ newThisMonthCount }}</h3>
          </div>
        </div>
      </div>

      <!-- Toolbar: search + status segments -->
      <div class="filters-row">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" v-model="searchQuery" :placeholder="tx('البحث بالاسم أو البريد أو رقم الجوال...', 'Search by name, email or phone...')" class="search-input" />
        </div>

        <div class="status-segments" role="tablist" :aria-label="tx('تصفية حسب الحالة', 'Filter by status')">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            role="tab"
            class="segment-btn"
            :class="{ active: statusFilter === opt.value }"
            :aria-selected="statusFilter === opt.value"
            @click="statusFilter = opt.value"
          >
            <span>{{ opt.label }}</span>
            <span class="segment-count">{{ opt.count }}</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-name text-right">{{ tx('العميل', 'Customer') }}</th>
              <th class="col-phone">{{ tx('رقم الجوال', 'Phone') }}</th>
              <th class="col-city">{{ tx('المدينة', 'City') }}</th>
              <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
              <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="state-row"><td colspan="5">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
            <tr v-else-if="filteredCustomers.length === 0" class="state-row"><td colspan="5">{{ tx('لا يوجد عملاء مطابقين', 'No matching customers found') }}</td></tr>
            <template v-else>
              <tr v-for="customer in filteredCustomers" :key="customer.id" class="data-row">
                <td class="col-name text-right">
                  <div class="customer-cell">
                    <div class="customer-avatar">{{ initialOf(customer.name) }}</div>
                    <div class="customer-meta">
                      <span class="customer-name">{{ customer.name || '—' }}</span>
                      <span class="customer-email">{{ customer.email || '—' }}</span>
                    </div>
                  </div>
                </td>
                <td class="col-phone ltr-text">{{ displayValue(customer.phone) }}</td>
                <td class="col-city">{{ displayValue(customer.city) }}</td>
                <td class="col-status">
                  <span :class="['status-badge-table', customer.is_active ? 'active' : 'inactive']">
                    {{ customer.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
                  </span>
                </td>
                <td class="col-actions">
                  <div class="actions-group">
                    <router-link class="action-btn view-btn" :to="`/admin/customers/${customer.id}`" data-testid="customer-view" :title="tx('عرض', 'View')" :aria-label="tx('عرض', 'View')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </router-link>
                    <button class="action-btn delete-btn" @click="confirmDelete(customer)" :title="tx('حذف', 'Delete')" :aria-label="tx('حذف', 'Delete')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div class="modal-overlay" v-if="deleteTarget" @click.self="cancelDelete">
      <div class="modal-content delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-customer-title">
        <div class="delete-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/>
          </svg>
        </div>
        <div class="delete-copy">
          <h2 id="delete-customer-title">{{ tx('تأكيد حذف العميل', 'Confirm customer deletion') }}</h2>
          <p>{{ tx('هل أنت متأكد من حذف العميل', 'Are you sure you want to delete customer') }} «{{ deleteTarget.name }}»؟ {{ tx('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.') }}</p>
        </div>
        <div class="delete-footer">
          <button class="btn-cancel-form" type="button" :disabled="isDeleting" @click="cancelDelete">{{ tx('إلغاء', 'Cancel') }}</button>
          <button class="btn-delete-confirm" type="button" :disabled="isDeleting" @click="executeDelete">
            <span v-if="isDeleting" class="delete-spinner" aria-hidden="true"></span>
            {{ isDeleting ? tx('جاري الحذف...', 'Deleting...') : tx('حذف العميل', 'Delete customer') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" :class="[alertType, { show: showAlert }]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <path v-if="alertType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline v-if="alertType === 'success'" points="22 4 12 14.01 9 11.01"/>
        <circle v-if="alertType === 'error'" cx="12" cy="12" r="10"/><line v-if="alertType === 'error'" x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import adminManagementService from '../application/adminManagementService';

const { tx } = useAdminText();

// States
const customers = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');


const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

// Utils
const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const displayValue = (value, fallback = tx('غير متاح', 'Not available')) => hasValue(value) ? value : fallback;
const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

// Fetch Data
const fetchCustomers = async () => {
  loading.value = true;
  try {
    const users = await adminManagementService.listUsers({ search: searchQuery.value });
    customers.value = users.filter((user) => ['user', 'customer'].includes(String(user.role).toLowerCase()));
  } catch (err) {
    triggerAlert('فشل تحميل بيانات العملاء', 'error');
  } finally {
    loading.value = false;
  }
};

const deleteTarget = ref(null);
const isDeleting = ref(false);

const confirmDelete = (customer) => { deleteTarget.value = customer; };
const cancelDelete = () => { if (!isDeleting.value) deleteTarget.value = null; };
const executeDelete = async () => {
  if (!deleteTarget.value || isDeleting.value) return;
  const customer = deleteTarget.value;
  isDeleting.value = true;
  try {
    await adminManagementService.deleteUser(customer.id);
    // Remove the row immediately, then reconcile with the server response.
    customers.value = customers.value.filter((item) => Number(item.id) !== Number(customer.id));
    deleteTarget.value = null;
    await fetchCustomers();
    const stillExists = customers.value.some((item) => Number(item.id) === Number(customer.id));
    if (stillExists) {
      triggerAlert('تم تنفيذ الحذف لكن ما زال العميل ظاهرًا من السيرفر', 'error');
      return;
    }
    triggerAlert('تم حذف العميل بنجاح');
  } catch (err) {
    // Restore the row when the delete request or reconciliation fails.
    await fetchCustomers();
    deleteTarget.value = null;
    triggerAlert(apiErrorMessage(err, 'فشل حذف العميل'), 'error');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
});

// Stats
const activeCount = computed(() => customers.value.filter((c) => c.is_active).length);
const inactiveCount = computed(() => customers.value.length - activeCount.value);
const newThisMonthCount = computed(() => {
  const now = new Date();
  return customers.value.filter((c) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
});
const statusOptions = computed(() => [
  { value: '', label: tx('الكل', 'All'), count: customers.value.length },
  { value: '1', label: tx('نشط', 'Active'), count: activeCount.value },
  { value: '0', label: tx('غير نشط', 'Inactive'), count: inactiveCount.value },
]);
const initialOf = (name) => (String(name || '').trim().charAt(0) || '؟').toUpperCase();

// Filtering
const filteredCustomers = computed(() => {
  if (!Array.isArray(customers.value)) return [];
  return customers.value.filter(c => {
    const nameMatch = c.name?.toLowerCase().includes(searchQuery.value.toLowerCase());
    const emailMatch = c.email?.toLowerCase().includes(searchQuery.value.toLowerCase());
    const phoneMatch = c.phone?.includes(searchQuery.value) || false;
    
    const queryMatch = nameMatch || emailMatch || phoneMatch;
    const statusMatch = statusFilter.value === '' ? true : (c.is_active ? '1' : '0') === statusFilter.value;
    
    return queryMatch && statusMatch;
  });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');

.customers-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; 
  font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 2rem;
}

/* --- List View Styles --- */
.list-view-container { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.title-with-icon { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }
.count-badge { background: #f3f4f6; color: #660033; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 0; }

.list-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
.list-stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.stat-icon-wrapper { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-wrapper.pink { background: #f3f4f6; color: #660033; }
.stat-icon-wrapper.green { background: #ecfdf5; color: #10b981; }
.stat-icon-wrapper.gray { background: #f9fafb; color: #6b7280; }
.stat-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
.stat-info { display: flex; flex-direction: column; gap: 0.2rem; }
.list-stat-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; }
.list-stat-value { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }

.filters-row { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; padding: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.search-box { flex: 1; min-width: 260px; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; pointer-events: none; }
.search-input { width: 100%; height: 48px; box-sizing: border-box; padding: 0 2.8rem 0 1rem; border: 1px solid #e5e7eb; border-radius: 10px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; transition: border-color 0.2s, box-shadow 0.2s; }
.search-input:focus { border-color: #660033; box-shadow: 0 0 0 4px rgba(0,0,0,0.06); }

.status-segments { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem; height: 48px; box-sizing: border-box; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 10px; }
.segment-btn { display: inline-flex; align-items: center; gap: 0.6rem; height: 100%; padding: 0 1.1rem; border: none; background: transparent; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.82rem; font-weight: 700; color: #6b7280; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.segment-btn:hover { color: #111827; }
.segment-btn.active { background: #660033; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.segment-count { min-width: 20px; padding: 0.05rem 0.4rem; border-radius: 50px; background: #e5e7eb; color: #374151; font-size: 0.7rem; font-weight: 800; text-align: center; }
.segment-btn.active .segment-count { background: rgba(255,255,255,0.22); color: #fff; }

.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1.1rem 1.25rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; text-align: center; }
.data-table th { background: #f9fafb; font-size: 0.75rem; font-weight: 700; color: #6b7280; white-space: nowrap; }
.data-table td { font-size: 0.85rem; color: #374151; }
.data-row:hover td { background: #f3f4f6; }
.state-row td { text-align: center; color: #6b7280; padding: 2.5rem; }

.text-right { text-align: right !important; }
.ltr-text { direction: ltr; }

.customer-cell { display: flex; align-items: center; gap: 0.85rem; }
.customer-avatar { width: 38px; height: 38px; border-radius: 50%; background: #f3f4f6; color: #111827; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; flex-shrink: 0; }
.customer-meta { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.customer-name { font-weight: 700; color: #111827; }
.customer-email { color: #6b7280; font-size: 0.78rem; direction: ltr; text-align: right; }
.font-bold { font-weight: 700; }

.status-badge-table { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
.status-badge-table.active { background: #ecfdf5; color: #059669; }
.status-badge-table.inactive { background: #f3f4f6; color: #6b7280; }

.actions-group { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.action-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s; }
.view-btn { background: #f3f4f6; color: #660033; }
.view-btn:hover { background: #e5e7eb; }
.delete-btn { background: #fef2f2; color: #dc2626; }
.delete-btn:hover { background: #fee2e2; }

/* Delete modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(4px); }
.modal-content { background: #fff; border-radius: 20px; width: 100%; position: relative; box-shadow: 0 25px 70px rgba(0,0,0,0.25); }
.delete-modal { max-width: 460px; padding: 28px; text-align: center; }
.delete-icon { width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626; background: #fef2f2; }
.delete-copy h2 { margin: 0 0 8px; color: #111827; font-size: 1.2rem; }
.delete-copy p { margin: 0; color: #6b7280; line-height: 1.7; font-size: 0.92rem; }
.delete-footer { display: flex; gap: 1rem; padding: 24px 0 0; }
.delete-footer button { min-height: 44px; }
.btn-cancel-form { flex: 1; padding: 0.85rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; }
.btn-delete-confirm { background: #dc2626; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; flex: 1; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-delete-confirm:hover { background: #b91c1c; }
.btn-delete-confirm:disabled, .btn-cancel-form:disabled { opacity: 0.6; cursor: not-allowed; }
.delete-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.45); border-top-color: white; border-radius: 50%; animation: delete-spin 0.7s linear infinite; }
@keyframes delete-spin { to { transform: rotate(360deg); } }

/* --- Customer data dialog --- */
.modal-close { position: absolute; top: 1.25rem; left: 1.25rem; background: #f3f4f6; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; }
.view-modal { max-width: 520px; padding: 2rem 2rem 1.75rem; }
.view-header { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; padding-bottom: 1.25rem; }
.view-avatar { width: 64px; height: 64px; border-radius: 50%; background: #f3f4f6; color: #111827; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; }
.view-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
.view-details { display: flex; flex-direction: column; border: 1px solid #f3f4f6; border-radius: 12px; padding: 0 1.25rem; }
.detail-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid #f3f4f6; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.8rem; font-weight: 700; color: #6b7280; }
.detail-value { font-size: 0.9rem; font-weight: 700; color: #111827; word-break: break-all; }
.view-footer { display: flex; gap: 1rem; margin-top: 1.5rem; }

/* Alerts */

@media (max-width: 1200px) {
  .list-stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .list-stats-grid { grid-template-columns: 1fr; }
  .status-segments { width: 100%; }
  .segment-btn { flex: 1; justify-content: center; padding: 0 0.5rem; }
  .view-modal { padding: 1.5rem 1.25rem; }
}
</style>
