<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, onMounted, computed } from 'vue';
import api from '../config/axios';
import adminManagementService from '../application/adminManagementService';
import { useAdminText } from '../composables/useAdminText';

const { tx } = useAdminText();

// State
const permissions = ref([]);
const admins = ref([]); // For assigning users
const loading = ref(false);
const loadError = ref(false);
const searchQuery = ref('');
const showFormModal = ref(false);
const isEditing = ref(false);
const currentPermission = ref(null);
const isSubmitting = ref(false);

const form = ref({
    name: '',
    description: '',
    permissions: [], // The actual permissions (json/array)
    admin_ids: []    // The users assigned to this role (if backend supports it, else we might need to handle it)
});

// Fetch Data
const fetchData = async () => {
    loading.value = true;
    loadError.value = false;
    try {
        // Admins come from the Tijara users API; the permissions list is not on the API yet and shows its own error.
        const [permRes, adminList] = await Promise.all([
            api.get('/dashboard/permissions', { params: { search: searchQuery.value } }),
            adminManagementService.listAdmins()
        ]);
        permissions.value = permRes.data.data;
        admins.value = adminList;
    } catch {
        permissions.value = [];
        loadError.value = true;
    } finally {
        loading.value = false;
    }
};

onMounted(fetchData);

// Actions
const openAddModal = () => {
    isEditing.value = false;
    form.value = {
        name: '',
        description: '',
        permissions: [],
        admin_ids: []
    };
    showFormModal.value = true;
};

const openEditModal = (permission) => {
    isEditing.value = true;
    currentPermission.value = permission;
    form.value = {
        name: permission.name,
        description: permission.description,
        permissions: permission.permissions || [],
        admin_ids: Array.isArray(permission.admin_ids) ? [...permission.admin_ids] : []
    };
    showFormModal.value = true;
};

