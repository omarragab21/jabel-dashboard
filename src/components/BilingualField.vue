<template>
  <div
    ref="rootEl"
    class="bf"
    :class="[`bf--${status}`, `bf--${severity}`, { 'bf--shake': shaking, 'bf--revealed': revealed }]"
    :data-status="status"
    :data-lang="lang"
    :data-testid="testid || undefined"
  >
    <div class="bf-head">
      <slot name="label" :lang="lang" :for-id="activeId">
        <label v-if="label" class="bf-label" :for="activeId || undefined">
          {{ label }}<span v-if="requiredLangs.length" class="bf-req" aria-hidden="true"> *</span>
        </label>
        <span v-else class="bf-label-spacer" />
      </slot>

      <div class="bf-tools">
        <Transition name="bf-pop" mode="out-in">
          <span
            :key="`${status}-${severity}`"
            class="bf-status"
            :class="`bf-status--${severity}`"
            role="status"
            :title="statusTitle"
            :data-testid="testid ? `${testid}-status` : undefined"
          >
            <svg v-if="severity === 'ok'" class="bf-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <svg v-else class="bf-warn" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">
              <line x1="12" y1="6.5" x2="12" y2="13.5" /><line x1="12" y1="17.5" x2="12" y2="17.6" />
            </svg>
            <span class="bf-status-text">{{ statusText }}</span>
          </span>
        </Transition>

        <div class="bf-switch" :class="{ 'is-second': activeIndex === 1, 'is-rtl': isRtl }" role="tablist" :aria-label="tx('لغة الحقل', 'Field language')">
          <span class="bf-thumb" aria-hidden="true" />
          <button
            v-for="code in order"
            :key="code"
            type="button"
            role="tab"
            class="bf-opt"
            :class="{ active: lang === code, filled: filled[code], missing: !filled[code], required: requiredLangs.includes(code), invalid: code === 'ar' ? invalidAr : invalidEn }"
            :aria-selected="lang === code"
            :title="optionTitle(code)"
            :data-testid="testid ? `${testid}-tab-${code}` : undefined"
            @click="choose(code)"
          >
            <span class="bf-opt-text" :lang="code">{{ code === 'ar' ? 'عربي' : 'English' }}</span>
            <span class="bf-dot" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div ref="bodyEl" class="bf-body">
      <slot :lang="lang" :dir="lang === 'ar' ? 'rtl' : 'ltr'" :is-ar="lang === 'ar'" :is-en="lang === 'en'" />
    </div>
  </div>
</template>

<script setup>
// One widget for every Arabic / English field in the dashboard.
// The label sits at the start of the row; at its end (left in Arabic, right in English) are the
// field's own عربي / English switch and a status badge: "no Arabic", "no English", "empty" or a check
// once both are written. The inputs themselves stay in the page (default slot, receives `lang`),
// so each form keeps its own look, ids, test ids and validation.
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { bilingualStatus, hasText, missingLanguages } from '../utils/bilingualText';
import { injectBilingualForm } from '../composables/useBilingualForm';

const props = defineProps({
  /** Arabic value (read only: used for the status). */
  ar: { type: [String, Number, Array, Object], default: '' },
  /** English value (read only: used for the status). */
  en: { type: [String, Number, Array, Object], default: '' },
  /** Plain label; pages with their own label style pass a #label slot instead (scoped styles reach slots). */
  label: { type: String, default: '' },
  /** true: both languages are required; 'ar' or 'en': only that one (the other is optional). */
  required: { type: [Boolean, String], default: false },
  /** Ids of the Arabic / English inputs, so the label points at the visible one. */
  idAr: { type: String, default: '' },
  idEn: { type: String, default: '' },
  /** Validation errors coming from the page: the field jumps to that language. */
  invalidAr: { type: Boolean, default: false },
  invalidEn: { type: Boolean, default: false },
  testid: { type: String, default: '' },
});

const { locale } = useI18n();
const uiLang = () => (locale.value === 'en' ? 'en' : 'ar');
const tx = (ar, en) => (locale.value === 'en' ? en : ar);

const rootEl = ref(null);
const bodyEl = ref(null);
const lang = ref(uiLang());
const shaking = ref(false);
const revealed = ref(false);

// The dashboard language comes first: عربي | English in Arabic, English | عربي in English.
const order = computed(() => (uiLang() === 'ar' ? ['ar', 'en'] : ['en', 'ar']));
const activeIndex = computed(() => order.value.indexOf(lang.value));
const activeId = computed(() => (lang.value === 'ar' ? props.idAr : props.idEn));

const filled = computed(() => ({ ar: hasText(props.ar), en: hasText(props.en) }));
const status = computed(() => bilingualStatus(props.ar, props.en));
const requiredLangs = computed(() => {
  if (props.required === true || props.required === '') return ['ar', 'en'];
  return props.required === 'ar' || props.required === 'en' ? [props.required] : [];
});
// ok: both written · bad: a required language (or an invalid one) is missing · warn: an optional one is · muted: empty and optional
const severity = computed(() => {
  if (props.invalidAr || props.invalidEn) return 'bad';
  if (status.value === 'complete') return 'ok';
  if (requiredLangs.value.some((code) => !filled.value[code])) return 'bad';
  return status.value === 'empty' ? 'muted' : 'warn';
});

