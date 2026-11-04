<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, onMounted, computed } from 'vue';
import api from '../config/axios';
import { useAdminText } from '../composables/useAdminText';

const { tx } = useAdminText();

// State
const branches = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const showFormModal = ref(false);
const showViewModal = ref(false);
const isEditing = ref(false);
const currentBranch = ref(null);
const isSubmitting = ref(false);

const form = ref({
    name: '',
    city: '',
    address: '',
    phone: '',
    working_hours: '',
    managers_count: 0,
    is_active: true
});

// Fetch Branches
const fetchBranches = async () => {
    loading.value = true;
    try {
        const response = await api.get('/dashboard/branches', {
            params: { search: searchQuery.value }
        });
        branches.value = response.data.data;
    } catch (error) {
        console.error('Failed to fetch branches', error);
        triggerAlert('فشل تحميل الفروع', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(fetchBranches);

// Actions
const openAddModal = () => {
    isEditing.value = false;
    form.value = {
        name: '',
        city: '',
        address: '',
        phone: '',
        working_hours: '',
        managers_count: 0,
        is_active: true
    };
    showFormModal.value = true;
};

const openEditModal = (branch) => {
    isEditing.value = true;
    currentBranch.value = branch;
    form.value = {
        name: branch.name,
        city: branch.city,
        address: branch.address,
        phone: branch.phone,
        working_hours: branch.working_hours || branch.opening_hours,
        managers_count: branch.managers_count,
        is_active: branch.is_active
    };
    showFormModal.value = true;
};

const openViewModal = (branch) => {
    currentBranch.value = branch;
    showViewModal.value = true;
};

const submitForm = async () => {
    isSubmitting.value = true;
    try {
        const payload = { ...form.value };
        payload.is_active = payload.is_active ? 1 : 0;

        if (isEditing.value) {
            await api.put(`/dashboard/branches/${currentBranch.value.id}`, payload);
            triggerAlert('تم تحديث بيانات الفرع بنجاح');
        } else {
            await api.post('/dashboard/branches', payload);
            triggerAlert('تم إضافة الفرع بنجاح');
        }
        showFormModal.value = false;
        fetchBranches();
    } catch (error) {
        if (error.response?.data?.errors) {
            const firstError = Object.values(error.response.data.errors)[0][0];
            triggerAlert(firstError, 'error');
        } else {
            const msg = apiErrorMessage(error, 'فشل حفظ البيانات');
            triggerAlert(msg, 'error');
        }
    } finally {
        isSubmitting.value = false;
    }
};

const confirmDelete = async (branch) => {
    if (confirm(`هل أنت متأكد من حذف فرع "${branch.name}"؟`)) {
        try {
            await api.delete(`/dashboard/branches/${branch.id}`);
            triggerAlert('تم حذف الفرع بنجاح');
            fetchBranches();
        } catch (error) {
            triggerAlert('فشل عملية الحذف', 'error');
        }
    }
};

const toggleStatus = async (branch) => {
    try {
        const newStatus = !branch.is_active;
        await api.put(`/dashboard/branches/${branch.id}`, { is_active: newStatus ? 1 : 0 });
        branch.is_active = newStatus;
        triggerAlert(newStatus ? 'تم تفعيل الفرع' : 'تم تعطيل الفرع');
    } catch (error) {
        triggerAlert('فشل تحديث الحالة', 'error');
    }
};

// Stats
const totalBranches = computed(() => branches.value.length);
const activeBranchesCount = computed(() => branches.value.filter(b => b.is_active).length);
const totalManagers = computed(() => branches.value.reduce((sum, b) => sum + (b.managers_count || 0), 0));

// Alert State
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

const triggerAlert = (message, type = 'success') => {
    alertMessage.value = localizeMessage(message);
    alertType.value = type;
    showAlert.value = true;
    setTimeout(() => showAlert.value = false, 3000);
};
</script>

<template>
  <div class="branches-page p-6">
    <!-- Header -->
    <div class="header-section mb-6">
       
       
       <div class="page-title-area">
          <div class="title-with-icon">
             <div class="icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="10" width="20" height="12" rx="2"/><path d="M12 22V10"/><path d="M7 10V2h10v8"/><path d="M12 6h.01"/></svg>
             </div>
             <div>
                <h1>{{ tx('إدارة الفروع', 'Branch Management') }}</h1>
                <p>{{ tx('إدارة فروع المتجر ومعلوماتها', 'Manage store branches and their information') }}</p>
             </div>
          </div>
       </div>

       <div class="left-actions">
           <button class="add-btn" @click="openAddModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ tx('إضافة فرع جديد', 'Add Branch') }}
           </button>
       </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid mb-6">
       <div class="stat-card">
          <div class="stat-icon total"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="10" width="20" height="12" rx="2"/><path d="M12 22V10"/><path d="M7 10V2h10v8"/></svg></div>
          <div class="stat-info">
             <span class="stat-val">{{ totalBranches }}</span>
             <span class="stat-label">{{ tx('إجمالي الفروع', 'Total Branches') }}</span>
          </div>
       </div>
       <div class="stat-card">
          <div class="stat-icon active"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="stat-info">
             <span class="stat-val">{{ activeBranchesCount }}</span>
             <span class="stat-label">{{ tx('فروع مفعلة', 'Active Branches') }}</span>
          </div>
       </div>
       <div class="stat-card">
          <div class="stat-icon managers"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="stat-info">
             <span class="stat-val">{{ totalManagers }}</span>
             <span class="stat-label">{{ tx('إجمالي المديرين', 'Total Managers') }}</span>
          </div>
       </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-card shadow-sm mb-6">
       <div class="search-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" v-model="searchQuery" @input="fetchBranches" :placeholder="tx('البحث عن فرع...', 'Search branches...')" class="search-input" />
       </div>
    </div>

    <!-- Table -->
    <div class="table-container shadow-sm">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-name text-right">{{ tx('اسم الفرع', 'Branch Name') }}</th>
            <th class="col-city">{{ tx('المدينة', 'City') }}</th>
            <th class="col-address">{{ tx('العنوان', 'Address') }}</th>
            <th class="col-phone">{{ tx('الجوال', 'Phone') }}</th>
            <th class="col-hours">{{ tx('ساعات العمل', 'Working Hours') }}</th>
            <th class="col-managers">{{ tx('المديرين', 'Managers') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="8">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="branches.length === 0" class="state-row"><td colspan="8">{{ tx('لا توجد فروع حالياً', 'No branches yet') }}</td></tr>
          <template v-else>
            <tr v-for="branch in branches" :key="branch.id" class="data-row">
              <td class="col-name text-right">
                <div class="branch-info">
                   <div class="branch-icon-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                   </div>
                   <span class="branch-name-text">{{ branch.name }}</span>
                </div>
              </td>
              <td class="col-city">{{ branch.city }}</td>
              <td class="col-address">
                 <span class="address-text">{{ branch.address }}</span>
              </td>
              <td class="col-phone ltr-text">{{ branch.phone || '-' }}</td>
              <td class="col-hours">{{ branch.working_hours || branch.opening_hours || '-' }}</td>
              <td class="col-managers">
                 <span class="manager-count">{{ branch.managers_count || 0 }}</span>
              </td>
              <td class="col-status">
                <button :class="['status-btn', { 'active': branch.is_active }]" @click="toggleStatus(branch)">
                   {{ branch.is_active ? 'نشط' : 'معطل' }}
                </button>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn view" :title="tx('عرض', 'View')" @click="openViewModal(branch)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn edit" :title="tx('تعديل', 'Edit')" @click="openEditModal(branch)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn delete" :title="tx('حذف', 'Delete')" @click="confirmDelete(branch)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="showFormModal = false">
       <div class="modal-content form-modal fade-in">
          <div class="modal-header">
             <h2>{{ isEditing ? tx('تعديل بيانات الفرع', 'Edit Branch') : tx('إضافة فرع جديد', 'Add Branch') }}</h2>
             <p>{{ tx('أدخل معلومات الفرع أدناه', 'Enter branch information below') }}</p>
             <button class="close-btn-top" @click="showFormModal = false">×</button>
          </div>
          <form @submit.prevent="submitForm">
             <div class="modal-body">
                <div class="form-grid">
                   <div class="form-group">
                      <label>{{ tx('اسم الفرع', 'Branch Name') }}</label>
                      <input type="text" v-model="form.name" required :placeholder="tx('مثال: فرع الدوار السابع', 'e.g. Seventh Circle Branch')" />
                   </div>
                   <div class="form-group">
                      <label>{{ tx('المدينة', 'City') }}</label>
                      <input type="text" v-model="form.city" required :placeholder="tx('مثال: عمان', 'e.g. Amman')" />
                   </div>
                   <div class="form-group full-width">
                      <label>{{ tx('العنوان بالكامل', 'Full Address') }}</label>
                      <input type="text" v-model="form.address" required :placeholder="tx('مثال: شارع وصفي التل، الجبيهة', 'e.g. Wasfi Al Tal Street, Jubaiha')" />
                   </div>
                   <div class="form-group">
                      <label>{{ tx('رقم الجوال', 'Phone') }}</label>
                      <input type="text" v-model="form.phone" placeholder="07xxxxxxxx" />
                   </div>
                   <div class="form-group">
                      <label>{{ tx('ساعات العمل', 'Working Hours') }}</label>
                      <input type="text" v-model="form.working_hours" :placeholder="tx('مثال: 9 ص - 10 م', 'e.g. 9 AM - 10 PM')" />
                   </div>
                   <div class="form-group">
                      <label>{{ tx('عدد المديرين', 'Number of Managers') }}</label>
                      <input type="number" v-model="form.managers_count" min="0" />
                   </div>
                   <div class="form-group">
                      <label>{{ tx('الحالة', 'Status') }}</label>
                      <select v-model="form.is_active">
                         <option :value="true">{{ tx('نشط', 'Active') }}</option>
                         <option :value="false">{{ tx('معطل', 'Disabled') }}</option>
                      </select>
                   </div>
                </div>
             </div>
             <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="showFormModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
                <button type="submit" class="btn-submit" :disabled="isSubmitting">
                   {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEditing ? tx('تحديث الفرع', 'Update Branch') : tx('إضافة الفرع', 'Add Branch')) }}
                </button>
             </div>
          </form>
       </div>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false">
       <div class="modal-content view-modal-detailed fade-in">
          <button class="close-btn-x" @click="showViewModal = false">×</button>
          
          <div class="view-header">
             <h2>{{ tx('تفاصيل الفرع', 'Branch Details') }}</h2>
             <p>{{ tx('معلومات كاملة عن الفرع', 'Complete branch information') }}</p>
          </div>

          <div class="view-body">
             <div class="view-grid-detailed">
                <!-- Row 1 -->
                <div class="detail-box">
                   <div class="label-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <span class="detail-label">{{ tx('اسم الفرع', 'Branch Name') }}</span>
                   </div>
                   <div class="detail-value">{{ currentBranch.name }}</div>
                </div>

                <div class="detail-box">
                   <div class="label-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span class="detail-label">{{ tx('المدينة', 'City') }}</span>
                   </div>
                   <div class="detail-value">{{ currentBranch.city }}</div>
                </div>

                <!-- Row 2 (Full Width) -->
                <div class="detail-box full-width">
                   <div class="label-with-icon">
                      <span class="detail-label">{{ tx('العنوان الكامل', 'Full Address') }}</span>
                   </div>
                   <div class="detail-value">{{ currentBranch.address }}</div>
                </div>

                <!-- Row 3 -->
                <div class="detail-box">
                   <div class="label-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span class="detail-label">{{ tx('رقم الهاتف', 'Phone') }}</span>
                   </div>
                   <div class="detail-value ltr-text text-right">{{ currentBranch.phone || '-' }}</div>
                </div>

                <div class="detail-box">
                   <div class="label-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span class="detail-label">{{ tx('ساعات العمل', 'Working Hours') }}</span>
                   </div>
                   <div class="detail-value ltr-text text-right">{{ currentBranch.working_hours || currentBranch.opening_hours || '-' }}</div>
                </div>

                <!-- Row 4 -->
                <div class="detail-box">
                   <div class="label-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span class="detail-label">{{ tx('عدد المديرين', 'Number of Managers') }}</span>
                   </div>
                   <div class="detail-value">{{ currentBranch.managers_count || 0 }} {{ tx('مدير', 'managers') }}</div>
                </div>

                <div class="detail-box">
                   <div class="label-with-icon">
                      <span class="detail-label">{{ tx('الحالة', 'Status') }}</span>
                   </div>
                   <div class="detail-value">
                      <span :class="['status-pill', currentBranch.is_active ? 'active' : 'inactive']">
                         {{ currentBranch.is_active ? tx('نشط', 'Active') : tx('معطل', 'Disabled') }}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div class="view-footer-new">
             <button class="btn-primary-small" @click="showViewModal = false">{{ tx('إغلاق', 'Close') }}</button>
          </div>
       </div>
    </div>

    <!-- Alert -->
    <div v-if="showAlert" :class="['alert-toast', alertType, 'show']">
       {{ alertMessage }}
    </div>
  </div>
</template>

<style scoped>
.branches-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }

/* Header */
.header-section { display: flex; justify-content: space-between; align-items: center; }
.page-title-area h1 { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin: 0; }
.page-title-area p { color: #6b7280; font-size: 0.875rem; margin: 0; }
.title-with-icon { display: flex; align-items: center; gap: 12px; }
.icon-box { background: #f3f4f6; color: #660033; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #660033;
  color: #fff;
  border: none;
  padding: 0.65rem 1.1rem;
  border-radius: 8px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover { background: #4d0026; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.stat-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 15px; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-icon.total { background: #eff6ff; color: #2563eb; }
.stat-icon.active { background: #f0fdf4; color: #16a34a; }
.stat-icon.managers { background: #f3f4f6; color: #660033; }
.stat-val { display: block; font-size: 1.25rem; font-weight: 800; color: #111827; }
.stat-label { font-size: 0.8rem; color: #6b7280; }

/* Filter Bar */
.filter-card { background: white; border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; }
.search-wrapper { position: relative; width: 100%; max-width: 100%; }
.search-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
.search-input { width: 100%; padding: 12px 45px 12px 15px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; transition: 0.3s; font-family: inherit; font-size: 0.9rem; }
.search-input:focus { border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }

/* Table */
.table-container { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f9fafb; padding: 14px; font-weight: 700; color: #4b5563; font-size: 0.85rem; border-bottom: 2px solid #f3f4f6; text-align: center; }
.data-table td { padding: 14px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; color: #374151; font-size: 0.875rem; text-align: center; }

.branch-info { display: flex; align-items: center; gap: 10px; text-align: right; justify-content: flex-start; }
.branch-icon-sm { width: 32px; height: 32px; background: #fff1f2; color: #e11d48; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.branch-name-text { font-weight: 700; color: #111827; }

.address-text { color: #6b7280; font-size: 0.8rem; }
.manager-count { background: #f1f5f9; padding: 2px 10px; border-radius: 20px; font-weight: 700; color: #475569; }

.status-btn { padding: 5px 15px; border-radius: 8px; border: none; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
.status-btn.active { background: #dcfce7; color: #15803d; }
.status-btn:not(.active) { background: #fee2e2; color: #b91c1c; }

.actions-group { display: flex; gap: 8px; justify-content: center; }
.action-btn { width: 32px; height: 32px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.action-btn.view { background: #f0f9ff; color: #0369a1; }
.action-btn.edit { background: #f3f4f6; color: #660033; }
.action-btn.delete { background: #fef2f2; color: #ef4444; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; border-radius: 20px; width: 100%; max-width: 600px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
.fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.modal-header { padding: 24px; border-bottom: 1px solid #f3f4f6; position: relative; }
.modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
.modal-header p { margin: 5px 0 0; color: #6b7280; font-size: 0.875rem; }
.close-btn-top { position: absolute; left: 24px; top: 24px; border: none; background: #f3f4f6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; color: #9ca3af; }

.modal-body { padding: 24px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.full-width { grid-column: span 2; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #374151; }
.form-group input, .form-group select { padding: 10px 15px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; transition: 0.3s; }
.form-group input:focus { border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }

.modal-footer { padding: 20px 24px; background: #f9fafb; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { background: white; border: 1px solid #e5e7eb; padding: 10px 25px; border-radius: 10px; font-weight: 700; cursor: pointer; color: #4b5563; }
.btn-submit { background: #660033; color: white; border: none; padding: 10px 25px; border-radius: 10px; font-weight: 700; cursor: pointer; }

/* New View Modal Styles */
.view-modal-detailed { background: white; border-radius: 24px; width: 100%; max-width: 600px; padding: 30px; position: relative; }
.close-btn-x { position: absolute; top: 20px; right: 20px; border: none; background: none; font-size: 1.5rem; color: #9ca3af; cursor: pointer; }
.view-header { text-align: center; margin-bottom: 30px; }
.view-header h2 { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0; }
.view-header p { color: #6b7280; font-size: 0.9rem; margin: 5px 0 0; }

.view-grid-detailed { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-box { text-align: right; }
.detail-box.full-width { grid-column: span 2; }
.label-with-icon { display: flex; align-items: center; gap: 6px; color: #9ca3af; margin-bottom: 4px; }
.detail-label { font-size: 0.8rem; font-weight: 600; }
.detail-value { font-size: 1.1rem; font-weight: 700; color: #111827; }

.status-pill { padding: 4px 15px; border-radius: 50px; font-size: 0.8rem; font-weight: 700; display: inline-block; }
.status-pill.active { background: #dcfce7; color: #15803d; }
.status-pill.inactive { background: #fee2e2; color: #b91c1c; }

.view-footer-new { margin-top: 30px; display: flex; justify-content: flex-start; }
.btn-primary-small { background: #660033; color: white; border: none; padding: 8px 25px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.3s; }
.btn-primary-small:hover { background: #4d0026; }

</style>
