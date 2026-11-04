<template>
  <div class="brands-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <h2 class="page-title">{{ tx('العلامات التجارية', 'Brands') }}</h2>
        <p class="page-subtitle">{{ tx('إدارة الماركات والعلامات التجارية للمنتجات', 'Manage product brands') }}</p>
      </div>
      <button class="add-btn" @click="openAddModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة علامة تجارية', 'Add Brand') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon-wrapper total-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('إجمالي العلامات التجارية', 'Total Brands') }}</span>
          <span class="stat-value">{{ brands.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper active-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('العلامات النشطة', 'Active Brands') }}</span>
          <span class="stat-value">{{ activeBrandsCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن اسم العلامة...', 'Search brand name...')" class="search-input" />
      </div>
      <div class="filter-select">
        <select v-model="statusFilter" class="form-select">
          <option value="">{{ tx('جميع الحالات', 'All Statuses') }}</option>
          <option value="1">{{ tx('نشط', 'Active') }}</option>
          <option value="0">{{ tx('غير نشط', 'Inactive') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="select-icon">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-logo">{{ tx('اللوجو', 'Logo') }}</th>
            <th class="col-name">{{ tx('اسم العلامة التجارية', 'Brand Name') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-order">{{ tx('الترتيب', 'Sort Order') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row">
            <td colspan="5">{{ tx('جاري التحميل...', 'Loading...') }}</td>
          </tr>
          <tr v-else-if="filteredBrands.length === 0" class="state-row">
            <td colspan="5">{{ tx('لا توجد علامات تجارية مطابقة للبحث', 'No brands match your search') }}</td>
          </tr>
          <template v-else>
            <tr v-for="brand in filteredBrands" :key="brand.id" class="data-row">
              <td class="col-logo">
                <div class="brand-logo-cell">
                  <div class="brand-image">
                    <img :src="getImageUrl(brand.logo)" :alt="brand.name_i18n?.ar || brand.name" />
                  </div>
                </div>
              </td>
              <td class="col-name">
                <span class="brand-name-text">{{ brand.name_i18n?.ar || brand.name }}</span>
              </td>
              <td class="col-status">
                <span class="status-badge" :class="brand.is_active ? 'active' : 'inactive'">
                  {{ brand.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
                </span>
              </td>
              <td class="col-order">
                <span class="order-number">{{ brand.sort_order || 0 }}</span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn delete-btn" @click="confirmDelete(brand)" :title="tx('حذف', 'Delete')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                  <button class="action-btn edit-btn" @click="openEditModal(brand)" :title="tx('تعديل', 'Edit')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Form Modal (Add/Edit) -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-header-text">
            <h3 class="modal-title">{{ isEdit ? tx('تعديل علامة تجارية', 'Edit Brand') : tx('إضافة علامة تجارية جديدة', 'Add New Brand') }}</h3>
            <p class="modal-subtitle">{{ tx('أدخل معلومات العلامة التجارية لإتمام العملية', 'Enter brand information to continue') }}</p>
          </div>
          <button class="modal-close" @click="closeModal" :aria-label="tx('إغلاق', 'Close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="i18n-toggle" role="tablist" aria-label="Language" dir="ltr">
          <button type="button" class="i18n-btn" :class="{ active: activeLang === 'en' }" @click="activeLang = 'en'">English</button>
          <button type="button" class="i18n-btn" :class="{ active: activeLang === 'ar' }" @click="activeLang = 'ar'">العربية</button>
        </div>
        
        <form @submit.prevent="submitForm" class="brand-form">
          <!-- Logo Upload -->
          <div class="form-group" style="text-align: center;">
            <label class="form-label">{{ tx('الشعار (اللوجو)', 'Logo') }} <span class="req">*</span></label>
            <div class="image-upload-box" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
              <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="hidden-input" />
              <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
              <div v-if="imagePreview" class="preview-area">
                <img :src="imagePreview" class="preview-img" />
                <div style="margin-top: 0.625rem;"><ImageCropButton @crop="recropCurrentImage" /></div>
              </div>
              <div v-else class="upload-placeholder">
                <div class="upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <p>{{ tx('إسحب وأفلت الشعار هنا', 'Drag and drop the logo here') }}</p>
                <span>{{ tx('أو انقر للاختيار من جهازك', 'or click to choose from your device') }}</span>
              </div>
            </div>
          </div>

          <!-- Name -->
          <div class="form-group" v-show="activeLang === 'ar'">
            <label class="form-label">{{ tx('الاسم (عربي)', 'Name (Arabic)') }} <span class="req">*</span></label>
            <input type="text" v-model="form.name_ar" class="form-control" :placeholder="tx('اسم العلامة التجارية بالعربي', 'Brand name in Arabic')" required />
          </div>

          <div class="form-group" v-show="activeLang === 'en'">
            <label class="form-label">الاسم (English) <span class="req">*</span></label>
            <input type="text" v-model="form.name_en" class="form-control" placeholder="Brand name in English" required />
          </div>

          <!-- URL -->
          <div class="form-group">
            <label class="form-label">{{ tx('الرابط (اختياري)', 'URL (Optional)') }}</label>
            <input type="url" v-model="form.url" class="form-control" :placeholder="tx('رابط موقع العلامة (مثل: https://example.com)', 'Brand website URL (e.g. https://example.com)')" />
          </div>

          <!-- Sort Order -->
          <div class="form-group">
            <label class="form-label">{{ tx('الترتيب', 'Sort Order') }}</label>
            <input type="number" v-model="form.sort_order" class="form-control" :placeholder="tx('رقم الترتيب (0, 1, 2...)', 'Sort number (0, 1, 2...)')" />
          </div>

          <!-- Status -->
          <div class="form-group">
            <label class="form-label">{{ tx('الحالة', 'Status') }}</label>
            <div class="select-wrapper">
              <select v-model="form.is_active" class="form-control">
                <option :value="true">{{ tx('نشط', 'Active') }}</option>
                <option :value="false">{{ tx('غير نشط', 'Inactive') }}</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="select-icon"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal" :disabled="isSubmitting">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEdit ? tx('حفظ التعديلات', 'Save Changes') : tx('إضافة العلامة', 'Add Brand')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Alert Toast -->
    <div class="alert-toast" :class="[alertType, { show: showAlert }]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <path v-if="alertType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline v-if="alertType === 'success'" points="22 4 12 14.01 9 11.01"/>
        <circle v-if="alertType === 'error'" cx="12" cy="12" r="10"/><line v-if="alertType === 'error'" x1="12" y1="8" x2="12" y2="12"/><line v-if="alertType === 'error'" x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import api from '../config/axios';
import { useAdminText } from '../composables/useAdminText';
import { safeObjectUrl } from '../utils/adminSecurity';
import ImageCropModal from '../components/ImageCropModal.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';

const { tx, locale } = useAdminText();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();

// State
const brands = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.

const formLang = () => (locale.value === 'en' ? 'en' : 'ar');

const activeLang = ref(formLang());

// Computed
const activeBrandsCount = computed(() => brands.value.filter(b => b.is_active).length);

const filteredBrands = computed(() => {
  return brands.value.filter(brand => {
    const q = searchQuery.value.toLowerCase();
    const nameAr = (brand.name_i18n?.ar || brand.name || '').toString().toLowerCase();
    const nameEn = (brand.name_i18n?.en || '').toString().toLowerCase();
    const matchSearch = nameAr.includes(q) || nameEn.includes(q);
    const matchStatus = statusFilter.value === '' ? true : (brand.is_active.toString() === statusFilter.value);
    return matchSearch && matchStatus;
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
});

// Modals
const showFormModal = ref(false);
const isEdit = ref(false);
const editingId = ref(null);
const fileInput = ref(null);
const isSubmitting = ref(false);

const form = ref({
  name_ar: '',
  name_en: '',
  logo: null,
  url: '',
  is_active: true,
  sort_order: 0
});
const imagePreview = ref(null);

// Alerts
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

// Utils
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/80';
  if (path.startsWith('http')) return path;
  // Use backend URL from axios config
  const baseUrl = api.defaults.baseURL.replace('/api', '');
  return `${baseUrl}/storage/${path}`;
};

// Fetch
const fetchBrands = async () => {
  loading.value = true;
  try {
    const res = await api.get('/dashboard/brands');
    brands.value = res.data.data || [];
  } catch (error) {
    triggerAlert('فشل جلب العلامات التجارية', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBrands();
});

// Actions
const openAddModal = () => {
  isEdit.value = false;
  editingId.value = null;
  form.value = {
    name_ar: '',
    name_en: '',
    logo: null,
    url: '',
    is_active: true,
    sort_order: 0
  };
  imagePreview.value = null;
  activeLang.value = formLang();
  showFormModal.value = true;
};

const openEditModal = (brand) => {
  isEdit.value = true;
  editingId.value = brand.id;
  const nameObj = brand.name_i18n && typeof brand.name_i18n === 'object' ? brand.name_i18n : null;
  form.value = {
    name_ar: nameObj?.ar ?? brand.name ?? '',
    name_en: nameObj?.en ?? '',
    logo: null,
    url: brand.url || '',
    is_active: brand.is_active,
    sort_order: brand.sort_order || 0
  };
  imagePreview.value = brand.logo ? getImageUrl(brand.logo) : null;
  activeLang.value = formLang();
  showFormModal.value = true;
};

const closeModal = () => {
  showFormModal.value = false;
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
  activeLang.value = formLang();
};

const handleDrop = (e) => {
  const picked = e.dataTransfer?.files?.[0];
  if (picked) handleFileChange({ target: { files: [picked], value: '' } });
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const cropOptions = () => ({ maxSizeMB: 2, defaultRatio: '1:1', fileName: 'brand_logo', title: tx('قص وضبط أبعاد شعار البراند (Crop & Resize)', 'Crop & resize brand logo') });

// Every picked image goes through the crop modal before it is staged for upload.
const handleFileChange = async (e) => {
  const picked = e.target.files?.[0];
  e.target.value = '';
  if (!picked) return;
  const { file, error } = await prepareImage(picked, cropOptions());
  if (error) {
    triggerAlert(error, 'error');
    return;
  }
  form.value.logo = file;
  imagePreview.value = safeObjectUrl(file, imagePreview.value);
};

const recropCurrentImage = async () => {
  const { file, error } = await recropImage(form.value.logo || imagePreview.value, cropOptions());
  if (error) triggerAlert(error, 'error');
  if (!file) return;
  form.value.logo = file;
  imagePreview.value = safeObjectUrl(file, imagePreview.value);
};

const submitForm = async () => {
  // Validate bilingual fields
  if (!String(form.value.name_ar || '').trim()) {
    activeLang.value = 'ar';
    triggerAlert('الاسم بالعربي مطلوب', 'error');
    return;
  }
  if (!String(form.value.name_en || '').trim()) {
    activeLang.value = 'en';
    triggerAlert('الاسم بالإنجليزية مطلوب', 'error');
    return;
  }

  isSubmitting.value = true;

  const fd = new FormData();
  fd.append('name', JSON.stringify({ ar: form.value.name_ar || '', en: form.value.name_en || '' }));
  if (form.value.logo) fd.append('logo', form.value.logo);
  fd.append('url', form.value.url || '');
  fd.append('is_active', form.value.is_active ? 1 : 0);
  fd.append('sort_order', form.value.sort_order || 0);

  try {
    if (isEdit.value) {
      fd.append('_method', 'PUT');
      await api.post(`/dashboard/brands/${editingId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      triggerAlert('تم التحديث بنجاح');
    } else {
      await api.post('/dashboard/brands', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      triggerAlert('تمت الإضافة بنجاح');
    }
    closeModal();
    fetchBrands();
  } catch (error) {
    const msg = apiErrorMessage(error, 'حدث خطأ أثناء الحفظ');
    triggerAlert(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = async (brand) => {
  if (confirm(`هل أنت متأكد من حذف العلامة "${brand.name_i18n?.ar || brand.name}"؟`)) {
    try {
      await api.delete(`/dashboard/brands/${brand.id}`);
      triggerAlert('تم حذف العلامة بنجاح');
      fetchBrands();
    } catch (error) {
      triggerAlert('لا يمكن حذف العلامة التجارية', 'error');
    }
  }
};
</script>

<style scoped>
.brands-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  direction: inherit;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.i18n-toggle {
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  margin: 0.75rem auto 1.25rem;
}

.i18n-btn {
  border: none;
  background: transparent;
  padding: 0.4rem 0.9rem;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  color: #6b7280;
  min-width: 96px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}

.i18n-btn.active {
  background: #660033;
  color: #fff;
}
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; }
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
.stats-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-direction: row-reverse;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(17, 24, 39, 0.1);
}
.stat-info { flex: 1; text-align: right; }
.stat-label { font-size: 0.75rem; font-weight: 700; color: #6b7280; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin-top: 2px; }
.stat-icon-wrapper { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.total-icon { background: #f0fdf4; color: #16a34a; }
.active-icon { background: #f3f4f6; color: #660033; }

/* Filters */
.filters-row { display: flex; gap: 1rem; }
.search-box { flex: 1; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input {
  width: 100%; padding: 0.7rem 2.8rem 0.7rem 1rem; border: 1px solid #e5e7eb;
  border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; outline: none;
}
.filter-select { position: relative; min-width: 160px; }
.form-select {
  width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem; border: 1px solid #e5e7eb;
  border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; cursor: pointer; appearance: none;
}
.select-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }

/* Table */
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1rem; text-align: right; border-bottom: 1px solid #f3f4f6; }
.data-table th { background: #f9fafb; font-size: 0.75rem; color: #6b7280; font-weight: 700; }
.data-row:hover td { background: #f3f4f6; }

.col-logo { width: 100px; text-align: center; }
.brand-image { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #f8fafc; border: 1px solid #f1f5f9; margin: 0 auto; }
.brand-image img { width: 100%; height: 100%; object-fit: contain; }

.col-status, .col-order { text-align: center; }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
.active { background: #ecfdf5; color: #059669; }
.inactive { background: #f3f4f6; color: #4b5563; }

.actions-group { display: flex; justify-content: flex-start; gap: 0.5rem; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: #f8fafc; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.delete-btn:hover { background: #fef2f2; color: #dc2626; }
.edit-btn:hover { background: #f0f9ff; color: #0284c7; }

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  background: #fff;
  border-radius: 18px;
  width: 100%;
  max-width: 520px;
  padding: 1.25rem;
  position: relative;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.25);
  max-height: calc(100vh - 2rem);
  overflow: auto;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0.25rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 0.75rem;
}
.modal-header-text {
  flex: 1;
  text-align: right;
}
.modal-close {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.modal-close:hover {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}
.modal-title { font-weight: 900; text-align: right; margin: 0; color: #0f172a; font-size: 1.15rem; }
.modal-subtitle { font-size: 0.82rem; color: #64748b; text-align: right; margin: 0.35rem 0 0; }

.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; }
.form-control { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-family: 'IBM Plex Sans Arabic'; outline: none; }
.form-control:focus {
  border-color: rgba(0, 0, 0, 0.6);
  box-shadow: 0 0 0 4px rgba(0,0,0, 0.12);
}
.image-upload-box { border: 2px dashed #e2e8f0; border-radius: 12px; padding: 1.5rem; text-align: center; cursor: pointer; background: #f8fafc; }
.hidden-input { display: none; }
.preview-img { max-height: 100px; border-radius: 8px; }

.form-actions {
  margin-top: 1.25rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.btn-secondary {
  width: 100%;
  padding: 0.8rem;
  background: #fff;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.btn-submit {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #660033, #a53c76);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(0,0,0, 0.32);
}
.btn-submit:disabled,
.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .filters-row {
    flex-direction: column;
  }
  .filter-select {
    min-width: 100%;
  }
  .modal-content {
    max-width: 100%;
  }
  .form-actions {
    grid-template-columns: 1fr;
  }
}

/* Alerts */
.error { border-right-color: #ef4444; }
</style>
