<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import { useDialog } from '../composables/useDialog';
import { loadLegalPage, saveLegalPage } from '../services/legalPages';

const route = useRoute();
const { tx } = useAdminText();
const dialog = useDialog();

// 'privacy' or 'terms' (set on the route); the text is stored in the site settings API (key legal_pages).
const pageId = computed(() => route.meta.legalPage || 'privacy');
const titles = computed(() => ({
    privacy: { title: tx('سياسة الخصوصية', 'Privacy policy'), url: '/privacy-policy' },
    terms: { title: tx('الشروط والأحكام', 'Terms & conditions'), url: '/terms' },
}[pageId.value]));

// The notice box at the top of the page on the website: a cookies notice (with its on/off switch) on the privacy
// page, a legal alert on the terms page. Left empty, it is removed from the page.
const bannerMeta = computed(() => ({
    privacy: {
        heading: tx('إشعار ملفات تعريف الارتباط', 'Cookies notice'),
        hint: tx('الصندوق الأزرق أعلى الصفحة، وفيه سويتش «مُفعّل» يتحكم في إرسال بيانات التحليلات للزائر. لو تركت الكل فاضياً يتشال الصندوق والسويتش من الموقع.', 'The blue box at the top of the page, with the «Enabled» switch that lets the visitor allow or stop analytics. If you leave everything empty, the box and its switch are removed from the website.'),
    },
    terms: {
        heading: tx('التنبيه القانوني', 'Legal alert'),
        hint: tx('الصندوق الأحمر أعلى الصفحة. لو تركت الكل فاضياً يتشال من الموقع.', 'The red box at the top of the page. If you leave everything empty, it is removed from the website.'),
    },
}[pageId.value]));

const page = ref({ updated_at: '', tagline_ar: '', tagline_en: '', banner: { title_ar: '', title_en: '', text_ar: '', text_en: '' }, sections: [] });
const loading = ref(true);
const loadFailed = ref(false);
const savedBefore = ref(true);
const isSaving = ref(false);

const emptySection = () => ({ title_ar: '', title_en: '', text_ar: '', text_en: '' });

const load = async () => {
    loading.value = true;
    loadFailed.value = false;
    try {
        const result = await loadLegalPage(pageId.value);
        page.value = result.page;
        savedBefore.value = result.saved;
    } catch (error) {
        console.error('Failed to load legal page', error);
        loadFailed.value = true;
    } finally {
        loading.value = false;
    }
};
onMounted(load);

const addSection = () => { page.value.sections.push(emptySection()); };
const moveSection = (index, step) => {
    const target = index + step;
    if (target < 0 || target >= page.value.sections.length) return;
    const list = page.value.sections;
    [list[index], list[target]] = [list[target], list[index]];
};
const removeSection = async (index) => {
    const ok = await dialog.confirm(
        tx('سيتم حذف هذا القسم من الصفحة عند الحفظ.', 'This section will be removed from the page when you save.'),
        { type: 'error', title: tx(`حذف القسم ${index + 1}؟`, `Delete section ${index + 1}?`), confirmText: tx('حذف القسم', 'Delete section') },
    );
    if (ok) page.value.sections.splice(index, 1);
};

const alert = ref({ show: false, message: '', type: 'success' });
const triggerAlert = (message, type = 'success') => {
    alert.value = { show: true, message: localizeMessage(message), type };
    setTimeout(() => { alert.value.show = false; }, 3000);
};

const validate = () => {
    if (!/^\d{4}-\d{2}$/.test(page.value.updated_at)) return tx('حدد شهر آخر تحديث', 'Pick the last-updated month');
    if (!page.value.sections.length) return tx('أضف قسماً واحداً على الأقل', 'Add at least one section');
    const bad = page.value.sections.findIndex((s) => [s.title_ar, s.title_en, s.text_ar, s.text_en].some((v) => !String(v || '').trim()));
    if (bad >= 0) return tx(`القسم ${bad + 1}: العنوان والنص مطلوبان بالعربي والإنجليزي`, `Section ${bad + 1}: title and text are required in Arabic and English`);
    return '';
};

const save = async () => {
    const problem = validate();
    if (problem) { triggerAlert(problem, 'error'); return; }
    isSaving.value = true;
    try {
        await saveLegalPage(pageId.value, page.value);
        savedBefore.value = true;
        triggerAlert('تم حفظ الصفحة وستظهر في الموقع');
    } catch (error) {
        console.error('Failed to save legal page', error);
        triggerAlert(error?.code === 'LEGAL_PAGES_NOT_PERSISTED'
            ? 'لم يحفظ الخادم النص (المفتاح legal_pages غير مدعوم في الإعدادات). تواصل مع فريق الـ Backend.'
            : 'فشل حفظ الصفحة. حاول مرة أخرى.', 'error');
    } finally {
        isSaving.value = false;
    }
};
</script>

