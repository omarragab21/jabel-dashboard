<template>
  <div class="loc-page" data-testid="site-images-page">
    <div v-show="!showForm" class="list-view" style="display: contents">
    <header class="loc-header">
      <div>
        <h1 class="loc-title page-title">{{ tx('صور الموقع', 'Site images') }}</h1>
        <p class="loc-subtitle page-subtitle">{{ tx('الصور التي رُفعت من صفحات الإعدادات (الشعار، صور الصفحات، صورة المشاركة...). يمكنك تغيير عنوان الصورة أو استبدالها أو حذفها.', 'The pictures uploaded from the settings pages (logo, page headers, share image...). Rename, replace or delete them here.') }}</p>
      </div>
      <div class="loc-header-actions">
        <button type="button" class="loc-btn loc-btn-ghost" :disabled="loading" data-testid="site-images-refresh" @click="load">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ tx('تحديث', 'Refresh') }}
        </button>
      </div>
    </header>

    <div class="loc-toolbar">
      <label class="loc-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model.trim="query" class="loc-input" type="search" :placeholder="tx('ابحث بعنوان الصورة...', 'Search by title...')" data-testid="site-images-search" />
      </label>
    </div>

    <div class="loc-card">
      <div v-if="loadError" class="loc-state is-error" data-testid="site-images-error">
        <div class="loc-state-title">{{ tx('تعذر تحميل الصور', 'Could not load the images') }}</div>
        <div class="loc-state-text">{{ loadError }}</div>
        <button type="button" class="loc-btn loc-btn-primary" @click="load">{{ tx('إعادة المحاولة', 'Try again') }}</button>
      </div>
      <div v-else-if="loading && !images.length" class="img-grid">
        <div v-for="n in 6" :key="n" class="img-card is-skeleton" />
      </div>
      <div v-else-if="!visibleImages.length" class="loc-state" data-testid="site-images-empty">
        <div class="loc-state-title">{{ images.length ? tx('لا توجد نتائج', 'No matching images') : tx('لا توجد صور بعد', 'No images yet') }}</div>
        <div class="loc-state-text">{{ images.length ? tx('غيّر كلمة البحث.', 'Change the search.') : tx('الصور تُرفع من صفحات إعداد الموقع.', 'Pictures are uploaded from the site setup pages.') }}</div>
      </div>
      <div v-else class="img-grid" data-testid="site-images-grid">
        <article v-for="image in visibleImages" :key="image.id" class="img-card" :data-testid="`site-image-${image.id}`">
          <a v-if="safeImage(image.image_url)" :href="safeImage(image.image_url)" target="_blank" rel="noopener noreferrer" class="img-frame">
            <img :src="safeImage(image.image_url)" :alt="image.title" loading="lazy" />
          </a>
          <div v-else class="img-frame is-empty">{{ tx('بدون صورة', 'No picture') }}</div>
          <div class="img-meta">
            <strong class="img-title" :title="image.title">{{ image.title || tx('بدون عنوان', 'Untitled') }}</strong>
            <span class="img-id">#{{ image.id }}</span>
          </div>
          <div class="loc-actions">
            <button type="button" class="loc-icon-btn" :title="tx('تعديل', 'Edit')" :data-testid="`site-image-edit-${image.id}`" @click="openEdit(image)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
            </button>
            <button type="button" class="loc-icon-btn is-danger" :title="tx('حذف', 'Delete')" :disabled="deletingId === image.id" :data-testid="`site-image-delete-${image.id}`" @click="remove(image)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </article>
      </div>
    </div>
    </div><!-- /list-view -->

    <EditorPage
      v-if="showForm"
      testid="site-image-editor"
      :back-label="tx('صور الموقع', 'Site images')"
      :title="tx('تعديل الصورة', 'Edit image')"
      :subtitle="tx('غيّر العنوان أو استبدل الصورة. الرابط القديم للصورة قد يتغير عند الاستبدال.', 'Change the title or replace the picture. Replacing may change the picture link.')"
      @back="closeForm"
    >
      <form class="loc-editor" data-testid="site-image-form" novalidate @submit.prevent="submit">
        <div class="loc-dialog-body">
          <div v-if="formError" class="loc-banner" role="alert" data-testid="site-image-form-error">{{ formError }}</div>
          <div class="loc-field">
            <label class="loc-label" for="site-image-title">{{ tx('العنوان', 'Title') }}</label>
            <input id="site-image-title" v-model.trim="form.title" class="loc-input" maxlength="255" data-testid="site-image-title" />
          </div>
          <div class="loc-field">
            <span class="loc-label">{{ tx('الصورة', 'Picture') }}</span>
            <div class="img-edit-row">
              <img v-if="previewImage" :src="previewImage" class="img-edit-preview" alt="" />
              <button type="button" class="loc-btn loc-btn-ghost" data-testid="site-image-pick" @click="imageInput?.click()">{{ tx('استبدال الصورة', 'Replace picture') }}</button>
              <input ref="imageInput" type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,image/avif" data-testid="site-image-input" @change="pickImage" />
            </div>
          </div>
        </div>
        <div class="loc-dialog-foot">
          <button type="button" class="loc-btn loc-btn-ghost" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="submit" class="loc-btn loc-btn-primary" :disabled="saving" data-testid="site-image-submit">{{ saving ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ التعديلات', 'Save changes') }}</button>
        </div>
      </form>
    </EditorPage>

    <div class="alert-toast" :class="[toast.type, { show: toast.show }]" role="status" data-testid="site-images-toast">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import EditorPage from '../components/EditorPage.vue';
import { useEditorRoute } from '../composables/useEditorRoute';
import { useLocationPage } from '../composables/useLocationPage';
import '../assets/locations.css';
import { computed, onMounted, ref } from 'vue';
import { siteImageService } from '../application/newsLineService';
import { safeObjectUrl, sanitizeAssetUrl, validateAdminImageFile } from '../utils/adminSecurity';

const { tx, toast, notify, errorText, confirmDelete } = useLocationPage();

const images = ref([]);
const loading = ref(false);
const loadError = ref('');
const query = ref('');
const safeImage = (url) => sanitizeAssetUrl(url, '');

const visibleImages = computed(() => {
  const needle = query.value.toLowerCase();
  return needle ? images.value.filter((image) => image.title.toLowerCase().includes(needle)) : images.value;
});

const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    images.value = await siteImageService.list();
  } catch (error) {
    loadError.value = errorText(error);
  } finally {
    loading.value = false;
  }
};
onMounted(load);

