<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { ref, onMounted, computed } from 'vue';
import api from '../config/axios';
import { useAdminText } from '../composables/useAdminText';

const { tx } = useAdminText();

// State
const logs = ref([]);
const admins = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedAdmin = ref('');
const selectedActionType = ref('');

// Fetch Data
const fetchLogs = async () => {
    loading.value = true;
    try {
        const response = await api.get('/dashboard/activity-logs', {
            params: {
                search: searchQuery.value,
                admin_id: selectedAdmin.value,
                action_type: selectedActionType.value
            }
        });
        logs.value = response.data.data;
    } catch (error) {
        triggerAlert('فشل تحميل سجل الأنشطة', 'error');
    } finally {
        loading.value = false;
    }
};

const fetchAdmins = async () => {
    try {
        const response = await api.get('/dashboard/admins');
        admins.value = response.data.data;
    } catch (error) {
        console.error('Failed to fetch admins');
    }
};

onMounted(() => {
    fetchLogs();
    fetchAdmins();
});

// Actions
const deleteLog = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        try {
            await api.delete(`/dashboard/activity-logs/${id}`);
            triggerAlert('تم حذف السجل بنجاح');
            fetchLogs();
        } catch (error) {
            triggerAlert('فشل حذف السجل', 'error');
        }
    }
};

// Helpers
const getActionTypeColor = (type) => {
    switch (type) {
        case 'order': return '#660033';
        case 'product': return '#10b981';
        case 'user': return '#3b82f6';
        case 'setting': return '#f59e0b';
        default: return '#6b7280';
    }
};

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
  <div class="activity-page p-6">
    <!-- Breadcrumbs -->
    <div class="breadcrumb mb-4">
       <span>{{ tx('لوحة التحكم الرئيسية', 'Dashboard') }}</span>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
       <span class="active">{{ tx('سجل الأنشطة', 'Activity Log') }}</span>
    </div>

    <!-- Header -->
    <div class="header-section mb-6">
        <div class="page-title-area">
            <div class="title-with-icon">
                <div class="icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                </div>
                <div>
                    <h1>{{ tx('تقارير لوحة التحكم', 'Dashboard Reports') }}</h1>
                    <p>{{ tx('سجل نشاطات المديرين والإجراءات المتخذة', 'Log of administrator activity and actions') }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters Card -->
    <div class="filters-card shadow-sm mb-6">
       <div class="flex-row gap-4">
          <div class="search-wrapper flex-1">
             <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
             <input type="text" v-model="searchQuery" @input="fetchLogs" :placeholder="tx('البحث في النشاطات...', 'Search activity...')" class="search-input" />
          </div>
          
          <div class="select-wrapper">
             <select v-model="selectedActionType" @change="fetchLogs" class="form-select">
                <option value="">{{ tx('جميع النشاطات', 'All Activity') }}</option>
                <option value="order">{{ tx('الطلبات', 'Orders') }}</option>
                <option value="product">{{ tx('المنتجات', 'Products') }}</option>
                <option value="user">{{ tx('المستخدمين', 'Users') }}</option>
                <option value="setting">{{ tx('الإعدادات', 'Settings') }}</option>
             </select>
          </div>

          <div class="select-wrapper">
             <select v-model="selectedAdmin" @change="fetchLogs" class="form-select">
                <option value="">{{ tx('جميع المديرين', 'All Admins') }}</option>
                <option v-for="admin in admins" :key="admin.id" :value="admin.id">{{ admin.name }}</option>
             </select>
          </div>
       </div>
    </div>

    <!-- Logs List -->
    <div class="logs-list">
       <div v-if="loading" class="text-center p-10 color-gray">{{ tx('جاري التحميل...', 'Loading...') }}</div>
       <div v-else-if="logs.length === 0" class="text-center p-10 color-gray">{{ tx('لا توجد سجلات مطابقة', 'No matching activity logs') }}</div>
       <template v-else>
          <div v-for="log in logs" :key="log.id" class="log-card fade-in mb-4">
             <!-- Trash Icon Left -->
             <button class="delete-btn" @click="deleteLog(log.id)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
             </button>

             <!-- Content Area -->
             <div class="log-main-content">
                <div class="admin-part">
                   <div class="admin-names">
                      <span class="a-name">{{ log.admin_name }}</span>
                      <span class="a-role">{{ log.admin_role || tx('مدير', 'Admin') }}</span>
                   </div>
                   <div class="admin-avatar">
                      <img :src="log.admin_avatar" v-if="log.admin_avatar" />
                      <div class="avatar-placeholder" v-else>{{ log.admin_name.charAt(0) }}</div>
                   </div>
                </div>

                <div class="action-description">
                   <p>{{ log.action }}</p>
                </div>

                <div class="type-icon-box" :style="{ backgroundColor: getActionTypeColor(log.action_type) + '15', color: getActionTypeColor(log.action_type) }">
                   <svg v-if="log.action_type === 'order'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                   <svg v-else-if="log.action_type === 'product'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                   <svg v-else-if="log.action_type === 'user'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                   <svg v-else-if="log.action_type === 'setting'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                   <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
             </div>

             <!-- Time Area -->
             <div class="log-footer">
                <div class="time-stamp">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                   <span>{{ log.time }}</span>
                   <span class="mx-1">|</span>
                   <span>{{ log.date }}</span>
                </div>
             </div>
          </div>
       </template>
    </div>

    <!-- Alert -->
    <div v-if="showAlert" :class="['alert-toast', alertType, 'show']">
       {{ alertMessage }}
    </div>
  </div>
</template>

<style scoped>
.activity-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }

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

