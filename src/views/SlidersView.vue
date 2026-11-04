<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, onMounted, computed } from 'vue';
import adminManagementService from '../application/adminManagementService';
import { useAdminText } from '../composables/useAdminText';
import { safeObjectUrl, sanitizeAssetUrl } from '../utils/adminSecurity';
import ImageCropModal from '../components/ImageCropModal.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';
import { sanitizeUrl } from '../utils/sanitize';

const { tx, locale } = useAdminText();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();

// State
const sliders = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const showFormModal = ref(false);
const showViewModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const currentSlider = ref(null);
const deleteTarget = ref(null);
const isDeleting = ref(false);
const previewImage = ref(null);
const imageFile = ref(null);
// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.
const formLang = () => (locale.value === 'en' ? 'en' : 'ar');
const activeLang = ref(formLang());

const backendOrigin = (import.meta.env.VITE_API_BASE_URL || 'https://backend-jabal.be-kite.com/api')
    .replace(/\/api\/?$/, '');

const normalizeSliderImage = (value) => {
    if (!value) return value;
    const raw = String(value);
    const resolved = raw.startsWith('/storage/')
        ? `${backendOrigin}/public${raw}`
        : (raw.includes('/storage/') && !raw.includes('/public/storage/')
            ? raw.replace('/storage/', '/public/storage/')
            : raw);
    return sanitizeAssetUrl(resolved, '');
};

const form = ref({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    link: '',
    status: 'active',
    order: 0
});

const initialForm = { ...form.value };

// Fetch Sliders
const fetchSliders = async ({ notify = true } = {}) => {
  loading.value = true;
  try {
    sliders.value = await adminManagementService.listSliders();
    return true;
  } catch (error) {
    if (notify) {
        console.error('Failed to fetch sliders', error);
        triggerAlert('فشل تحميل البيانات', 'error');
    }
    return false;
  } finally {
    loading.value = false;
  }
};

// Order: every slider has its own position 1..N (no gaps, no duplicates). The list is always the full set, so a
// position means the same thing whatever the search box says; search only filters what is shown.
const sortedSliders = computed(() => [...sliders.value].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || Number(a.id) - Number(b.id)));
const positionOf = (slider) => sortedSliders.value.findIndex((item) => item.id === slider.id) + 1;

const filteredSliders = computed(() => {
    const q = String(searchQuery.value || '').trim().toLowerCase();
    if (!q) return sortedSliders.value;
    return sortedSliders.value.filter((slider) => [slider.title, slider.title_i18n?.ar, slider.title_i18n?.en, slider.description, slider.link]
        .some((text) => String(text || '').toLowerCase().includes(q)));
});

// The positions the form offers: 1..N for an existing slider, 1..N+1 when adding a new one.
const positionOptions = computed(() => Array.from({ length: sliders.value.length + (isEditing.value ? 0 : 1) }, (_, i) => i + 1));

const isReordering = ref(false);

const toUpdateForm = (slider, extra = {}) => ({
    title_ar: slider.title_i18n?.ar || slider.title || '',
    title_en: slider.title_i18n?.en || slider.title || '',
    description_ar: slider.description_i18n?.ar || slider.description || '',
    description_en: slider.description_i18n?.en || slider.description || '',
    link: slider.link,
    status: slider.status,
    order: slider.order,
    ...extra,
});

// Gives `list` the positions 1..N in the order it is in, saving only the sliders whose position changed.
// The screen updates first; the website picks the new order up from the saved values.
const persistOrder = async (list) => {
    const changed = list.map((slider, index) => ({ slider, position: index + 1 })).filter(({ slider, position }) => Number(slider.order) !== position);
    changed.forEach(({ slider, position }) => { slider.order = position; });
    for (const { slider, position } of changed) {
        await adminManagementService.updateSlider(slider.id, toUpdateForm(slider, { order: position }));
    }
    return changed.length;
};

// Drag and drop: grab a row by its handle and drop it above or below another row.
// Dragging is off while searching, because then only part of the list is on screen.
const canDrag = computed(() => !isReordering.value && !String(searchQuery.value || '').trim() && sortedSliders.value.length > 1);
const armedId = ref(null);      // row whose handle is pressed (only that row is draggable)
const draggingId = ref(null);
const dropTarget = ref(null);   // { id, after } — where the dragged row would land

