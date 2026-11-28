<template>
  <div class="loc-page" data-testid="news-lines-page">
    <!-- The list; the add / edit form replaces it as a page of its own (/admin/settings/newsbar/new, /:id/edit) -->
    <div v-show="!showForm" class="list-view" style="display: contents">
    <header class="loc-header">
      <div>
        <h1 class="loc-title page-title">{{ tx('شريط الأخبار', 'News bar') }}</h1>
        <p class="loc-subtitle page-subtitle">{{ tx('الأخبار التي تظهر في الشريط تحت قائمة الموقع، بالعربي والإنجليزي. يمكن ربط كل خبر برابط يفتح في تبويب جديد.', 'The news shown in the bar under the website menu, in Arabic and English. Each line can link somewhere; the link opens in a new tab.') }}</p>
      </div>
      <div class="loc-header-actions">
        <button type="button" class="loc-btn loc-btn-ghost" :disabled="loading" data-testid="news-lines-refresh" @click="load">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ tx('تحديث', 'Refresh') }}
        </button>
        <button type="button" class="loc-btn loc-btn-primary" data-testid="news-line-add" @click="openCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          {{ tx('إضافة خبر', 'Add news line') }}
        </button>
      </div>
    </header>

    <section class="loc-stats" aria-label="stats">
      <div class="loc-stat"><span class="loc-stat-icon is-brand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M2 15h10"/><path d="M9 18l3-3-3-3"/></svg></span><div><div class="loc-stat-label">{{ tx('إجمالي الأخبار', 'Total lines') }}</div><div class="loc-stat-value" data-testid="news-lines-total">{{ lines.length }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-ok"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></span><div><div class="loc-stat-label">{{ tx('ظاهرة في الموقع', 'Shown') }}</div><div class="loc-stat-value" data-testid="news-lines-active">{{ activeCount }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-off"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg></span><div><div class="loc-stat-label">{{ tx('مخفية', 'Hidden') }}</div><div class="loc-stat-value" data-testid="news-lines-inactive">{{ lines.length - activeCount }}</div></div></div>
    </section>

    <div class="loc-toolbar">
      <label class="loc-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model.trim="query" class="loc-input" type="search" :placeholder="tx('ابحث في نص الخبر أو الرابط...', 'Search the text or the link...')" data-testid="news-lines-search" />
      </label>
      <select v-model="status" class="loc-select" data-testid="news-lines-status-filter" :aria-label="tx('الحالة', 'Status')">
        <option value="">{{ tx('كل الحالات', 'All statuses') }}</option>
        <option value="active">{{ tx('ظاهرة', 'Shown') }}</option>
        <option value="inactive">{{ tx('مخفية', 'Hidden') }}</option>
      </select>
    </div>

    <div class="loc-card">
      <div v-if="loadError" class="loc-state is-error" data-testid="news-lines-error">
        <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></span>
        <div class="loc-state-title">{{ tx('تعذر تحميل الأخبار', 'Could not load the news') }}</div>
        <div class="loc-state-text">{{ loadError }}</div>
        <button type="button" class="loc-btn loc-btn-primary" @click="load">{{ tx('إعادة المحاولة', 'Try again') }}</button>
      </div>

      <div v-else class="loc-table-wrap">
        <table class="loc-table" data-testid="news-lines-table">
          <thead>
            <tr>
              <th v-if="NEWS_IMAGES_ENABLED">{{ tx('الصورة', 'Picture') }}</th>
              <th>{{ tx('الخبر', 'News') }}</th>
              <th>{{ tx('الرابط', 'Link') }}</th>
              <th>{{ tx('الحالة', 'Status') }}</th>
              <th class="loc-th-actions">{{ tx('الإجراءات', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody v-if="loading && !lines.length">
            <tr v-for="n in 4" :key="n" class="loc-skeleton"><td v-for="c in (NEWS_IMAGES_ENABLED ? 5 : 4)" :key="c"><span /></td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="line in visibleRows" :key="line.id" :class="{ 'is-off': !line.is_active }" :data-testid="`news-line-row-${line.id}`">
              <td v-if="NEWS_IMAGES_ENABLED">
                <img v-if="safeImage(line.image_url)" :src="safeImage(line.image_url)" class="news-thumb" alt="" loading="lazy" />
                <span v-else class="news-thumb is-empty" aria-hidden="true">—</span>
              </td>
              <td>
                <span class="loc-name">{{ textOf(line) }}</span>
                <span v-if="otherText(line)" class="loc-name-sub">{{ otherText(line) }}</span>
              </td>
              <td>
                <a v-if="line.link" :href="safeLink(line.link)" target="_blank" rel="noopener noreferrer" class="news-link" dir="ltr">{{ line.link }}</a>
                <span v-else>—</span>
              </td>
              <td>
                <label class="loc-switch" :class="{ 'is-busy': isPending(line.id) }" :data-testid="`news-line-toggle-${line.id}`">
                  <input type="checkbox" :checked="line.is_active" :disabled="isPending(line.id)" :aria-label="tx('إظهار الخبر', 'Show this line')" @change="toggle(line)" />
                  <span class="loc-switch-track" aria-hidden="true"></span>
                  <span class="loc-switch-text" :class="line.is_active ? 'is-on' : 'is-off'">{{ line.is_active ? tx('ظاهر', 'Shown') : tx('مخفي', 'Hidden') }}</span>
                </label>
              </td>
              <td>
                <div class="loc-actions">
                  <button type="button" class="loc-icon-btn" :title="tx('تعديل', 'Edit')" :data-testid="`news-line-edit-${line.id}`" @click="openEdit(line)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button type="button" class="loc-icon-btn is-danger" :title="tx('حذف', 'Delete')" :disabled="deletingId === line.id" :data-testid="`news-line-delete-${line.id}`" @click="remove(line)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !visibleRows.length">
              <td colspan="5">
                <div class="loc-state" data-testid="news-lines-empty">
                  <template v-if="lines.length">
                    <div class="loc-state-title">{{ tx('لا توجد نتائج', 'No matching lines') }}</div>
                    <div class="loc-state-text">{{ tx('غيّر كلمة البحث أو الفلتر.', 'Change the search or the filter.') }}</div>
                  </template>
                  <template v-else>
                    <div class="loc-state-title">{{ tx('لا توجد أخبار بعد', 'No news lines yet') }}</div>
                    <div class="loc-state-text">{{ tx('أضف أول خبر ليظهر في شريط الموقع.', 'Add the first line to show it in the website bar.') }}</div>
                    <button type="button" class="loc-btn loc-btn-primary" @click="openCreate">{{ tx('إضافة خبر', 'Add news line') }}</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div><!-- /list-view -->

    <EditorPage
      v-if="showForm"
      testid="news-line-editor"
      :back-label="tx('شريط الأخبار', 'News bar')"
      :title="editing ? tx('تعديل الخبر', 'Edit news line') : tx('إضافة خبر', 'Add news line')"
      :subtitle="tx('النص مطلوب بالعربي والإنجليزي.', 'The text is required in Arabic and English.')"
      @back="closeForm"
    >
      <form class="loc-editor" data-testid="news-line-form" novalidate @submit.prevent="submit">
        <div class="loc-dialog-body">
          <div v-if="formError" class="loc-banner" role="alert" data-testid="news-line-form-error">{{ formError }}</div>

          <BilingualField class="loc-field" required :ar="form.description_ar" :en="form.description_en" :invalid-ar="!!fieldError('description_ar')" :invalid-en="!!fieldError('description_en')" testid="news-line-text">
            <template #label="{ lang }"><label class="loc-label" :for="`news-line-text-${lang}`">{{ tx('نص الخبر', 'News text') }} <span class="loc-req">*</span></label></template>
            <template #default="{ lang }">
              <textarea v-show="lang === 'ar'" id="news-line-text-ar" v-model="form.description_ar" class="loc-textarea" :class="{ 'is-invalid': fieldError('description_ar') }" dir="rtl" rows="2" maxlength="1000" placeholder="نصائح صيدلانية موثوقة..." data-testid="news-line-text-ar"></textarea>
              <textarea v-show="lang === 'en'" id="news-line-text-en" v-model="form.description_en" class="loc-textarea" :class="{ 'is-invalid': fieldError('description_en') }" dir="ltr" rows="2" maxlength="1000" placeholder="Trusted pharmacy advice..." data-testid="news-line-text-en"></textarea>
            </template>
          </BilingualField>
          <p v-if="fieldError('description_ar')" class="loc-error" data-testid="news-line-text-ar-error">{{ fieldError('description_ar') }}</p>
          <p v-if="fieldError('description_en')" class="loc-error" data-testid="news-line-text-en-error">{{ fieldError('description_en') }}</p>

          <div class="loc-field">
            <label class="loc-label" for="news-line-link">{{ tx('الرابط (اختياري)', 'Link (optional)') }}</label>
            <input id="news-line-link" v-model.trim="form.link" class="loc-input" :class="{ 'is-invalid': fieldError('link') }" dir="ltr" type="text" placeholder="https://example.com/offers" data-testid="news-line-link" />
            <p v-if="fieldError('link')" class="loc-error" data-testid="news-line-link-error">{{ fieldError('link') }}</p>
          </div>

          <div v-if="NEWS_IMAGES_ENABLED" class="loc-field" data-testid="news-line-image-field">
            <span class="loc-label">{{ tx('صورة صغيرة (اختياري)', 'Small picture (optional)') }}</span>
            <div class="news-image-row">
              <img v-if="previewImage" :src="previewImage" class="news-thumb is-large" alt="" data-testid="news-line-image-preview" />
              <div class="news-image-actions">
                <button type="button" class="loc-btn loc-btn-ghost" data-testid="news-line-image-pick" @click="imageInput?.click()">{{ previewImage ? tx('تغيير الصورة', 'Change picture') : tx('اختيار صورة', 'Choose a picture') }}</button>
                <button v-if="previewImage" type="button" class="loc-btn loc-btn-ghost is-danger" data-testid="news-line-image-remove" @click="removeImage">{{ tx('إزالة الصورة', 'Remove picture') }}</button>
              </div>
              <input ref="imageInput" type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,image/avif" data-testid="news-line-image-input" @change="pickImage" />
            </div>
          </div>

          <label class="loc-switch" data-testid="news-line-active">
            <input v-model="form.is_active" type="checkbox" />
            <span class="loc-switch-track" aria-hidden="true"></span>
            <span class="loc-switch-text" :class="form.is_active ? 'is-on' : 'is-off'">{{ form.is_active ? tx('الخبر ظاهر في الموقع', 'Shown on the website') : tx('الخبر مخفي', 'Hidden') }}</span>
          </label>
        </div>
        <div class="loc-dialog-foot">
          <button type="button" class="loc-btn loc-btn-ghost" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="submit" class="loc-btn loc-btn-primary" :disabled="saving" data-testid="news-line-submit">{{ saving ? tx('جاري الحفظ...', 'Saving...') : (editing ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة الخبر', 'Add news line')) }}</button>
        </div>
      </form>
    </EditorPage>

    <div class="alert-toast" :class="[toast.type, { show: toast.show }]" role="status" data-testid="news-lines-toast">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import EditorPage from '../components/EditorPage.vue';
import BilingualField from '../components/BilingualField.vue';
import { useEditorRoute } from '../composables/useEditorRoute';
import { provideBilingualForm } from '../composables/useBilingualForm';
import { serverFieldErrors, useLocationPage } from '../composables/useLocationPage';
import '../assets/locations.css';
import { computed, onMounted, ref } from 'vue';
import newsLineService from '../application/newsLineService';
import {
  emptyNewsLineForm, filterNewsLines, localizedNewsText, newsLineFormFrom, validateNewsLineForm,
} from '../domain/newsLines';
import { safeObjectUrl, sanitizeAssetUrl, validateAdminImageFile } from '../utils/adminSecurity';

const bilingual = provideBilingualForm();
const { tx, locale, toast, notify, errorText, isPending, toggleRow, confirmDelete } = useLocationPage();

const lines = ref([]);
const loading = ref(false);
const loadError = ref('');
const query = ref('');
const status = ref('');

const lang = computed(() => (locale.value === 'en' ? 'en' : 'ar'));
const textOf = (line) => localizedNewsText(line, lang.value);
const otherText = (line) => {
  const other = localizedNewsText(line, lang.value === 'en' ? 'ar' : 'en');
  return other && other !== textOf(line) ? other : '';
};
const safeImage = (url) => sanitizeAssetUrl(url, '');
// News pictures are hidden for now: no picture column in the list and no picture field on add / edit.
// Saving without touching the picture sends nothing about it, so pictures already saved stay on the server.
const NEWS_IMAGES_ENABLED = false;
const safeLink = (link) => (/^(https?:\/\/|\/)/i.test(link) ? link : '#');

const visibleRows = computed(() => filterNewsLines(lines.value, { query: query.value, status: status.value }));
const activeCount = computed(() => lines.value.filter((line) => line.is_active).length);

const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    lines.value = await newsLineService.list();
  } catch (error) {
    loadError.value = errorText(error);
  } finally {
    loading.value = false;
  }
};
onMounted(load);

// ---- Form
const showForm = ref(false);
const editing = ref(null);
const form = ref(emptyNewsLineForm());
const errors = ref({});
const serverErrors = ref({});
const formError = ref('');
const saving = ref(false);
const imageInput = ref(null);
const imageFile = ref(null);
const previewImage = ref('');

const REASONS = {
  required: () => tx('هذا الحقل مطلوب', 'This field is required'),
  too_long: () => tx('النص أطول من 1000 حرف', 'Longer than 1000 characters'),
  arabic_in_english: () => tx('اكتب هذا الحقل بالإنجليزية فقط (بدون حروف عربية)', 'Use English letters only'),
  invalid: () => tx('اكتب رابطًا كاملًا يبدأ بـ https:// (مثال: https://example.com/offers)', 'Enter a full link starting with https:// (e.g. https://example.com/offers)'),
};
const fieldError = (field) => serverErrors.value[field] || (errors.value[field] ? REASONS[errors.value[field]]?.() || '' : '');

const resetFormState = () => {
  errors.value = {}; serverErrors.value = {}; formError.value = ''; imageFile.value = null; bilingual.reset?.();
  if (imageInput.value) imageInput.value.value = '';
};
const openCreate = () => { editing.value = null; form.value = emptyNewsLineForm(); resetFormState(); previewImage.value = ''; showForm.value = true; };
const openEdit = (line) => {
  editing.value = line; form.value = newsLineFormFrom(line); resetFormState();
  previewImage.value = safeImage(line.image_url);
  showForm.value = true;
};
const closeForm = () => { if (!saving.value) showForm.value = false; };

const pickImage = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const check = validateAdminImageFile(file);
  if (!check.valid) { notify(check.error, 'error'); event.target.value = ''; return; }
  imageFile.value = file;
  form.value.delete_image = false;
  previewImage.value = safeObjectUrl(file, previewImage.value);
};
const removeImage = () => {
  previewImage.value = safeObjectUrl(null, previewImage.value);
  imageFile.value = null;
  if (imageInput.value) imageInput.value.value = '';
  // Only an image the server already has needs deleting there.
  form.value.delete_image = Boolean(editing.value?.image_url);
};

useEditorRoute({
  base: '/admin/settings/newsbar',
  isOpen: showForm,
  editId: () => editing.value?.id,
  openAdd: () => openCreate(),
  openEdit,
  close: () => { showForm.value = false; },
  findItem: async (id) => {
    if (!lines.value.length) await load();
    return lines.value.find((line) => String(line.id) === id) || null;
  },
  notFound: () => notify(tx('الخبر غير موجود', 'News line not found'), 'error'),
});

const submit = async () => {
  if (saving.value) return;
  serverErrors.value = {};
  formError.value = '';
  errors.value = validateNewsLineForm(form.value);
  if (Object.keys(errors.value).length) { bilingual.reveal?.(); return; }
  saving.value = true;
  try {
    if (editing.value) {
      await newsLineService.update(editing.value.id, form.value, imageFile.value);
      notify(tx('تم تحديث الخبر', 'News line updated'));
    } else {
      await newsLineService.create(form.value, imageFile.value);
      notify(tx('تمت إضافة الخبر', 'News line added'));
    }
    showForm.value = false;
    load();
  } catch (error) {
    serverErrors.value = serverFieldErrors(error);
    formError.value = Object.keys(serverErrors.value).length
      ? tx('راجع الحقول المظللة بالأحمر.', 'Check the fields marked in red.')
      : errorText(error, tx('تعذر حفظ الخبر', 'Could not save the news line'));
    if (Object.keys(serverErrors.value).length) bilingual.reveal?.();
  } finally {
    saving.value = false;
  }
};

// ---- Status / delete
const toggle = (line) => toggleRow(line, newsLineService.toggle);

const deletingId = ref(null);
const remove = async (line) => {
  if (!(await confirmDelete(tx(`سيتم حذف الخبر «${textOf(line)}» نهائيًا.`, `“${textOf(line)}” will be deleted permanently.`)))) return;
  deletingId.value = line.id;
  try {
    await newsLineService.remove(line.id);
    lines.value = lines.value.filter((item) => item.id !== line.id);
    notify(tx('تم حذف الخبر', 'News line deleted'));
  } catch (error) {
    notify(errorText(error, tx('تعذر حذف الخبر', 'Could not delete the news line')), 'error');
  } finally {
    deletingId.value = null;
  }
};
</script>

<style scoped>
.news-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #f3f4f6; display: inline-flex; align-items: center; justify-content: center; color: var(--text-muted); }
.news-thumb.is-large { width: 72px; height: 72px; }
.news-link { color: var(--primary); text-decoration: none; font-size: 0.82rem; word-break: break-all; }
.news-link:hover { text-decoration: underline; }
.news-image-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.news-image-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.loc-btn.is-danger { color: #b91c1c; }
</style>