const statusText = computed(() => {
  // An invalid language that is simply empty reads as "no Arabic / English"; "check" is for written-but-wrong text.
  if (props.invalidAr && filled.value.ar) return tx('راجع العربي', 'Check Arabic');
  if (props.invalidEn && filled.value.en) return tx('راجع الإنجليزي', 'Check English');
  if (props.invalidAr || props.invalidEn) {
    return props.invalidAr ? tx('لا يوجد عربي', 'No Arabic') : tx('لا يوجد إنجليزي', 'No English');
  }
  return baseStatusText.value;
});
const baseStatusText = computed(() => ({
  complete: tx('مكتمل', 'Complete'),
  'missing-ar': tx('لا يوجد عربي', 'No Arabic'),
  'missing-en': tx('لا يوجد إنجليزي', 'No English'),
  empty: requiredLangs.value.length ? tx('مطلوب', 'Required') : tx('فارغ', 'Empty'),
}[status.value]));

const statusTitle = computed(() => ({
  complete: tx('مكتوب بالعربي والإنجليزي', 'Written in Arabic and English'),
  'missing-ar': tx('النص العربي غير مكتوب', 'The Arabic text is not written'),
  'missing-en': tx('النص الإنجليزي غير مكتوب', 'The English text is not written'),
  empty: tx('لم يُكتب بالعربي ولا بالإنجليزي', 'Not written in Arabic or English'),
}[status.value]));