<template>
  <div class="legal-page p-6">
    <div class="breadcrumb mb-4">
      <span>{{ tx('إعداد الموقع', 'Site setup') }}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      <span class="active">{{ titles.title }}</span>
    </div>

    <div class="header-section mb-6">
      <div>
        <h1>{{ titles.title }}</h1>
        <p>{{ tx('عدّل النص فقط؛ تصميم الصفحة ثابت في الموقع.', 'Edit the text only; the page design is fixed on the website.') }}</p>
      </div>
      <div class="header-actions">
        <a :href="titles.url" target="_blank" rel="noopener" class="ghost-btn">{{ tx('معاينة في الموقع', 'View on website') }}</a>
        <button class="save-btn" :disabled="isSaving || loading || loadFailed" @click="save" data-testid="legal-save">
          {{ isSaving ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ التغييرات', 'Save changes') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">{{ tx('جاري التحميل...', 'Loading...') }}</div>
    <div v-else-if="loadFailed" class="state-box error">
      {{ tx('تعذر تحميل الصفحة من الخادم.', 'Could not load the page from the server.') }}
      <button class="ghost-btn" @click="load">{{ tx('إعادة المحاولة', 'Retry') }}</button>
    </div>

    <div v-else class="content-card shadow-sm">
      <div v-if="!savedBefore" class="info-alert mb-4">
        {{ tx('لا يوجد نص محفوظ لهذه الصفحة في إعدادات الموقع بعد. أضف الأقسام ثم اضغط «حفظ».', 'No text is stored for this page in the site settings yet. Add the sections, then press Save.') }}
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>{{ tx('آخر تحديث (الشهر والسنة)', 'Last updated (month and year)') }}</label>
          <input type="month" lang="en-GB" v-model="page.updated_at" class="ltr-input" data-testid="legal-updated" />
        </div>
        <div class="form-group"></div>
        <div class="form-group">
          <label>{{ tx('الجملة تحت العنوان (عربي)', 'Line under the title (Arabic)') }}</label>
          <input type="text" v-model="page.tagline_ar" maxlength="200" />
        </div>
        <div class="form-group">
          <label>{{ tx('الجملة تحت العنوان (إنجليزي)', 'Line under the title (English)') }}</label>
          <input type="text" v-model="page.tagline_en" maxlength="200" class="ltr-input" />
        </div>
      </div>

      <section class="section-block banner-block" data-testid="legal-banner">
        <div class="section-head">
          <span class="section-step banner-step">!</span>
          <h3>{{ bannerMeta.heading }}<small> · {{ tx('اختياري', 'Optional') }}</small></h3>
        </div>
        <p class="banner-hint">{{ bannerMeta.hint }}</p>
        <div class="form-grid">
          <div class="form-group">
            <label>{{ tx('العنوان (عربي)', 'Title (Arabic)') }}</label>
            <input type="text" v-model="page.banner.title_ar" maxlength="150" data-testid="legal-banner-title-ar" />
          </div>
          <div class="form-group">
            <label>{{ tx('العنوان (إنجليزي)', 'Title (English)') }}</label>
            <input type="text" v-model="page.banner.title_en" maxlength="150" class="ltr-input" data-testid="legal-banner-title-en" />
          </div>
          <div class="form-group">
            <label>{{ tx('النص (عربي)', 'Text (Arabic)') }}</label>
            <textarea v-model="page.banner.text_ar" rows="3" maxlength="400" data-testid="legal-banner-text-ar"></textarea>
          </div>
          <div class="form-group">
            <label>{{ tx('النص (إنجليزي)', 'Text (English)') }}</label>
            <textarea v-model="page.banner.text_en" rows="3" maxlength="400" class="ltr-input" data-testid="legal-banner-text-en"></textarea>
          </div>
        </div>
      </section>

      <section v-for="(section, index) in page.sections" :key="index" class="section-block" :data-testid="`legal-section-${index + 1}`">
        <div class="section-head">
          <span class="section-step">{{ index + 1 }}</span>
          <h3>{{ tx('القسم', 'Section') }} {{ index + 1 }}<small v-if="index === 0"> · {{ tx('المقدمة', 'Introduction') }}</small></h3>
          <div class="section-tools">
            <button type="button" class="icon-btn" :disabled="index === 0" :title="tx('نقل لأعلى', 'Move up')" @click="moveSection(index, -1)">↑</button>
            <button type="button" class="icon-btn" :disabled="index === page.sections.length - 1" :title="tx('نقل لأسفل', 'Move down')" @click="moveSection(index, 1)">↓</button>
            <button type="button" class="icon-btn danger" :title="tx('حذف القسم', 'Delete section')" @click="removeSection(index)">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>{{ tx('العنوان (عربي)', 'Title (Arabic)') }}</label>
            <input type="text" v-model="section.title_ar" maxlength="150" />
          </div>
          <div class="form-group">
            <label>{{ tx('العنوان (إنجليزي)', 'Title (English)') }}</label>
            <input type="text" v-model="section.title_en" maxlength="150" class="ltr-input" />
          </div>
          <div class="form-group">
            <label>{{ tx('النص (عربي)', 'Text (Arabic)') }}</label>
            <textarea v-model="section.text_ar" rows="6" maxlength="4000"></textarea>
          </div>
          <div class="form-group">
            <label>{{ tx('النص (إنجليزي)', 'Text (English)') }}</label>
            <textarea v-model="section.text_en" rows="6" maxlength="4000" class="ltr-input"></textarea>
          </div>
        </div>
      </section>

      <button type="button" class="ghost-btn add-btn" @click="addSection" data-testid="legal-add-section">+ {{ tx('إضافة قسم', 'Add section') }}</button>
    </div>

    <div v-if="alert.show" :class="['alert-toast', alert.type, 'show']">{{ alert.message }}</div>
  </div>
</template>

<style scoped>
.legal-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #9ca3af; }
.breadcrumb svg { transform: rotate(180deg); color: #d1d5db; }
.breadcrumb .active { color: #660033; font-weight: 700; }
.header-section { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.header-section h1 { font-size: 1.4rem; font-weight: 800; color: #1f2937; margin: 0; }
.header-section p { color: #6b7280; font-size: 0.85rem; margin: 0; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.save-btn { background: #660033; color: white; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.9rem; font-family: inherit; }
.save-btn:hover:not(:disabled) { background: #4d0026; }
.save-btn:disabled { background: #9ca3af; cursor: not-allowed; }
.ghost-btn { border: 1px solid #e5e7eb; background: white; color: #374151; padding: 10px 16px; border-radius: 10px; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-decoration: none; }
.ghost-btn:hover { background: #f9fafb; }
.content-card { background: white; border-radius: 20px; padding: 40px; border: 1px solid #f3f4f6; }
.state-box { background: white; border: 1px solid #f3f4f6; border-radius: 16px; padding: 40px; text-align: center; color: #6b7280; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.state-box.error { color: #b91c1c; }
.info-alert { background: #eff6ff; color: #1e40af; padding: 15px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 1px solid #dbeafe; }
.mb-4 { margin-bottom: 1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.form-group label { display: block; font-weight: 700; font-size: 0.9rem; color: #374151; margin-bottom: 10px; }
.form-group input, .form-group textarea { width: 100%; padding: 14px 18px; border: 1px solid #f3f4f6; border-radius: 12px; outline: none; font-family: inherit; font-size: 0.95rem; background: #fafafa; color: #1f2937; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { border-color: #660033; background: white; box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05); }
.form-group textarea { resize: vertical; min-height: 120px; }
.ltr-input { direction: ltr; text-align: left; }
.section-block { margin-top: 28px; border: 1px solid #e8ebf0; border-radius: 18px; padding: 24px; }
.section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.section-head h3 { margin: 0; flex: 1; font-size: 1.05rem; font-weight: 800; color: #111827; }
.section-head small { color: #6b7280; font-weight: 600; }
.section-step { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; background: #111827; color: #fff; font-size: 0.85rem; font-weight: 800; }
.section-tools { display: flex; gap: 6px; }
.icon-btn { width: 34px; height: 34px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: #374151; }
.icon-btn:hover:not(:disabled) { background: #f9fafb; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-btn.danger { color: #dc2626; border-color: #fecaca; }
.add-btn { margin-top: 28px; }
.banner-block { background: #fafcff; }
.banner-step { background: #0284c7; }
.banner-hint { margin: -6px 0 18px; color: #6b7280; font-size: 0.85rem; line-height: 1.6; }
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .content-card { padding: 20px; }
}
</style>