const armDrag = (slider) => { if (canDrag.value) armedId.value = slider.id; };
const resetDrag = () => { armedId.value = null; draggingId.value = null; dropTarget.value = null; };

const onDragStart = (slider, event) => {
    if (armedId.value !== slider.id) { event.preventDefault(); return; }
    draggingId.value = slider.id;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(slider.id));
};

const onDragOver = (slider, event) => {
    if (draggingId.value === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    dropTarget.value = { id: slider.id, after: event.clientY > rect.top + rect.height / 2 };
};

const onDrop = async (event) => {
    event.preventDefault();
    const movedId = draggingId.value;
    const target = dropTarget.value;
    resetDrag();
    if (movedId === null || !target || target.id === movedId) return;
    const list = sortedSliders.value.filter((slider) => slider.id !== movedId);
    const moved = sortedSliders.value.find((slider) => slider.id === movedId);
    const targetIndex = list.findIndex((slider) => slider.id === target.id);
    list.splice(targetIndex + (target.after ? 1 : 0), 0, moved);
    isReordering.value = true;
    try {
        if (await persistOrder(list)) triggerAlert('تم تحديث ترتيب الشرائح');
    } catch (error) {
        triggerAlert('فشل تحديث الترتيب', 'error');
        await fetchSliders({ notify: false });
    } finally {
        isReordering.value = false;
    }
};

const dropClass = (slider) => ({
    'is-dragging': draggingId.value === slider.id,
    'drop-before': dropTarget.value?.id === slider.id && !dropTarget.value.after && draggingId.value !== slider.id,
    'drop-after': dropTarget.value?.id === slider.id && dropTarget.value.after && draggingId.value !== slider.id,
});

// Puts one slider at a chosen position and shifts the others so every position stays unique.
const arrangeAt = async (movedId, position) => {
    await fetchSliders({ notify: false });
    const moved = sortedSliders.value.find((slider) => slider.id === movedId);
    if (!moved) return;
    const list = sortedSliders.value.filter((slider) => slider.id !== movedId);
    list.splice(Math.min(Math.max(Number(position) || list.length + 1, 1), list.length + 1) - 1, 0, moved);
    await persistOrder(list);
};

onMounted(async () => {
    if (!(await fetchSliders())) return;
    // Old data may have gaps or two sliders with the same number: close them once so positions read 1, 2, 3...
    try {
        if (await persistOrder(sortedSliders.value)) triggerAlert('تم تصحيح ترتيب الشرائح ليصبح 1، 2، 3...');
    } catch (error) {
        console.error('Failed to normalise slider order', error);
    }
});

// Form Actions
const openAddModal = () => {
    isEditing.value = false;
    form.value = { ...initialForm, order: sliders.value.length + 1 };
    previewImage.value = null;
    imageFile.value = null;
    activeLang.value = formLang();
    showFormModal.value = true;
};

const openEditModal = (slider) => {
    isEditing.value = true;
    currentSlider.value = slider;
    const titleObj = slider.title_i18n && typeof slider.title_i18n === 'object' ? slider.title_i18n : null;
    const descObj = slider.description_i18n && typeof slider.description_i18n === 'object' ? slider.description_i18n : null;
    form.value = {
        title_ar: titleObj?.ar ?? slider.title ?? '',
        title_en: titleObj?.en ?? '',
        description_ar: descObj?.ar ?? slider.description ?? '',
        description_en: descObj?.en ?? '',
        link: slider.link,
        status: slider.status,
        order: positionOf(slider)
    };
    previewImage.value = normalizeSliderImage(slider.image);
    imageFile.value = null;
    activeLang.value = formLang();
    showFormModal.value = true;
};

const openViewModal = (slider) => {
    currentSlider.value = slider;
    showViewModal.value = true;
};

const cropOptions = () => ({ maxSizeMB: 1, defaultRatio: '2:1', fileName: 'slider', title: tx('قص وضبط مقاسات صورة الشريحة (Crop & Resize)', 'Crop & resize slider image') });

// Every picked image goes through the crop modal before it is staged for upload.
const handleImageChange = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const { file, error } = await prepareImage(picked, cropOptions());
    if (error) {
      triggerAlert(error, 'error');
      return;
    }
    imageFile.value = file;
    previewImage.value = safeObjectUrl(file, previewImage.value);
};

