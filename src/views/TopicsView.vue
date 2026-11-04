<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, onMounted, computed } from 'vue';
import api from '../config/axios';
import { useAdminText } from '../composables/useAdminText';

const { tx, locale } = useAdminText();

// State
const topics = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const showFormModal = ref(false);
const showViewModal = ref(false);
const isEditing = ref(false);
const currentTopic = ref(null);
const isSubmitting = ref(false);
// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.
const formLang = () => (locale.value === 'en' ? 'en' : 'ar');
const activeLang = ref(formLang());

const form = ref({
    title_ar: '',
    title_en: '',
    content_ar: '',
    content_en: '',
});


// Fetch Topics
const fetchTopics = async () => {
    loading.value = true;
    try {
        const response = await api.get('/dashboard/topics');
        topics.value = response.data.data;
    } catch (error) {
        triggerAlert('فشل تحميل صفحات الموقع', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(fetchTopics);

const filteredTopics = computed(() => {
    const q = (searchQuery.value || '').toLowerCase();
    if (!q) return topics.value;

    return topics.value.filter(t => {
        const titleAr = (t.title_i18n?.ar || t.title || '').toString().toLowerCase();
        const titleEn = (t.title_i18n?.en || '').toString().toLowerCase();
        return titleAr.includes(q) || titleEn.includes(q);
    });
});

// Actions
const openAddModal = () => {
    isEditing.value = false;
    form.value = {
        title_ar: '',
        title_en: '',
        content_ar: '',
        content_en: '',
    };
    activeLang.value = formLang();
    showFormModal.value = true;
};

const openEditModal = (topic) => {
    isEditing.value = true;
    currentTopic.value = topic;
    const titleObj = topic.title_i18n && typeof topic.title_i18n === 'object' ? topic.title_i18n : null;
    const contentObj = topic.content_i18n && typeof topic.content_i18n === 'object' ? topic.content_i18n : null;
    form.value = {
        title_ar: titleObj?.ar ?? topic.title ?? '',
        title_en: titleObj?.en ?? '',
        content_ar: contentObj?.ar ?? topic.content ?? '',
        content_en: contentObj?.en ?? '',
    };
    activeLang.value = formLang();
    showFormModal.value = true;
};

const openViewModal = (topic) => {
    currentTopic.value = topic;
    showViewModal.value = true;
};

const submitForm = async () => {
    // Validate bilingual fields
    if (!String(form.value.title_ar || '').trim()) {
        activeLang.value = 'ar';
        triggerAlert('عنوان الصفحة بالعربي مطلوب', 'error');
        return;
    }
    if (!String(form.value.title_en || '').trim()) {
        activeLang.value = 'en';
        triggerAlert('عنوان الصفحة بالإنجليزية مطلوب', 'error');
        return;
    }
    if (!String(form.value.content_ar || '').trim()) {
        activeLang.value = 'ar';
        triggerAlert('المحتوى بالعربي مطلوب', 'error');
        return;
    }
    if (!String(form.value.content_en || '').trim()) {
        activeLang.value = 'en';
        triggerAlert('المحتوى بالإنجليزية مطلوب', 'error');
        return;
    }

    isSubmitting.value = true;
    try {
        const payload = {
            title: JSON.stringify({ ar: form.value.title_ar || '', en: form.value.title_en || '' }),
            content: JSON.stringify({ ar: form.value.content_ar || '', en: form.value.content_en || '' }),
            status: 'published',
        };

        if (isEditing.value) {
            await api.put(`/dashboard/topics/${currentTopic.value.id}`, payload);
            triggerAlert('تم تحديث الصفحة بنجاح');
        } else {
            await api.post('/dashboard/topics', payload);
            triggerAlert('تم إضافة الصفحة بنجاح');
        }
        showFormModal.value = false;
        fetchTopics();
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

const confirmDelete = async (topic) => {
    if (confirm(tx(`هل أنت متأكد من حذف صفحة "${topic.title_i18n?.ar || topic.title}"؟`, `Are you sure you want to delete the page "${topic.title_i18n?.en || topic.title}"?`))) {
        try {
            await api.delete(`/dashboard/topics/${topic.id}`);
            triggerAlert('تم حذف الصفحة بنجاح');
            fetchTopics();
        } catch (error) {
            triggerAlert('فشل عملية الحذف', 'error');
        }
    }
};

const toggleStatus = async (topic) => {
    try {
        const newStatus = topic.status === 'published' ? 'draft' : 'published';
        await api.put(`/dashboard/topics/${topic.id}`, { ...topic, status: newStatus });
        topic.status = newStatus;
        triggerAlert(newStatus === 'published' ? 'تم نشر الصفحة' : 'تم تحويل الصفحة لمسودة');
    } catch (error) {
        triggerAlert('فشل تحديث الحالة', 'error');
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

const formatStatus = (status) => {
    return status === 'published' ? tx('منشور', 'Published') : tx('مسودة', 'Draft');
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toISOString().split('T')[0];
};
</script>

<template>
  <div class="topics-page p-6">
    <!-- Breadcrumbs -->
    <div class="breadcrumb mb-4">
       <span>{{ tx('لوحة التحكم الرئيسية', 'Dashboard') }}</span>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
       <span class="active">{{ tx('صفحات الموقع', 'Website Pages') }}</span>
    </div>

    <p class="scope-note" data-testid="topics-scope-note">
      {{ tx('صفحات «من نحن» و«سياسة الخصوصية» و«الشروط والأحكام» تُدار من', 'The About, Privacy Policy and Terms & Conditions pages are managed from') }}
      <router-link to="/admin/settings/about">{{ tx('إعداد الموقع', 'Site setup') }}</router-link>
      {{ tx('ولا تُضاف هنا. هذه الصفحة للمحتوى الإضافي فقط.', 'and are not added here. This page is for extra content only.') }}
    </p>

    <!-- Header -->
    <div class="header-section mb-6">
        <div class="page-title-area">
            <div class="title-with-icon">
                <div class="icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <div>
                    <h1>{{ tx('صفحات الموقع', 'Website Pages') }}</h1>
                    <p>{{ tx('إدارة صفحات الموقع والمحتوى التعريفي', 'Manage website pages and informational content') }}</p>
                </div>
            </div>
        </div>
        <div class="left-actions">
            <button class="add-btn" @click="openAddModal">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
               {{ tx('إضافة صفحة جديدة', 'Add Page') }}
            </button>
        </div>
        
    </div>

    <!-- Filter Bar -->
    <div class="filter-card shadow-sm mb-6">
       <div class="search-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن صفحة...', 'Search pages...')" class="search-input" />
       </div>
    </div>

    <!-- Table -->
    <div class="table-container shadow-sm">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-title text-right">{{ tx('العنوان', 'Title') }}</th>
            <th class="col-views">{{ tx('المشاهدات', 'Views') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="4">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredTopics.length === 0" class="state-row"><td colspan="4">{{ tx('لا توجد صفحات حالياً', 'No pages yet') }}</td></tr>
          <template v-else>
            <tr v-for="topic in filteredTopics" :key="topic.id" class="data-row">
              <td class="col-title text-right">
                <span class="topic-title-text">{{ topic.title_i18n?.ar || topic.title }}</span>
              </td>
              <td class="col-views">{{ topic.views || 0 }}</td>
              <td class="col-status">
                <button :class="['status-btn', topic.status]" @click="toggleStatus(topic)">
                   {{ formatStatus(topic.status) }}
                </button>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <a v-if="topic.slug" :href="'/' + String(topic.slug).replace(/^[\\/]+/, '')" target="_blank" rel="noopener noreferrer" class="action-btn website" :title="tx('عرض على الموقع', 'View on Website')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                  <button class="action-btn view" :title="tx('عرض', 'View')" @click="openViewModal(topic)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn edit" :title="tx('تعديل', 'Edit')" @click="openEditModal(topic)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn delete" :title="tx('حذف', 'Delete')" @click="confirmDelete(topic)">
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
             <h2>{{ isEditing ? tx('تعديل الصفحة', 'Edit Page') : tx('إضافة صفحة جديدة', 'Add Page') }}</h2>
             <p>{{ tx('أدخل تفاصيل محتوى الصفحة أدناه', 'Enter the page content details below') }}</p>
             <button class="close-btn-top" @click="showFormModal = false">×</button>
          </div>
          <form @submit.prevent="submitForm">
             <div class="modal-body">
                <div class="i18n-toggle" role="tablist" aria-label="Language" dir="ltr">
                  <button type="button" class="i18n-btn" :class="{ active: activeLang === 'en' }" @click="activeLang = 'en'">English</button>
                  <button type="button" class="i18n-btn" :class="{ active: activeLang === 'ar' }" @click="activeLang = 'ar'">العربية</button>
                </div>
                <div class="form-grid">
                   <div class="form-group full-width">
                      <label>{{ tx('عنوان الصفحة', 'Page Title') }} <span class="req">*</span></label>
                      <input v-show="activeLang === 'ar'" type="text" v-model="form.title_ar" placeholder="مثال: سياسة الخصوصية" />
                      <input v-show="activeLang === 'en'" type="text" v-model="form.title_en" placeholder="Page title in English" />
                   </div>
                   <div class="form-group full-width">
                      <label>{{ tx('المحتوى', 'Content') }} <span class="req">*</span></label>
                      <textarea v-show="activeLang === 'ar'" v-model="form.content_ar" rows="6" placeholder="أدخل محتوى الصفحة هنا..."></textarea>
                      <textarea v-show="activeLang === 'en'" v-model="form.content_en" rows="6" placeholder="Page content in English..."></textarea>
                   </div>
                </div>
             </div>
             <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="showFormModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
                <button type="submit" class="btn-submit" :disabled="isSubmitting">
                   {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEditing ? tx('تحديث الصفحة', 'Update Page') : tx('إضافة الصفحة', 'Add Page')) }}
                </button>
             </div>
          </form>
       </div>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false">
       <div class="modal-content view-modal-topic fade-in">
          <button class="close-btn-x" @click="showViewModal = false">×</button>
          
          <div class="view-header">
             <h2>{{ tx('تفاصيل الصفحة', 'Page Details') }}</h2>
             <p>{{ tx('معلومات كاملة عن الصفحة', 'Complete page information') }}</p>
          </div>

          <div class="view-body-topic">
             <div class="topic-info-grid">
                <div class="info-item">
                   <span class="info-label">{{ tx('العنوان', 'Title') }}</span>
                   <div class="info-value large">{{ currentTopic.title_i18n?.ar || currentTopic.title }}</div>
                </div>
                
                <div class="info-grid-row">
                   <div class="info-item">
                   <span class="info-label">{{ tx('المشاهدات', 'Views') }}</span>
                      <div class="info-value">{{ currentTopic.views || 0 }} {{ tx('مشاهدة', 'views') }}</div>
                   </div>
                   <div class="info-item" v-if="currentTopic.slug">
                   <span class="info-label">{{ tx('رابط الصفحة', 'Page URL') }}</span>
                      <a :href="'/' + String(currentTopic.slug).replace(/^[\\/]+/, '')" target="_blank" rel="noopener noreferrer" class="topic-link">{{ '/' + String(currentTopic.slug).replace(/^[\\/]+/, '') }}</a>
                   </div>
                </div>

                <div class="info-item full-width">
                  <span class="info-label">{{ tx('المحتوى', 'Content') }}</span>
                  <div class="info-value content-box">{{ currentTopic.content_i18n?.ar || currentTopic.content }}</div>
               </div>

                <div class="info-item">
                   <span class="info-label">{{ tx('الحالة', 'Status') }}</span>
                   <span :class="['status-pill', currentTopic.status]">
                      {{ formatStatus(currentTopic.status) }}
                   </span>
                </div>
             </div>
          </div>

          <div class="view-footer-topic">
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
.topics-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }

/* Breadcrumbs */
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #9ca3af; }
.breadcrumb svg { transform: rotate(180deg); color: #d1d5db; }
.breadcrumb .active { color: #660033; font-weight: 700; }

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

.topic-title-text { font-weight: 700; color: #111827; }

.i18n-toggle { display: inline-flex; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; margin: 0 auto 18px; }
.i18n-btn { border: none; background: transparent; padding: 0.4rem 0.9rem; font-weight: 800; font-size: 0.85rem; cursor: pointer; color: #6b7280; min-width: 96px; font-family: 'IBM Plex Sans Arabic', sans-serif; }
.i18n-btn.active { background: #660033; color: #fff; }
.category-badge { background: #f3f4f6; color: #4b5563; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

.status-btn { padding: 5px 15px; border-radius: 8px; border: none; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
.status-btn.published { background: #dcfce7; color: #15803d; }
.status-btn.draft { background: #f3f4f6; color: #6b7280; }

.actions-group { display: flex; gap: 8px; justify-content: center; }
.action-btn { width: 32px; height: 32px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.action-btn.view { background: #f0f9ff; color: #0369a1; }
.action-btn.edit { background: #f3f4f6; color: #660033; }
.action-btn.delete { background: #fef2f2; color: #ef4444; }
.action-btn.website { background: #ecfdf5; color: #059669; text-decoration: none; }
.topic-link { font-size: 0.85rem; color: #660033; font-weight: 600; text-decoration: none; direction: ltr; display: inline-block; }
.topic-link:hover { text-decoration: underline; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; border-radius: 20px; width: 100%; max-width: 650px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
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
.form-group input, .form-group select, .form-group textarea { padding: 10px 15px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; transition: 0.3s; font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }

.modal-footer { padding: 20px 24px; background: #f9fafb; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { background: white; border: 1px solid #e5e7eb; padding: 10px 25px; border-radius: 10px; font-weight: 700; cursor: pointer; color: #4b5563; }
.btn-submit { background: #660033; color: white; border: none; padding: 10px 25px; border-radius: 10px; font-weight: 700; cursor: pointer; }

/* View Topic Specific */
.view-modal-topic { background: white; border-radius: 24px; width: 100%; max-width: 600px; padding: 30px; position: relative; }
.close-btn-x { position: absolute; top: 20px; right: 20px; border: none; background: none; font-size: 1.5rem; color: #9ca3af; cursor: pointer; }
.topic-info-grid { display: flex; flex-direction: column; gap: 20px; }
.info-grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.info-item { text-align: right; }
.info-label { display: block; font-size: 0.8rem; font-weight: 600; color: #9ca3af; margin-bottom: 4px; }
.info-value { font-size: 1rem; font-weight: 700; color: #111827; }
.info-value.large { font-size: 1.3rem; }
.info-content-box { background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; font-size: 0.9rem; color: #4b5563; line-height: 1.6; max-height: 200px; overflow-y: auto; }

.status-pill { padding: 4px 15px; border-radius: 50px; font-size: 0.8rem; font-weight: 700; display: inline-block; }
.status-pill.published { background: #dcfce7; color: #15803d; }
.status-pill.draft { background: #f3f4f6; color: #6b7280; }

.view-footer-topic { margin-top: 30px; display: flex; justify-content: flex-start; }
.btn-primary-small { background: #660033; color: white; border: none; padding: 8px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; }

/* Alert */

.ltr-text { direction: ltr; text-align: left; }
.scope-note { margin: 0 0 1rem; padding: 10px 14px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; color: #4b5563; font-size: 13px; line-height: 1.7; }
.scope-note a { color: #660033; font-weight: 600; text-decoration: underline; }
</style>