/* Filters Card */
.filters-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #f3f4f6; }
.flex-row { display: flex; align-items: center; gap: 15px; }
.search-wrapper { position: relative; }
.search-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
.search-input { width: 100%; padding: 10px 45px 10px 15px; border: 1px solid #f3f4f6; border-radius: 10px; outline: none; transition: 0.3s; font-size: 0.9rem; background: #fafafa; }
.form-select { padding: 10px 35px 10px 15px; border: 1px solid #f3f4f6; border-radius: 10px; outline: none; background: #fafafa; font-family: inherit; font-size: 0.85rem; color: #6b7280; appearance: none; min-width: 150px; }

/* Log Card */
.log-card {
  background: white;
  border-radius: 12px;
  padding: 15px 20px;
  border: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  position: relative;
  transition: 0.2s;
}
.log-card:hover { border-color: #e5e7eb; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }

.delete-btn { background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; opacity: 0.4; transition: 0.2s; margin-left: 20px; }
.delete-btn:hover { opacity: 1; background: #fef2f2; border-radius: 8px; }

.log-main-content { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 20px; }

.type-icon-box { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

.action-description { flex: 1; text-align: right; }
.action-description p { margin: 0; color: #4b5563; font-size: 0.95rem; font-weight: 500; }

.admin-part { display: flex; align-items: center; gap: 12px; min-width: 180px; justify-content: flex-end; }
.admin-names { text-align: right; }
.a-name { display: block; font-weight: 700; color: #111827; font-size: 0.9rem; }
.a-role { font-size: 0.75rem; color: #9ca3af; font-weight: 600; }

.admin-avatar { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: #f3f4f6; flex-shrink: 0; }
.admin-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #660033; font-weight: 800; font-size: 0.85rem; }

.log-footer { margin-right: 20px; border-right: 1px solid #f3f4f6; padding-right: 20px; }
.time-stamp { display: flex; align-items: center; gap: 6px; color: #9ca3af; font-size: 0.75rem; font-weight: 600; font-family: sans-serif; }
.time-stamp svg { color: #d1d5db; }

/* Alert */

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mx-1 { margin: 0 4px; }
.color-gray { color: #9ca3af; }
</style>