const submitForm = async () => {
    isSubmitting.value = true;
    try {
        if (isEditing.value) {
            await api.put(`/dashboard/permissions/${currentPermission.value.id}`, form.value);
            triggerAlert('تم تحديث الصلاحية بنجاح');
        } else {
            await api.post('/dashboard/permissions', form.value);
            triggerAlert('تم إضافة الصلاحية بنجاح');
        }
        showFormModal.value = false;
        fetchData();
    } catch (error) {
        const msg = apiErrorMessage(error, 'فشل حفظ البيانات');
        triggerAlert(msg, 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const confirmDelete = async (permission) => {
    if (confirm(`هل أنت متأكد من حذف الصلاحية "${permission.name}"؟`)) {
        try {
            await api.delete(`/dashboard/permissions/${permission.id}`);
            triggerAlert('تم حذف الصلاحية بنجاح');
            fetchData();
        } catch (error) {
            triggerAlert('فشل عملية الحذف', 'error');
        }
    }
};

// Selection logic for admins in modal
const adminSearch = ref('');
const filteredAdmins = computed(() => {
    if (!adminSearch.value) return admins.value;
    return admins.value.filter(a => a.name.toLowerCase().includes(adminSearch.value.toLowerCase()));
});

const toggleAdminSelection = (id) => {
    const stringId = String(id);
    const index = form.value.admin_ids.indexOf(stringId);
    if (index > -1) {
        form.value.admin_ids.splice(index, 1);
    } else {
        form.value.admin_ids.push(stringId);
    }
};

// Stats
const totalPermissions = computed(() => permissions.value.length);
const activeCount = computed(() => permissions.value.length); // Assume all for now unless status field exists
const inactiveCount = ref(0);
const totalAssignedUsers = computed(() => {
    const allIds = permissions.value.flatMap(p => p.admin_ids || []);
    return [...new Set(allIds)].length;
});

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
  <div class="permissions-page p-6">
    <!-- Breadcrumbs -->
    <div class="breadcrumb mb-4">
       <span>{{ tx('لوحة التحكم الرئيسية', 'Dashboard') }}</span>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
       <span class="active">{{ tx('إدارة الصلاحيات', 'Permissions') }}</span>
    </div>

    <!-- Header -->
    <div class="header-section mb-6">
        <div class="page-title-area">
            <div class="title-with-icon">
                <div class="icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                    <h1>{{ tx('إدارة الصلاحيات', 'Permissions') }}</h1>
                    <p>{{ tx('إنشاء وإدارة صلاحيات النظام وتعيينها للمستخدمين', 'Create and manage system permissions assigned to users') }}</p>
                </div>
            </div>
        </div>
        <div class="left-actions">
            <button class="add-btn" @click="openAddModal">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
               {{ tx('إنشاء صلاحية جديدة', 'Create Permission') }}
            </button>
        </div>
    </div>

    <!-- Filter & Stats -->
    <div class="stats-row mb-6">
       <div class="stat-card">
          <span class="stat-val">{{ totalPermissions }}</span>
          <span class="stat-label">{{ tx('إجمالي الصلاحيات', 'Total Permissions') }}</span>
       </div>
       <div class="stat-card">
          <span class="stat-val">{{ activeCount }}</span>
          <span class="stat-label">{{ tx('مفعلة', 'Active') }}</span>
       </div>
       <div class="stat-card">
          <span class="stat-val">{{ inactiveCount }}</span>
          <span class="stat-label">{{ tx('غير مفعلة', 'Inactive') }}</span>
       </div>
       <div class="stat-card">
          <span class="stat-val">{{ totalAssignedUsers }}</span>
          <span class="stat-label">{{ tx('إجمالي المستخدمين', 'Total Users') }}</span>
       </div>
    </div>

    <!-- Search Bar -->
    <div class="filter-card shadow-sm mb-6">
       <div class="flex-row gap-4">
          <div class="search-wrapper flex-1">
             <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
             <input type="text" v-model="searchQuery" @input="fetchData" :placeholder="tx('البحث باسم الصلاحية أو المستخدم...', 'Search permission or user...')" class="search-input" />
          </div>
          <div class="select-wrapper">
             <select class="form-select">
                <option>{{ tx('جميع المستخدمين', 'All Users') }}</option>
             </select>
          </div>
       </div>
    </div>

    <!-- Table -->
    <div class="table-container shadow-sm">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">{{ tx('رقم الصلاحية', 'Permission ID') }}</th>
            <th class="col-name text-right">{{ tx('اسم الصلاحية', 'Permission Name') }}</th>
            <th class="col-desc">{{ tx('الوصف', 'Description') }}</th>
            <th class="col-users">{{ tx('المستخدمون المخصص لهم', 'Assigned Users') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="6">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="loadError" class="state-row" data-testid="permissions-error"><td colspan="6">{{ tx('تعذّر تحميل الصلاحيات، الخدمة غير متاحة على الخادم حالياً.', 'Could not load permissions. The service is not available on the server right now.') }} <button type="button" class="retry-link" @click="fetchData">{{ tx('إعادة المحاولة', 'Retry') }}</button></td></tr>
          <tr v-else-if="permissions.length === 0" class="state-row"><td colspan="6">{{ tx('لا توجد صلاحيات حالياً', 'No permissions yet') }}</td></tr>
          <template v-else>
            <tr v-for="permission in permissions" :key="permission.id" class="data-row">
              <td class="col-id">#{{ permission.id }}</td>
              <td class="col-name text-right">
                <div class="flex-center gap-2">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#660033" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                   <span class="perm-name-text">{{ permission.name }}</span>
                </div>
              </td>
              <td class="col-desc">
                 <div class="desc-truncate">{{ permission.description || '-' }}</div>
              </td>
              <td class="col-users">
                 <div class="users-avatars">
                    <div class="avatar-item-wrapper" v-for="admin in (permission.admins || []).slice(0, 3)" :key="admin.id">
                       <img :src="admin.avatar" v-if="admin.avatar" :title="admin.name" />
                       <div class="avatar-placeholder-inline" v-else :title="admin.name">{{ admin.name.charAt(0) }}</div>
                    </div>
                    <span class="user-count-badge" v-if="permission.admins_count > 0">({{ permission.admins_count }})</span>
                    <span class="user-count-badge" v-else>{{ tx('لا يوجد', 'None') }}</span>
                 </div>
              </td>
              <td class="col-status">
                 <span class="status-badge-new active">{{ tx('مفعلة', 'Active') }}</span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn edit" :title="tx('تعديل', 'Edit')" @click="openEditModal(permission)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn delete" :title="tx('حذف', 'Delete')" @click="confirmDelete(permission)">
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
       <div class="modal-content form-modal-perm fade-in">
          <button class="close-btn-x" @click="showFormModal = false">×</button>
          
          <div class="modal-header-perm">
             <h2>{{ isEditing ? tx('تعديل الصلاحية', 'Edit Permission') : tx('إنشاء صلاحية جديدة', 'Create Permission') }}</h2>
             <p>{{ tx('أدخل بيانات الصلاحية من للمستخدمين التي سيتم منحهم إياها', 'Enter the permission details and assign users') }}</p>
          </div>

          <form @submit.prevent="submitForm">
             <div class="modal-body-perm">
                <div class="form-group-perm mb-4">
                   <label>{{ tx('اسم الصلاحية', 'Permission Name') }} <span class="req">*</span></label>
                   <input type="text" v-model="form.name" required :placeholder="tx('مثال: إدارة المنتجات', 'e.g. Product Management')" />
                </div>
                <div class="form-group-perm mb-4">
                   <label>{{ tx('الوصف', 'Description') }}</label>
                   <textarea v-model="form.description" rows="3" :placeholder="tx('وصف موجز للصلاحية...', 'Brief permission description...')"></textarea>
                </div>

                <!-- Admin Selection Search -->
                <div class="admin-selector">
                   <label class="mb-2 block font-bold">{{ tx('المستخدمين المخصص لهم', 'Assigned Users') }}</label>
                   <div class="search-admins-box mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" v-model="adminSearch" :placeholder="tx('البحث عن اسم مستخدم...', 'Search user name...')" />
                   </div>
                   
                   <div class="admins-list-box">
                      <div class="admin-item" v-for="admin in filteredAdmins" :key="admin.id" @click="toggleAdminSelection(admin.id)">
                         <div class="admin-info-box">
                            <img :src="admin.avatar" v-if="admin.avatar" class="admin-avatar-sm" />
                            <div class="avatar-placeholder-sm" v-else>{{ admin.name.charAt(0) }}</div>
                            <div class="admin-names">
                               <span class="a-name">{{ admin.name }}</span>
                               <span class="a-email">{{ admin.email }}</span>
                            </div>
                         </div>
                         <input type="checkbox" :checked="form.admin_ids.includes(String(admin.id))" @click.stop="toggleAdminSelection(admin.id)" />
                      </div>
                   </div>
                </div>
             </div>

             <div class="modal-footer-perm">
                <button type="button" class="btn-cancel-new" @click="showFormModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
                <button type="submit" class="btn-submit-new" :disabled="isSubmitting">
                   {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : tx('إنشاء الصلاحية', 'Create Permission') }}
                </button>
             </div>
          </form>
       </div>
    </div>

    <!-- Alert -->
    <div v-if="showAlert" :class="['alert-toast', alertType, 'show']">
       {{ alertMessage }}
    </div>
  </div>
</template>

<style scoped>
.permissions-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }

/* Breadcrumbs */
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #9ca3af; }
.breadcrumb svg { transform: rotate(180deg); color: #d1d5db; }
.breadcrumb .active { color: #660033; font-weight: 700; }

/* Header */
.header-section { display: flex; justify-content: space-between; align-items: center; }
.page-title-area h1 { font-size: 1.4rem; font-weight: 800; color: #1f2937; margin: 0; }
.page-title-area p { color: #6b7280; font-size: 0.85rem; margin: 0; }
.title-with-icon { display: flex; align-items: center; gap: 12px; }
.icon-box { background: #f3f4f6; color: #660033; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }

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
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.stat-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; }
.stat-val { font-size: 1.5rem; font-weight: 800; color: #111827; }
.stat-label { font-size: 0.8rem; color: #6b7280; font-weight: 600; }

/* Filter Card */
.filter-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e5e7eb; }
.flex-row { display: flex; align-items: center; gap: 15px; }
.search-wrapper { position: relative; }
.search-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
.search-input { width: 100%; padding: 10px 45px 10px 15px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; transition: 0.3s; font-size: 0.9rem; }
.form-select { padding: 10px 35px 10px 15px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; background: #f9fafb; font-family: inherit; font-size: 0.85rem; color: #4b5563; appearance: none; position: relative; }

/* Table */
.table-container { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f9fafb; padding: 15px; font-weight: 700; color: #6b7280; font-size: 0.8rem; border-bottom: 2px solid #f3f4f6; text-align: center; }
.data-table td { padding: 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; color: #374151; font-size: 0.85rem; text-align: center; }
.data-row:hover { background: #f3f4f6; }

.col-id { color: #9ca3af; font-weight: 700; font-family: sans-serif; width: 100px; }
.perm-name-text { font-weight: 700; color: #111827; font-size: 0.9rem; }
.desc-truncate { color: #6b7280; font-size: 0.8rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0 auto; }

.users-avatars { display: flex; align-items: center; justify-content: center; position: relative; }
.avatar-item-wrapper { width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; overflow: hidden; margin-left: -12px; position: relative; z-index: 1; }
.avatar-item-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder-inline { width: 100%; height: 100%; background: #660033; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
.avatar-placeholder-sm { width: 32px; height: 32px; border-radius: 50%; background: #f3f4f6; color: #660033; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; }
.user-count-badge { font-size: 0.75rem; color: #9ca3af; margin-right: 15px; }

.status-badge-new { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
.status-badge-new.active { background: #ecfdf5; color: #059669; }

.actions-group { display: flex; gap: 8px; justify-content: center; }
.action-btn { width: 30px; height: 30px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.action-btn.edit { background: #f3f4f6; color: #660033; }
.action-btn.delete { background: #fef2f2; color: #ef4444; }

/* MODAL - Premium Form */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.form-modal-perm { background: white; border-radius: 24px; width: 100%; max-width: 500px; padding: 35px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.close-btn-x { position: absolute; top: 20px; right: 20px; border: none; background: #f3f4f6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9ca3af; cursor: pointer; font-size: 1.2rem; }

.modal-header-perm { text-align: center; margin-bottom: 30px; }
.modal-header-perm h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #111827; }
.modal-header-perm p { margin: 6px 0 0; color: #6b7280; font-size: 0.85rem; }

.form-group-perm label { display: block; font-weight: 800; font-size: 0.85rem; color: #374151; margin-bottom: 8px; text-align: right; }
.form-group-perm input, .form-group-perm textarea { width: 100%; padding: 12px 15px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; transition: 0.3s; font-family: inherit; font-size: 0.9rem; }
.form-group-perm input:focus, .form-group-perm textarea:focus { border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }
.req { color: #dc2626; }

/* Admin List in Modal */
.admin-selector { border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 20px; }
.search-admins-box { position: relative; display: flex; align-items: center; }
.search-admins-box svg { position: absolute; right: 12px; }
.search-admins-box input { width: 100%; padding: 9px 35px 9px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.85rem; }

.admins-list-box { max-height: 200px; overflow-y: auto; border: 1px solid #f3f4f6; border-radius: 10px; padding: 5px; }
.admin-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.admin-item:hover { background: #f9fafb; }
.admin-info-box { display: flex; align-items: center; gap: 10px; }
.admin-avatar-sm { width: 32px; height: 32px; border-radius: 50%; }
.admin-names { display: flex; flex-direction: column; }
.a-name { font-size: 0.85rem; font-weight: 700; color: #111827; }
.a-email { font-size: 0.75rem; color: #9ca3af; font-family: sans-serif; }

.modal-footer-perm { display: flex; gap: 12px; margin-top: 30px; }
.btn-cancel-new { flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; font-weight: 700; cursor: pointer; color: #4b5563; }
.btn-submit-new { flex: 2; padding: 12px; border: none; border-radius: 10px; background: #660033; color: white; font-weight: 700; cursor: pointer; }

/* Alert */
.retry-link { background: none; border: none; color: #660033; font-weight: 700; text-decoration: underline; cursor: pointer; font-family: inherit; }

.flex-center { display: flex; align-items: center; align-content: center; }
.desc-truncate { text-align: right; margin-right: 0; }
</style>
