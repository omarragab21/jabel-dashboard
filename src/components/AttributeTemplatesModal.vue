<script setup>
// Attribute templates screen: pick a template, review/untick what you don't want, create everything.
import { computed, ref } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import { ATTRIBUTE_TEMPLATES, parseTemplateValue, templateStats } from '../domain/attributeTemplates';
import { applyTemplate, planTemplate } from '../services/attributeTemplateService';

const props = defineProps({ attributes: { type: Array, default: () => [] } });
const emit = defineEmits(['close', 'done']);
const { tx, locale } = useAdminText();
const lang = computed(() => (locale.value === 'en' ? 1 : 0));
const pick = (pair) => pair[lang.value];

const step = ref('gallery'); // gallery -> preview -> running -> result
const template = ref(null);
const selection = ref([]); // per attribute: { include, core, open, values: boolean[] }
const progress = ref({ done: 0, total: 0, label: '' });
const summary = ref(null);

const openTemplate = (item) => {
  template.value = item;
  selection.value = item.attributes.map((attribute) => ({
    include: true,
    core: Boolean(attribute.core),
    open: false,
    values: attribute.values.map(() => true),
  }));
  step.value = 'preview';
};

const plan = computed(() => (template.value ? planTemplate(template.value, selection.value, props.attributes) : { attributes: 0, values: 0, rows: [] }));
const rowFor = (index) => plan.value.rows.find((row) => row.index === index);
const allIncluded = computed(() => selection.value.every((choice) => choice.include));
const toggleAll = () => { const next = !allIncluded.value; selection.value.forEach((choice) => { choice.include = next; }); };
const setAllValues = (index, on) => { selection.value[index].values = selection.value[index].values.map(() => on); };
const chosenCount = (index) => selection.value[index].values.filter(Boolean).length;
const nothingToCreate = computed(() => plan.value.attributes === 0 && plan.value.values === 0);

const percent = computed(() => (progress.value.total ? Math.round((progress.value.done / progress.value.total) * 100) : 100));

const run = async () => {
  step.value = 'running';
  progress.value = { done: 0, total: plan.value.attributes + plan.value.values, label: '' };
  summary.value = await applyTemplate({
    template: template.value,
    selection: selection.value,
    existing: props.attributes,
    onProgress: (value) => { progress.value = value; },
  });
  step.value = 'result';
};

const finish = () => { emit('done'); emit('close'); };
const close = () => { if (step.value === 'running') return; if (step.value === 'result') finish(); else emit('close'); };
</script>