// ---- Edit
const showForm = ref(false);
const editing = ref(null);
const form = ref({ title: '' });
const formError = ref('');
const saving = ref(false);
const imageInput = ref(null);
const imageFile = ref(null);
const previewImage = ref('');

const openEdit = (image) => {
  editing.value = image;
  form.value = { title: image.title };
  formError.value = '';
  imageFile.value = null;
  previewImage.value = safeImage(image.image_url);
  showForm.value = true;
};
const closeForm = () => { if (!saving.value) showForm.value = false; };

const pickImage = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const check = validateAdminImageFile(file);
  if (!check.valid) { notify(check.error, 'error'); event.target.value = ''; return; }
  imageFile.value = file;
  previewImage.value = safeObjectUrl(file, previewImage.value);
};

useEditorRoute({
  base: '/admin/settings/site-images',
  isOpen: showForm,
  editId: () => editing.value?.id,
  openAdd: () => false, // images are added from the settings pages
  openEdit,
  close: () => { showForm.value = false; },
  findItem: async (id) => {
    if (!images.value.length) await load();
    return images.value.find((image) => String(image.id) === id) || null;
  },
  notFound: () => notify(tx('الصورة غير موجودة', 'Image not found'), 'error'),
});

const submit = async () => {
  if (saving.value || !editing.value) return;
  formError.value = '';
  saving.value = true;
  try {
    await siteImageService.update(editing.value.id, form.value, imageFile.value);
    notify(tx('تم تحديث الصورة', 'Image updated'));
    showForm.value = false;
    load();
  } catch (error) {
    formError.value = errorText(error, tx('تعذر حفظ الصورة', 'Could not save the image'));
  } finally {
    saving.value = false;
  }
};

const deletingId = ref(null);
const remove = async (image) => {
  const ok = await confirmDelete(tx(
    `سيتم حذف الصورة «${image.title || image.id}» وملفها نهائيًا. إذا كانت مستخدمة في إحدى صفحات الموقع ستختفي منها.`,
    `“${image.title || image.id}” and its file will be deleted permanently. A page that uses it will lose it.`,
  ));
  if (!ok) return;
  deletingId.value = image.id;
  try {
    await siteImageService.remove(image.id);
    images.value = images.value.filter((item) => item.id !== image.id);
    notify(tx('تم حذف الصورة', 'Image deleted'));
  } catch (error) {
    notify(errorText(error, tx('تعذر حذف الصورة', 'Could not delete the image')), 'error');
  } finally {
    deletingId.value = null;
  }
};
</script>

<style scoped>
.img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem; padding: 1rem; }
.img-card { border: 1px solid var(--border-color, #e5e7eb); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; background: var(--bg-card, #fff); }
.img-card.is-skeleton { height: 220px; background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6); background-size: 200% 100%; animation: img-shimmer 1.2s infinite; }
@keyframes img-shimmer { to { background-position: -200% 0; } }
.img-frame { display: flex; align-items: center; justify-content: center; height: 140px; background: #f8f7fa; color: var(--text-muted); font-size: 0.8rem; }
.img-frame img { max-width: 100%; max-height: 100%; object-fit: contain; }
.img-meta { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem 0.2rem; }
.img-title { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.img-id { color: var(--text-muted); font-size: 0.72rem; }
.img-card .loc-actions { padding: 0.4rem 0.6rem 0.7rem; }
.img-edit-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.img-edit-preview { width: 120px; height: 80px; object-fit: contain; background: #f8f7fa; border-radius: 8px; }
</style>
