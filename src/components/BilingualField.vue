<script setup>
// One bilingual input = ONE field with a big EN | AR switch above it.
// Put the Arabic input in the #ar slot and the English input in the #en slot.
// The switch flags a language that is still empty so it can't be forgotten.
import { ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';

const props = defineProps({
  label: { type: String, default: '' },
  required: { type: Boolean, default: false },
  filledAr: { type: Boolean, default: false },
  filledEn: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  // A parent bumps this ({ lang, n }) after a failed validation so the field jumps to the missing language.
  nudge: { type: Object, default: null },
});

const { tx, locale } = useAdminText();
const current = ref(locale.value === 'en' ? 'en' : 'ar');

watch(() => props.nudge, (value) => {
  if (!value?.lang) return;
  const filled = value.lang === 'ar' ? props.filledAr : props.filledEn;
  if (!filled) current.value = value.lang;
});
</script>

<template>
  <div class="bl-field" :class="{ 'bl-has-gap': !filledAr || !filledEn }">
    <div class="bl-head">
      <span v-if="label" class="bl-label">{{ label }}<span v-if="required" class="bl-req"> *</span></span>
      <div class="bl-switch" dir="ltr" role="tablist" :aria-label="tx('لغة الحقل', 'Field language')">
        <button
          type="button"
          role="tab"
          class="bl-opt"
          :class="{ active: current === 'en', empty: !filledEn }"
          :aria-selected="current === 'en'"
          @click="current = 'en'"
        >
          <span class="bl-code">EN</span>
          <span class="bl-state" :title="filledEn ? tx('مكتوب', 'Filled') : tx('فاضي', 'Empty')">{{ filledEn ? '✓' : '!' }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="bl-opt"
          :class="{ active: current === 'ar', empty: !filledAr }"
          :aria-selected="current === 'ar'"
          @click="current = 'ar'"
        >
          <span class="bl-code">AR</span>
          <span class="bl-state" :title="filledAr ? tx('مكتوب', 'Filled') : tx('فاضي', 'Empty')">{{ filledAr ? '✓' : '!' }}</span>
        </button>
      </div>
    </div>
    <p v-if="hint" class="bl-hint">{{ hint }}</p>
    <div class="bl-body">
      <div v-show="current === 'ar'" class="bl-pane"><slot name="ar" /></div>
      <div v-show="current === 'en'" class="bl-pane"><slot name="en" /></div>
    </div>
    <p v-if="current === 'ar' && !filledAr" class="bl-warn">{{ tx('النسخة العربية فاضية', 'Arabic is empty') }}</p>
    <p v-else-if="current === 'en' && !filledEn" class="bl-warn">{{ tx('النسخة الإنجليزية فاضية', 'English is empty') }}</p>
    <p v-else-if="current === 'ar' && !filledEn" class="bl-warn soft" @click="current = 'en'">{{ tx('الإنجليزي لسه فاضي — اضغط EN لكتابته', 'English is still empty — tap EN to write it') }}</p>
    <p v-else-if="current === 'en' && !filledAr" class="bl-warn soft" @click="current = 'ar'">{{ tx('العربي لسه فاضي — اضغط AR لكتابته', 'Arabic is still empty — tap AR to write it') }}</p>
  </div>
</template>

<style scoped>
.bl-field { margin-bottom: 1.1rem; }
.bl-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.bl-label { font-weight: 800; font-size: 0.9rem; color: #1f2937; }
.bl-req { color: #dc2626; }
.bl-switch { display: inline-flex; padding: 3px; gap: 3px; background: #f3e8ee; border: 2px solid #660033; border-radius: 999px; }
.bl-opt {
  display: inline-flex; align-items: center; gap: 0.4rem;
  border: none; background: transparent; color: #660033; cursor: pointer;
  padding: 0.3rem 0.85rem; border-radius: 999px; min-width: 74px; justify-content: center;
  font-family: inherit; font-weight: 900; font-size: 0.9rem; letter-spacing: 0.06em;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.bl-opt:hover:not(.active) { background: rgba(102, 0, 51, 0.1); }
.bl-opt.active { background: #660033; color: #fff; box-shadow: 0 2px 6px rgba(102, 0, 51, 0.35); }
.bl-state {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%; font-size: 0.7rem; font-weight: 900; line-height: 1;
  background: #16a34a; color: #fff;
}
.bl-opt.empty .bl-state { background: #f59e0b; color: #fff; animation: bl-pulse 1.6s ease-in-out infinite; }
.bl-opt.active.empty .bl-state { background: #fbbf24; color: #660033; }
.bl-hint { margin: 0 0 0.5rem; font-size: 0.78rem; color: #6b7280; }
.bl-warn { margin: 0.35rem 0 0; font-size: 0.78rem; font-weight: 700; color: #b45309; }
.bl-warn.soft { font-weight: 600; color: #92400e; cursor: pointer; }
.bl-pane :deep(input),
.bl-pane :deep(textarea) { width: 100%; }
@keyframes bl-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
</style>