<template>
  <div class="tpl-overlay" @click.self="close" data-testid="attribute-templates">
    <div class="tpl-screen" role="dialog" aria-modal="true">
      <header class="tpl-head">
        <button v-if="step === 'preview'" type="button" class="tpl-back" @click="step = 'gallery'">← {{ tx('رجوع', 'Back') }}</button>
        <div class="tpl-titles">
          <h2>{{ step === 'gallery' ? tx('قوالب الخصائص الجاهزة', 'Ready-made attribute templates') : template ? `${template.icon} ${pick(template.name)}` : '' }}</h2>
          <p v-if="step === 'gallery'">{{ tx('اختر قالباً وسيتم إنشاء كل خصائصه وقيمها دفعة واحدة. تقدر تعدّل أي حاجة بعدها.', 'Pick a template and all its attributes and values are created at once. You can edit anything afterwards.') }}</p>
          <p v-else-if="step === 'preview'">{{ pick(template.description) }}</p>
        </div>
        <button v-if="step !== 'running'" type="button" class="tpl-close" :aria-label="tx('إغلاق', 'Close')" @click="close">×</button>
      </header>

      <!-- 1. Templates -->
      <div v-if="step === 'gallery'" class="tpl-body">
        <div class="tpl-grid">
          <button v-for="item in ATTRIBUTE_TEMPLATES" :key="item.id" type="button" class="tpl-card" :data-testid="`template-${item.id}`" @click="openTemplate(item)">
            <span class="tpl-icon">{{ item.icon }}</span>
            <strong>{{ pick(item.name) }}</strong>
            <span class="tpl-desc">{{ pick(item.description) }}</span>
            <span class="tpl-stats">
              <b>{{ templateStats(item).attributes }}</b> {{ tx('خصائص', 'attributes') }} · <b>{{ templateStats(item).values }}</b> {{ tx('قيمة', 'values') }}
            </span>
            <span class="tpl-chips"><i v-for="attribute in item.attributes.slice(0, 4)" :key="attribute.name[1]">{{ pick(attribute.name) }}</i><i v-if="item.attributes.length > 4">+{{ item.attributes.length - 4 }}</i></span>
          </button>
        </div>
      </div>

      <!-- 2. Preview -->
      <div v-else-if="step === 'preview'" class="tpl-body">
        <div class="tpl-tools">
          <label class="tpl-check"><input type="checkbox" :checked="allIncluded" @change="toggleAll" /> {{ tx('تحديد كل الخصائص', 'Select all attributes') }}</label>
          <span class="tpl-hint">{{ tx('شيل علامة ✓ من أي خاصية أو قيمة مش عايزها قبل الإنشاء.', 'Untick any attribute or value you don\'t want before creating.') }}</span>
        </div>
        <div v-for="(attribute, index) in template.attributes" :key="attribute.name[1]" class="tpl-attr" :class="{ off: !selection[index].include }">
          <div class="tpl-attr-head">
            <label class="tpl-check strong"><input v-model="selection[index].include" type="checkbox" /> {{ pick(attribute.name) }}</label>
            <span v-if="attribute.type === 'color'" class="tpl-tag">{{ tx('ألوان', 'Colors') }}</span>
            <span v-if="rowFor(index)?.exists" class="tpl-tag warn">{{ tx('موجودة — هتتضاف القيم الناقصة بس', 'Already exists — only missing values are added') }}</span>
            <label class="tpl-check core"><input v-model="selection[index].core" type="checkbox" :disabled="!selection[index].include" /> {{ tx('أساسية', 'Core') }}</label>
            <button type="button" class="tpl-toggle" @click="selection[index].open = !selection[index].open">
              {{ chosenCount(index) }}/{{ attribute.values.length }} {{ tx('قيمة', 'values') }} {{ selection[index].open ? '▲' : '▼' }}
            </button>
          </div>
          <div v-if="selection[index].open" class="tpl-values">
            <div class="tpl-values-tools">
              <button type="button" @click="setAllValues(index, true)">{{ tx('الكل', 'All') }}</button>
              <button type="button" @click="setAllValues(index, false)">{{ tx('لا شيء', 'None') }}</button>
            </div>
            <label v-for="(raw, valueIndex) in attribute.values" :key="raw" class="tpl-chip" :class="{ on: selection[index].values[valueIndex] }">
              <input v-model="selection[index].values[valueIndex]" type="checkbox" />
              <span v-if="parseTemplateValue(raw).color" class="tpl-dot" :style="{ background: parseTemplateValue(raw).color }"></span>
              {{ pick([parseTemplateValue(raw).name_ar, parseTemplateValue(raw).name_en]) }}
            </label>
          </div>
        </div>
      </div>

      <!-- 3. Running -->
      <div v-else-if="step === 'running'" class="tpl-body tpl-center">
        <div class="tpl-spinner"></div>
        <h3>{{ tx('جاري إنشاء القالب...', 'Creating the template...') }}</h3>
        <div class="tpl-bar"><span :style="{ width: percent + '%' }"></span></div>
        <p class="tpl-progress">{{ progress.done }} / {{ progress.total }} · {{ percent }}%</p>
        <p class="tpl-label">{{ progress.label }}</p>
        <p class="tpl-hint">{{ tx('ما تقفلش الصفحة لحد ما يخلص.', 'Please keep this page open until it finishes.') }}</p>
      </div>

      <!-- 4. Result -->
      <div v-else-if="step === 'result'" class="tpl-body tpl-center">
        <div class="tpl-done" :class="{ bad: summary.failures.length }">{{ summary.failures.length ? '!' : '✓' }}</div>
        <h3>{{ summary.failures.length ? tx('اتعمل القالب مع بعض الأخطاء', 'Template created with some errors') : tx('تم إنشاء القالب بنجاح', 'Template created successfully') }}</h3>
        <ul class="tpl-summary">
          <li><b>{{ summary.createdAttributes }}</b> {{ tx('خاصية جديدة', 'new attributes') }}</li>
          <li v-if="summary.reusedAttributes"><b>{{ summary.reusedAttributes }}</b> {{ tx('خاصية كانت موجودة (اتضافت لها القيم الناقصة)', 'attributes already existed (missing values added)') }}</li>
          <li><b>{{ summary.createdValues }}</b> {{ tx('قيمة جديدة', 'new values') }}</li>
          <li v-if="summary.skippedValues"><b>{{ summary.skippedValues }}</b> {{ tx('قيمة موجودة قبل كده (اتخطّت)', 'values already existed (skipped)') }}</li>
        </ul>
        <div v-if="summary.failures.length" class="tpl-errors">
          <strong>{{ tx('تعذر إنشاء:', 'Could not create:') }}</strong>
          <p v-for="(failure, index) in summary.failures" :key="index">{{ failure.attribute }}<template v-if="failure.value"> › {{ failure.value }}</template><template v-if="failure.message"> — {{ failure.message }}</template></p>
        </div>
        <p v-if="summary.coreFailed" class="tpl-errors">{{ tx('اتعملت الخصائص، لكن تعذر تعليمها كأساسية. علّمها من صفحة الخصائص.', 'Attributes were created, but marking them as core failed. Mark them on the attributes page.') }}</p>
      </div>

      <footer v-if="step === 'preview'" class="tpl-foot">
        <div class="tpl-total">
          <template v-if="nothingToCreate">{{ tx('مفيش حاجة جديدة هتتعمل: كل اللي اخترته موجود.', 'Nothing new to create: everything you picked already exists.') }}</template>
          <template v-else>{{ tx('هيتم إنشاء', 'Will create') }} <b>{{ plan.attributes }}</b> {{ tx('خاصية و', 'attributes and') }} <b>{{ plan.values }}</b> {{ tx('قيمة', 'values') }}</template>
        </div>
        <button type="button" class="tpl-btn ghost" @click="emit('close')">{{ tx('إلغاء', 'Cancel') }}</button>
        <button type="button" class="tpl-btn" :disabled="nothingToCreate" data-testid="template-apply" @click="run">{{ tx('إنشاء الكل', 'Create all') }}</button>
      </footer>
      <footer v-else-if="step === 'result'" class="tpl-foot">
        <button type="button" class="tpl-btn" data-testid="template-done" @click="finish">{{ tx('تم', 'Done') }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.tpl-overlay { position: fixed; inset: 0; z-index: 1200; background: rgba(17, 12, 22, 0.55); display: flex; align-items: stretch; justify-content: center; padding: 1.25rem; }
.tpl-screen { display: flex; flex-direction: column; width: min(1080px, 100%); background: var(--bg-main, #f8f7fa); color: var(--text-main, #2e2b3a); border-radius: 20px; overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35); }
.tpl-head { display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.4rem; background: var(--bg-card, #fff); border-bottom: 1px solid var(--border-color, #e2e0e7); }
.tpl-titles { flex: 1; min-width: 0; }
.tpl-titles h2 { margin: 0; font-size: 1.25rem; font-weight: 800; }
.tpl-titles p { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-muted, #787586); }
.tpl-close, .tpl-back { border: 1px solid var(--border-color, #e2e0e7); background: var(--bg-card, #fff); color: inherit; border-radius: 10px; cursor: pointer; font: inherit; font-weight: 700; }
.tpl-close { width: 38px; height: 38px; font-size: 1.4rem; line-height: 1; }
.tpl-back { padding: 0.45rem 0.9rem; font-size: 0.85rem; }
.tpl-close:hover, .tpl-back:hover { border-color: var(--primary, #660033); color: var(--primary, #660033); }
.tpl-body { flex: 1; overflow: auto; padding: 1.25rem 1.4rem; }
.tpl-center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.6rem; }
.tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.tpl-card { display: flex; flex-direction: column; align-items: flex-start; gap: 0.45rem; text-align: start; padding: 1.1rem; cursor: pointer; font: inherit; color: inherit;
  background: var(--bg-card, #fff); border: 1.5px solid var(--border-color, #e2e0e7); border-radius: 16px; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
.tpl-card:hover { border-color: var(--primary, #660033); box-shadow: 0 10px 26px rgba(102, 0, 51, 0.14); transform: translateY(-2px); }
.tpl-icon { font-size: 2rem; line-height: 1; }
.tpl-card strong { font-size: 1rem; font-weight: 800; }
.tpl-desc { font-size: 0.8rem; color: var(--text-muted, #787586); line-height: 1.5; min-height: 2.4em; }
.tpl-stats { font-size: 0.8rem; color: var(--primary, #660033); }
.tpl-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.tpl-chips i { font-style: normal; font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: rgba(102, 0, 51, 0.08); color: var(--primary, #660033); }
.tpl-tools { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
.tpl-hint { font-size: 0.8rem; color: var(--text-muted, #787586); }
.tpl-check { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; cursor: pointer; }
.tpl-check.strong { font-weight: 800; font-size: 0.95rem; }
.tpl-check input, .tpl-chip input { accent-color: var(--primary, #660033); width: 16px; height: 16px; cursor: pointer; }
.tpl-attr { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e2e0e7); border-radius: 14px; padding: 0.8rem 1rem; margin-bottom: 0.7rem; }
.tpl-attr.off { opacity: 0.5; }
.tpl-attr-head { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
.tpl-attr-head .strong { margin-inline-end: auto; }
.tpl-tag { font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 999px; background: rgba(102, 0, 51, 0.1); color: var(--primary, #660033); font-weight: 700; }
.tpl-tag.warn { background: #fef3c7; color: #92400e; }
.tpl-toggle { border: 1px solid var(--border-color, #e2e0e7); background: transparent; color: inherit; border-radius: 8px; padding: 0.25rem 0.65rem; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
.tpl-values { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; padding-top: 0.7rem; border-top: 1px dashed var(--border-color, #e2e0e7); }
.tpl-values-tools { width: 100%; display: flex; gap: 0.4rem; }
.tpl-values-tools button { border: none; background: transparent; color: var(--primary, #660033); font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; padding: 0; margin-inline-end: 0.7rem; }
.tpl-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.8rem; cursor: pointer;
  border: 1px solid var(--border-color, #e2e0e7); background: var(--bg-main, #f8f7fa); color: var(--text-muted, #787586); }
.tpl-chip.on { border-color: var(--primary, #660033); background: rgba(102, 0, 51, 0.07); color: var(--text-main, #2e2b3a); font-weight: 600; }
.tpl-chip input { width: 14px; height: 14px; }
.tpl-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.25); flex: none; }
.tpl-foot { display: flex; align-items: center; gap: 0.7rem; padding: 0.9rem 1.4rem; background: var(--bg-card, #fff); border-top: 1px solid var(--border-color, #e2e0e7); }
.tpl-total { flex: 1; font-size: 0.92rem; }
.tpl-total b, .tpl-summary b { color: var(--primary, #660033); }
.tpl-btn { border: none; cursor: pointer; font: inherit; font-weight: 800; font-size: 0.9rem; padding: 0.65rem 1.4rem; border-radius: 12px; color: #fff; background: var(--primary, #660033); }
.tpl-btn:hover:not(:disabled) { background: var(--primary-hover, #4d0026); }
.tpl-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.tpl-btn.ghost { background: transparent; color: inherit; border: 1px solid var(--border-color, #e2e0e7); }
.tpl-bar { width: min(420px, 90%); height: 10px; border-radius: 999px; background: rgba(102, 0, 51, 0.12); overflow: hidden; }
.tpl-bar span { display: block; height: 100%; background: var(--primary, #660033); transition: width 0.2s; }
.tpl-progress { font-weight: 800; margin: 0; }
.tpl-label { margin: 0; font-size: 0.85rem; color: var(--text-muted, #787586); min-height: 1.3em; }
.tpl-spinner { width: 46px; height: 46px; border-radius: 50%; border: 4px solid rgba(102, 0, 51, 0.15); border-top-color: var(--primary, #660033); animation: tpl-spin 0.9s linear infinite; }
.tpl-done { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-size: 2rem; font-weight: 900; color: #fff; background: #16a34a; }
.tpl-done.bad { background: #f59e0b; }
.tpl-summary { list-style: none; margin: 0.4rem 0 0; padding: 0; display: grid; gap: 0.35rem; font-size: 0.95rem; }
.tpl-errors { max-width: 560px; text-align: start; font-size: 0.82rem; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 0.7rem 1rem; }
.tpl-errors p { margin: 0.2rem 0 0; }
@keyframes tpl-spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .tpl-overlay { padding: 0; } .tpl-screen { border-radius: 0; } }
</style>