const optionTitle = (code) => {
  const name = code === 'ar' ? tx('العربي', 'Arabic') : tx('الإنجليزي', 'English');
  return filled.value[code] ? `${name}: ${tx('مكتوب', 'written')}` : `${name}: ${tx('غير مكتوب', 'not written')}`;
};

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Slide the body in from the side of the language just picked.
const animateBody = (next, prev) => {
  const el = bodyEl.value;
  if (!el || next === prev || reducedMotion() || typeof el.animate !== 'function') return;
  const rtl = getComputedStyle(el).direction === 'rtl';
  const forward = order.value.indexOf(next) > order.value.indexOf(prev);
  const shift = (forward ? 1 : -1) * (rtl ? -10 : 10);
  el.animate(
    [{ opacity: 0, transform: `translateX(${shift}px)` }, { opacity: 1, transform: 'translateX(0)' }],
    { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
};

const isVisible = (node) => node && node.offsetParent !== null && !node.disabled && node.type !== 'hidden' && node.type !== 'file';
const focusVisibleInput = () => {
  const target = [...(bodyEl.value?.querySelectorAll('input, textarea, select, [contenteditable="true"]') || [])].find(isVisible);
  target?.focus({ preventScroll: true });
};

const setLang = (next) => {
  if (next !== 'ar' && next !== 'en') return;
  const prev = lang.value;
  lang.value = next;
  if (next !== prev) nextTick(() => animateBody(next, prev));
};

const choose = (code) => {
  setLang(code);
  nextTick(focusVisibleInput);
};

const shake = () => {
  if (reducedMotion()) return;
  shaking.value = false;
  requestAnimationFrame(() => {
    shaking.value = true;
    setTimeout(() => { shaking.value = false; }, 520);
  });
};

// A language the page marks as invalid is shown straight away (no shake: it may happen while typing).
watch(() => props.invalidAr, (bad) => { if (bad) setLang('ar'); });
watch(() => props.invalidEn, (bad) => { if (bad && !props.invalidAr) setLang('en'); });

// The language that stops the form from saving: invalid first, then a missing required one.
const problemLanguage = () => {
  if (props.invalidAr) return 'ar';
  if (props.invalidEn) return 'en';
  return missingLanguages(props.ar, props.en, uiLang()).find((code) => requiredLangs.value.includes(code)) || '';
};

// The switch's thumb slides the way the page reads; read from the element itself, not the locale,
// so a field inside a left-to-right box still moves the right way.
const isRtl = ref(uiLang() === 'ar');
const readDirection = () => {
  if (rootEl.value) isRtl.value = getComputedStyle(rootEl.value).direction === 'rtl';
};
onMounted(readDirection);

// A change of dashboard language moves every field to it.
watch(locale, () => {
  setLang(uiLang());
  nextTick(readDirection);
});

const form = injectBilingualForm();
if (form) {
  watch(() => form.resetTick, () => {
    lang.value = uiLang();
    revealed.value = false;
  });
  watch(() => form.revealTick, async () => {
    const problem = problemLanguage();
    revealed.value = Boolean(problem);
    if (!problem) return;
    setLang(problem);
    shake();
    await nextTick();
    // Only the first field with a problem scrolls into view.
    const scope = rootEl.value?.closest('form, [role="dialog"], .modal, .modal-content') || document;
    if (scope.querySelector('.bf--revealed') === rootEl.value) {
      rootEl.value.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
      focusVisibleInput();
    }
  });
}

// Fixing the problem clears the red highlight.
watch([status, () => props.invalidAr, () => props.invalidEn], () => {
  if (revealed.value && !problemLanguage()) revealed.value = false;
});

defineExpose({ setLang, lang });
</script>

<style scoped>
.bf {
  --bf-brand: var(--primary, #660033);
  --bf-ok: #16a34a;
  --bf-ok-bg: rgba(22, 163, 74, 0.1);
  --bf-warn: #b45309;
  --bf-warn-bg: rgba(245, 158, 11, 0.14);
  --bf-bad: #dc2626;
  --bf-bad-bg: rgba(220, 38, 38, 0.1);
  --bf-muted: var(--text-muted, #787586);
  --bf-muted-bg: rgba(120, 117, 134, 0.12);
  --bf-line: var(--border-color, #e2e0e7);
  --bf-surface: var(--bg-card, #fff);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.bf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  min-height: 30px;
}
.bf-label { margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main, #2e2b3a); }
.bf-head :slotted(label) { margin: 0; }
.bf-label-spacer { flex: 1; }
.bf-req { color: var(--bf-bad); }

.bf-tools {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-inline-start: auto;
}

/* Status badge */
.bf-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 24px;
  padding: 0 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transition: background-color 0.25s ease, color 0.25s ease;
}
.bf-status--ok { color: var(--bf-ok); background: var(--bf-ok-bg); padding: 0 0.5rem; }
.bf-status--warn { color: var(--bf-warn); background: var(--bf-warn-bg); }
.bf-status--muted { color: var(--bf-muted); background: var(--bf-muted-bg); }
.bf-status--bad { color: var(--bf-bad); background: var(--bf-bad-bg); }

.bf-check path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: bf-draw 0.45s 0.08s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}
.bf-status--ok { animation: bf-glow 0.7s ease-out; }

/* Language switch with a sliding thumb */
.bf-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 3px;
  border: 1px solid var(--bf-line);
  border-radius: 10px;
  background: var(--bf-surface);
  isolation: isolate;
}
.bf-thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  inset-inline-start: 3px;
  width: calc(50% - 3px);
  border-radius: 7px;
  background: var(--bf-brand);
  box-shadow: 0 2px 6px rgba(102, 0, 51, 0.28);
  transition: transform 0.32s cubic-bezier(0.34, 1.3, 0.5, 1);
  z-index: -1;
}
.bf-switch.is-second .bf-thumb { transform: translateX(100%); }
.bf-switch.is-rtl.is-second .bf-thumb { transform: translateX(-100%); }

.bf-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 64px;
  height: 26px;
  padding: 0 0.6rem;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--bf-muted);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;
}
.bf-opt:hover:not(.active) { color: var(--text-main, #2e2b3a); }
.bf-opt.active { color: #fff; }
.bf-opt:focus-visible { outline: 2px solid var(--bf-brand); outline-offset: 2px; }

.bf-dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color 0.25s ease, transform 0.25s ease;
}
.bf-opt.filled .bf-dot { background: var(--bf-ok); }
.bf-opt.missing .bf-dot { background: var(--bf-warn); }
.bf-opt.required.missing .bf-dot,
.bf-opt.invalid .bf-dot { background: var(--bf-bad); }
.bf-opt.active.filled .bf-dot { background: #86efac; }
.bf-opt.active.missing .bf-dot { background: #fcd34d; }
.bf-opt.active.required.missing .bf-dot,
.bf-opt.active.invalid .bf-dot { background: #fca5a5; }
.bf-opt.missing .bf-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: inherit;
  animation: bf-pulse 1.8s ease-out infinite;
}

.bf-body { min-width: 0; }

/* Shake when saving is refused for a missing language */
.bf--shake .bf-switch { animation: bf-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
.bf--revealed .bf-switch { border-color: var(--bf-bad); box-shadow: 0 0 0 3px var(--bf-bad-bg); }

/* Badge swap */
.bf-pop-enter-active { transition: opacity 0.22s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bf-pop-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.bf-pop-enter-from { opacity: 0; transform: scale(0.6); }
.bf-pop-leave-to { opacity: 0; transform: scale(0.85); }

@keyframes bf-draw { to { stroke-dashoffset: 0; } }
@keyframes bf-glow {
  0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.45); }
  100% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
}
@keyframes bf-pulse {
  0% { transform: scale(1); opacity: 0.7; }
  70%, 100% { transform: scale(2.6); opacity: 0; }
}
@keyframes bf-shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}

@media (max-width: 480px) {
  .bf-status-text { display: none; }
  .bf-status { padding: 0 0.4rem; }
  .bf-opt { min-width: 52px; padding: 0 0.45rem; }
}

@media (prefers-reduced-motion: reduce) {
  .bf-thumb, .bf-status, .bf-dot, .bf-opt { transition: none; }
  .bf-check path { animation: none; stroke-dashoffset: 0; }
  .bf-status--ok, .bf-opt.missing .bf-dot::after, .bf--shake .bf-switch { animation: none; }
  .bf-pop-enter-active, .bf-pop-leave-active { transition: none; }
}
</style>