const recropCurrentImage = async () => {
    const { file, error } = await recropImage(imageFile.value || previewImage.value, cropOptions());
    if (error) triggerAlert(error, 'error');
    if (!file) return;
    imageFile.value = file;
    previewImage.value = safeObjectUrl(file, previewImage.value);
};

const submitForm = async () => {
    // Validate bilingual fields
    if (!String(form.value.title_ar || '').trim()) {
        activeLang.value = 'ar';
        triggerAlert('عنوان الشريحة بالعربي مطلوب', 'error');
        return;
    }
    if (!String(form.value.title_en || '').trim()) {
        activeLang.value = 'en';
        triggerAlert('عنوان الشريحة بالإنجليزية مطلوب', 'error');
        return;
    }
    const rawLink = String(form.value.link || '').trim();
    if (rawLink && !sanitizeUrl(rawLink, '')) {
        triggerAlert('رابط الشريحة غير آمن أو غير صالح. يرجى استخدام رابط يبدأ بـ / أو https://', 'error');
        return;
    }

    isSubmitting.value = true;
    try {
        const editingId = currentSlider.value?.id;
        const knownIds = new Set(sliders.value.map((slider) => slider.id));
        const wantedPosition = Number(form.value.order) || sliders.value.length + (isEditing.value ? 0 : 1);
        const savedSlider = isEditing.value
            ? await adminManagementService.updateSlider(editingId, form.value, imageFile.value)
            : await adminManagementService.createSlider(form.value, imageFile.value);

        // Keep the UI correct even when the backend returns 204/no body or the
        // follow-up list request is temporarily unavailable.
        if (isEditing.value && editingId !== undefined) {
            const fallbackSlider = {
                ...currentSlider.value,
                title: form.value.title_ar,
                title_i18n: { ar: form.value.title_ar, en: form.value.title_en },
                description: form.value.description_ar,
                description_i18n: { ar: form.value.description_ar, en: form.value.description_en },
                link: form.value.link,
                status: form.value.status,
                order: Number(form.value.order) || 0,
            };
            const nextSlider = savedSlider?.id ? savedSlider : fallbackSlider;
            sliders.value = sliders.value.map((slider) => slider.id === editingId ? { ...slider, ...nextSlider } : slider);
        }

        showFormModal.value = false;
        await fetchSliders({ notify: false });
        // Place the slider at the chosen position and shift the others (no two sliders share a number).
        const savedId = editingId ?? savedSlider?.id ?? sliders.value.find((slider) => !knownIds.has(slider.id))?.id;
        if (savedId !== undefined) await arrangeAt(savedId, wantedPosition);
        triggerAlert(isEditing.value ? 'تم تحديث الشريحة بنجاح' : 'تم إضافة الشريحة بنجاح');
    } catch (error) {
        const msg = apiErrorMessage(error, 'فشل حفظ البيانات');
        triggerAlert(msg, 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const confirmDelete = (slider) => {
    deleteTarget.value = slider;
};

const cancelDelete = () => {
    if (!isDeleting.value) deleteTarget.value = null;
};

const executeDelete = async () => {
    if (!deleteTarget.value || isDeleting.value) return;

    const target = deleteTarget.value;
    isDeleting.value = true;
    try {
        await adminManagementService.deleteSlider(target.id);
        sliders.value = sliders.value.filter((slider) => slider.id !== target.id);
        deleteTarget.value = null;
        await persistOrder(sortedSliders.value).catch(() => fetchSliders({ notify: false }));
        triggerAlert('تم حذف الشريحة بنجاح');
    } catch (error) {
        const message = apiErrorMessage(error, 'فشل حذف الشريحة. حاول مرة أخرى.');
        triggerAlert(message, 'error');
    } finally {
        isDeleting.value = false;
    }
};

const toggleStatus = async (slider) => {
    try {
        const newStatus = slider.status === 'active' ? 'inactive' : 'active';
        await adminManagementService.updateSlider(slider.id, toUpdateForm(slider, { status: newStatus }));
        slider.status = newStatus;
        triggerAlert('تم تحديث الحالة');
    } catch (error) {
        triggerAlert('فشل تحديث الحالة', 'error');
    }
};

// Helpers
const formatStatus = (status) => {
    const statuses = {
        'active': tx('نشط', 'Active'),
        'inactive': tx('غير نشط', 'Inactive'),
        'scheduled': tx('مجدول', 'Scheduled')
    };
    return statuses[status] || status;
};

const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

const triggerAlert = (message, type = 'success') => {
    alertMessage.value = localizeMessage(message);
    alertType.value = type;
    showAlert.value = true;
    setTimeout(() => showAlert.value = false, 3000);
};

const copyLink = (text) => {
    navigator.clipboard.writeText(text);
    triggerAlert('تم نسخ الرابط بنجاح');
};
</script>

<template>
  <div class="sliders-page p-6">
    <!-- Action Bar -->
    <div class="header-action mb-6">
       
         <div class="title-with-icon">
             <div class="icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
             </div>
             <div>
                <h1>{{ tx('إعلانات السلايدر', 'Homepage Sliders') }}</h1>
                <p>{{ tx('إدارة شرائح العرض في الصفحة الرئيسية', 'Manage homepage promotional sliders') }}</p>
             </div>
          </div>

       <div class="page-title-area">
          <button class="add-btn" @click="openAddModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ tx('إضافة شريحة جديدة', 'Add Slider') }}
          </button>
       </div>
    </div>

    <!-- Filters -->
    <div class="filters-card mb-6">
        <div class="search-box">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن شريحة...', 'Search sliders...')" />
        </div>
    </div>

    <!-- Table -->
    <div class="table-container shadow-sm">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-order">{{ tx('الترتيب', 'Order') }}</th>
            <th class="col-info text-right">{{ tx('الصورة والعنوان', 'Image and Title') }}</th>
            <th class="col-desc">{{ tx('الوصف', 'Description') }}</th>
            <th class="col-link">{{ tx('الرابط', 'Link') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="6">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredSliders.length === 0" class="state-row"><td colspan="6">{{ tx('لا توجد شرائح متوفرة', 'No sliders available') }}</td></tr>
          <template v-else>
            <tr
              v-for="slider in filteredSliders"
              :key="slider.id"
              class="data-row"
              :class="dropClass(slider)"
              :draggable="armedId === slider.id"
              @dragstart="onDragStart(slider, $event)"
              @dragover="onDragOver(slider, $event)"
              @drop="onDrop"
              @dragend="resetDrag"
            >
              <td class="col-order">
                  <div class="order-controls">
                    <span
                      class="drag-handle"
                      :class="{ disabled: !canDrag }"
                      :title="canDrag ? tx('اسحب لتغيير الترتيب', 'Drag to reorder') : tx('امسح البحث لتغيير الترتيب', 'Clear the search to reorder')"
                      data-testid="slider-drag-handle"
                      @mousedown="armDrag(slider)"
                      @mouseup="armedId = null"
                    ><svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M128 40c0-22.1-17.9-40-40-40L40 0C17.9 0 0 17.9 0 40L0 88c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM0 424l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 40c0-22.1-17.9-40-40-40L232 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM192 232l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 424c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"/></svg></span>
                    <span class="order-badge" data-testid="slider-position">{{ positionOf(slider) }}</span>
                  </div>
              </td>
              <td class="col-info text-right">
                <div class="image-title-cell">
                   <div class="slider-thumb">
                      <img :src="normalizeSliderImage(slider.image)" v-if="slider.image" />
                      <div class="img-placeholder" v-else>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><polyline points="10 13 13 10 21 18"/><circle cx="8" cy="8" r="3"/></svg>
                      </div>
                   </div>
                   <div class="info-text">
                      <span class="main-title">{{ slider.title_i18n?.[locale] || slider.title_i18n?.ar || slider.title }}</span>
                   </div>
                </div>
              </td>
              <td class="col-desc">
                <div class="desc-text truncate-2">{{ slider.description_i18n?.[locale] || slider.description_i18n?.ar || slider.description || '-' }}</div>
              </td>
              <td class="col-link">
                <div class="link-wrapper" v-if="slider.link">
                   <span class="link-text">{{ slider.link }}</span>
                   <button class="copy-btn" @click.stop="copyLink(slider.link)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                   </button>
                </div>
                <span v-else>-</span>
              </td>
              <td class="col-status">
                <span :class="['status-badge-table', slider.status]" @click="toggleStatus(slider)" style="cursor: pointer;">
                  {{ formatStatus(slider.status) }}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn view" :title="tx('عرض', 'View')" @click="openViewModal(slider)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn edit" :title="tx('تعديل', 'Edit')" @click="openEditModal(slider)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn delete" :title="tx('حذف', 'Delete')" @click="confirmDelete(slider)">
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
      <div class="modal-content form-dialog">
        <div class="modal-header">
           <button class="close-btn" @click="showFormModal = false">×</button>
           <h2>{{ isEditing ? tx('تعديل الشريحة', 'Edit Slider') : tx('إضافة شريحة جديدة', 'Add Slider') }}</h2>
           <p>{{ isEditing ? tx('تعديل معلومات الشريحة المحددة', 'Update the selected slider') : tx('إضافة شريحة عرض جديدة للسلايدر', 'Add a new homepage slider') }}</p>
        </div>
        
        <div class="modal-body">
           <div class="i18n-toggle" role="tablist" aria-label="Language" dir="ltr">
             <button type="button" class="i18n-btn" :class="{ active: activeLang === 'en' }" @click="activeLang = 'en'">English</button>
             <button type="button" class="i18n-btn" :class="{ active: activeLang === 'ar' }" @click="activeLang = 'ar'">العربية</button>
           </div>

           <div class="upload-area mb-6">
              <label class="upload-label">{{ tx('صورة الشريحة', 'Slider Image') }}</label>
              <div class="image-preview-box" @click="$refs.imageInput.click()">
                 <img v-if="previewImage" :src="previewImage" />
                 <div class="upload-placeholder" v-else>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>{{ tx('اسحب الصورة هنا أو اضغط للاختيار', 'Drag an image here or click to choose') }}</span>
                    <small>{{ tx('يفضل مقاس كبير (مثلاً 1920x800) - الحد الأقصى 1 ميجابايت', 'Large size recommended (e.g. 1920x800) - maximum 1MB') }}</small>
                 </div>
              </div>
              <div v-if="previewImage" style="margin-top: 0.625rem; text-align: center;"><ImageCropButton @crop="recropCurrentImage" /></div>
              <input type="file" ref="imageInput" @change="handleImageChange" hidden accept="image/*" />
              <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
           </div>

           <div class="form-group mb-4">
              <label class="form-label">{{ tx('العنوان', 'Title') }} <span class="req">*</span></label>
              <input v-show="activeLang === 'ar'" type="text" v-model="form.title_ar" class="form-control" placeholder="عنوان الشريحة بالعربي..." />
              <input v-show="activeLang === 'en'" type="text" v-model="form.title_en" class="form-control" placeholder="Slider title in English..." />
           </div>

           <div class="form-group mb-4">
              <label class="form-label">{{ tx('الوصف', 'Description') }}</label>
              <textarea v-show="activeLang === 'ar'" v-model="form.description_ar" class="form-control" rows="3" placeholder="وصف قصير للعرض بالعربي..."></textarea>
              <textarea v-show="activeLang === 'en'" v-model="form.description_en" class="form-control" rows="3" placeholder="Short slider description in English..."></textarea>
           </div>

           <div class="form-group mb-4">
              <label class="form-label">{{ tx('الرابط (اختياري)', 'Link (Optional)') }}</label>
              <div class="link-input">
                 <input type="text" v-model="form.link" class="form-control ltr-text" placeholder="https://example.com/product" />
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
           </div>

           <div class="form-row mb-4">
              <div class="form-group flex-1">
                 <label class="form-label">{{ tx('الترتيب', 'Position') }}</label>
                 <select v-model.number="form.order" class="form-control" data-testid="slider-position-select">
                    <option v-for="position in positionOptions" :key="position" :value="position">{{ position }}</option>
                 </select>
              </div>
              <div class="form-group flex-1">
                 <label class="form-label">{{ tx('الحالة', 'Status') }}</label>
                 <select v-model="form.status" class="form-control">
                    <option value="active">{{ tx('نشط', 'Active') }}</option>
                    <option value="inactive">{{ tx('غير نشط', 'Inactive') }}</option>
                    <option value="scheduled">{{ tx('مجدول', 'Scheduled') }}</option>
                 </select>
              </div>
           </div>
        </div>

        <div class="modal-footer">
           <button class="btn-cancel" @click="showFormModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
           <button class="btn-save" :disabled="isSubmitting" @click="submitForm">
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ الشريحة', 'Save slider') }}
           </button>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false">
      <div class="modal-content info-modal">
        <div class="modal-header">
           <button class="close-btn" @click="showViewModal = false">×</button>
           <h2>{{ tx('تفاصيل الشريحة', 'Slider Details') }}</h2>
           <p>{{ tx('معلومات كاملة عن شريحة السلايدر', 'Complete slider information') }}</p>
        </div>
        <div class="modal-body p-0">
           <div class="view-image-full" v-if="currentSlider.image">
              <img :src="normalizeSliderImage(currentSlider.image)" alt="Slider" />
           </div>
           <div class="modal-body p-8">
              <div class="info-row">
                    <label>{{ tx('العنوان', 'Title') }}:</label>
                 <span class="font-bold">{{ currentSlider.title_i18n?.ar || currentSlider.title }}</span>
              </div>
              <div class="info-row">
                    <label>{{ tx('الوصف', 'Description') }}:</label>
                 <span>{{ currentSlider.description_i18n?.ar || currentSlider.description || '-' }}</span>
              </div>
              <div class="info-row">
                    <label>{{ tx('الرابط', 'Link') }}:</label>
                 <span class="ltr-text text-blue">{{ currentSlider.link || '-' }}</span>
              </div>
              <div class="info-row-flex mt-4">
                 <div class="info-item">
                    <label>{{ tx('الحالة', 'Status') }}:</label>
                    <span :class="['status-badge-table', currentSlider.status]">{{ formatStatus(currentSlider.status) }}</span>
                 </div>
                 <div class="info-item">
                    <label>{{ tx('الترتيب', 'Order') }}:</label>
                    <span class="order-badge">{{ positionOf(currentSlider) }}</span>
                 </div>
              </div>
           </div>
        </div>
        <div class="modal-footer">
           <button class="btn-save-alt" @click="showViewModal = false">{{ tx('إغلاق', 'Close') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div class="modal-overlay" v-if="deleteTarget" @click.self="cancelDelete">
      <div class="modal-content delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div class="delete-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/>
          </svg>
        </div>
        <div class="delete-copy">
          <h2 id="delete-title">{{ tx('تأكيد حذف الشريحة', 'Confirm Slider Deletion') }}</h2>
          <p>{{ tx('هل أنت متأكد من حذف هذه الشريحة؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to delete this slider? This action cannot be undone.') }}</p>
        </div>
        <div class="modal-footer delete-footer">
          <button class="btn-cancel" type="button" :disabled="isDeleting" @click="cancelDelete">{{ tx('إلغاء', 'Cancel') }}</button>
          <button class="btn-delete-confirm" type="button" :disabled="isDeleting" @click="executeDelete">
            <span v-if="isDeleting" class="delete-spinner" aria-hidden="true"></span>
            {{ isDeleting ? 'جاري الحذف...' : 'حذف الشريحة' }}
          </button>
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
.sliders-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }

/* Header */
.header-action { display: flex; justify-content: space-between; align-items: center; }
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

.page-title-area h1 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0; }
.page-title-area p { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
.title-with-icon { display: flex; align-items: center; gap: 12px; }
.icon-box { background: #f3f4f6; color: #660033; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

/* Filters */
.filters-card { background: var(--bg-card); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); }
.search-box { position: relative; width: 100%; }
.search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
.search-box input { width: 100%; padding: 10px 44px 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; outline: none; transition: 0.3s; font-family: inherit; background: var(--input-bg); color: var(--text-main); }
.search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }

/* Table */
.table-container { background: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
.data-table { width: 100%; border-collapse: collapse; text-align: center; }
.data-table th { background: var(--table-header-bg); padding: 14px; font-weight: 700; color: var(--text-main); font-size: 0.9rem; border-bottom: 2px solid var(--table-border); }
.data-table td { padding: 14px; border-bottom: 1px solid var(--table-border); vertical-align: middle; color: var(--text-main); font-size: 0.9rem; }

.data-row:hover { background: var(--table-hover); }
.state-row td { padding: 40px; color: #9ca3af; }

.col-order { width: 110px; }
.col-info { width: 300px; }
.col-link { width: 250px; }
.col-status { width: 100px; }
.col-actions { width: 150px; }

.order-controls { display: inline-flex; align-items: center; gap: 6px; }
.drag-handle { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 30px; border-radius: 6px; color: #9ca3af; cursor: grab; transition: all 0.15s; }
.drag-handle:hover { background: #f3f4f6; color: #660033; }
.drag-handle:active { cursor: grabbing; }
.drag-handle.disabled { cursor: not-allowed; opacity: 0.35; }
.drag-handle svg { fill: currentColor; }
.data-row.is-dragging { opacity: 0.4; }
.data-row.drop-before td { box-shadow: inset 0 3px 0 #660033; }
.data-row.drop-after td { box-shadow: inset 0 -3px 0 #660033; }
.order-badge { min-width: 26px; text-align: center; background: #f3f4f6; color: #4b5563; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; }

.image-title-cell { display: flex; align-items: center; gap: 12px; }
.slider-thumb { width: 60px; height: 35px; border-radius: 6px; overflow: hidden; background: #f3f4f6; border: 1px solid #e5e7eb; }
.slider-thumb img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af; }

.main-title { font-weight: 700; color: var(--text-main); }
.desc-text { color: var(--text-muted); font-size: 0.85rem; max-width: 200px; margin: 0 auto; line-height: 1.4; }
.truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.link-wrapper { display: flex; align-items: center; gap: 6px; justify-content: center; }
.link-text { color: #2563eb; direction: ltr; font-size: 0.8rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.copy-btn { border: none; background: #eff6ff; color: #2563eb; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.copy-btn:hover { background: #dbeafe; }

.status-badge-table { padding: 4px 10px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; }
.status-badge-table.active { background: #064e3b; color: #10b981; }
.status-badge-table.inactive { background: var(--bg-main); color: var(--text-muted); }
.status-badge-table.scheduled { background: #431407; color: #f97316; }

.actions-group { display: flex; gap: 8px; justify-content: center; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.action-btn.view { background: #f0f9ff; color: #0ea5e9; }
.action-btn.view:hover { background: #e0f2fe; }
.action-btn.edit { background: #f3f4f6; color: #660033; }
.i18n-toggle { display: inline-flex; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--bg-card); margin: 0 auto 18px; }
.i18n-btn { border: none; background: transparent; padding: 0.4rem 0.9rem; font-weight: 800; font-size: 0.85rem; cursor: pointer; color: var(--text-muted); min-width: 96px; font-family: inherit; }
.i18n-btn.active { background: #660033; color: #fff; }

.action-btn.edit:hover { background: #e5e7eb; }
.action-btn.delete { background: #fef2f2; color: #ef4444; }
.action-btn.delete:hover { background: #fee2e2; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-color); overflow: hidden; width: 100%; max-width: 500px; animation: modalPop 0.3s ease-out; }

/* Add / edit slider: a centred dialog, like adding a product */
.form-dialog { max-width: 650px; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25); }
.form-dialog .modal-header { text-align: center; padding: 2rem 2rem 1.25rem; }
.form-dialog .modal-body { display: flex; flex-direction: column; }
.form-dialog .i18n-toggle { align-self: center; }
.form-dialog .modal-body > * { flex-shrink: 0; }

@keyframes modalPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-header { padding: 24px; border-bottom: 1px solid var(--border-color); position: relative; }
.close-btn { position: absolute; left: 24px; top: 24px; border: none; background: var(--bg-main); color: var(--text-main); width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; line-height: 1; }
.modal-header h2 { font-weight: 800; font-size: 1.25rem; margin: 0 0 4px 0; color: var(--text-main); }
.modal-header p { color: var(--text-muted); font-size: 0.85rem; margin: 0; }

.modal-body { padding: 24px; flex: 1; overflow-y: auto; }

.upload-area { position: relative; }
.upload-label { display: block; font-weight: 700; font-size: 0.9rem; margin-bottom: 8px; color: var(--text-main); }
.image-preview-box { width: 100%; aspect-ratio: 16/7; background: var(--bg-main); border: 2px dashed var(--border-color); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; transition: 0.3s; }
.image-preview-box:hover { border-color: var(--primary); background: var(--bg-card); }
.image-preview-box img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; text-align: center; padding: 20px; }
.upload-placeholder span { font-weight: 600; font-size: 0.9rem; color: #374151; }
.upload-placeholder small { font-size: 0.75rem; }

.form-label { display: block; font-weight: 700; font-size: 0.9rem; margin-bottom: 8px; color: var(--text-main); }
.form-control { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color); background: var(--input-bg); color: var(--text-main); border-radius: 10px; outline: none; transition: 0.30s; font-family: inherit; }
.form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.1); }

.link-input { position: relative; }
.link-input input { padding-left: 40px; }
.link-input svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }

.form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }

.modal-footer { padding: 20px 24px; background: var(--bg-main); border-top: 1px solid var(--border-color); display: flex; gap: 12px; }
.btn-save { background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 1; transition: 0.3s; }
.btn-save:disabled { background: var(--border-color); cursor: not-allowed; }
.btn-cancel { background: var(--bg-card); color: var(--text-muted); border: 1.5px solid var(--border-color); padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 1; transition: 0.2s; }
.btn-cancel:hover { background: var(--bg-main); }

/* Info Modal */
.info-modal { max-width: 600px; border-radius: 24px; }
.view-image-full { width: 100%; height: 200px; overflow: hidden; }
.view-image-full img { width: 100%; height: 100%; object-fit: cover; }
.info-row { display: flex; gap: 8px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
.info-row label { color: #6b7280; font-weight: 600; width: 80px; }
.info-row-flex { display: flex; gap: 40px; }
.info-item { display: flex; align-items: center; gap: 10px; }
.info-item label { color: #6b7280; font-weight: 600; }
.btn-save-alt { width: 100%; background: #1f2937; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; }

.delete-modal { max-width: 460px; padding: 28px; text-align: center; }
.delete-icon { width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626; background: #fef2f2; }
.delete-copy h2 { margin: 0 0 8px; color: var(--text-main); font-size: 1.2rem; }
.delete-copy p { margin: 0; color: var(--text-muted); line-height: 1.7; font-size: 0.92rem; }
.delete-footer { padding: 24px 0 0; background: transparent; border-top: 0; }
.delete-footer button { min-height: 44px; }
.btn-delete-confirm { background: #dc2626; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; flex: 1; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-delete-confirm:hover { background: #b91c1c; }
.btn-delete-confirm:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
.delete-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.45); border-top-color: white; border-radius: 50%; animation: delete-spin 0.7s linear infinite; }
@keyframes delete-spin { to { transform: rotate(360deg); } }

/* Utils */
.mb-6 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 16px; }
.p-0 { padding: 0 !important; }
.mt-4 { margin-top: 16px; }
.font-bold { font-weight: 700; }
.ltr-text { direction: ltr; text-align: left; }
.text-blue { color: #2563eb; }

/* Alert Toast */

@media (max-width: 768px) {
  .header-action { flex-direction: column-reverse; gap: 16px; align-items: stretch; }
  .col-desc, .col-link { display: none; }
  .form-dialog { max-width: 100%; }
}
</style>
