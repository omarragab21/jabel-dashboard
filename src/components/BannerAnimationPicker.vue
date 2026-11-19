<script setup>
// Choose how the homepage banners change on the website. The Homepage Banners page shows the current choice and a button;
// the button opens a dialog with every animation. Picking one plays it in the preview stage (a small copy of the website
// hero using the website's own CSS) so it can be seen BEFORE saving; "Save animation" stores it in the site setting
// `banner_animation` and the website plays it.
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import settingsService from '../services/settingsService';
import { BANNER_ANIMATION_GROUPS, BANNER_ANIMATIONS, BANNER_ANIMATION_KEY, bannerTransitionName, resolveBannerAnimation } from '../domain/bannerAnimation';
import '../assets/bannerAnimations.css';

// Real banner photos (from the table) make the preview truthful; without any, three coloured slides are used.
const props = defineProps({ images: { type: Array, default: () => [] } });

const { tx, locale } = useAdminText();
const lang = computed(() => (locale.value === 'en' ? 1 : 0));

const open = ref(false);
const saved = ref('cinematic');
const selected = ref('cinematic');
const loading = ref(true);
const saving = ref(false);
const message = ref({ text: '', error: false });
const changed = computed(() => selected.value !== saved.value);
const selectedItem = computed(() => BANNER_ANIMATIONS.find((entry) => entry.id === selected.value));
const savedItem = computed(() => BANNER_ANIMATIONS.find((entry) => entry.id === saved.value));
const filter = ref('all');
const groups = computed(() => (filter.value === 'all' ? BANNER_ANIMATION_GROUPS : BANNER_ANIMATION_GROUPS.filter((group) => group.id === filter.value)));

// ── preview stage ──
const FALLBACK_BG = ['linear-gradient(120deg,#660033,#b83280)', 'linear-gradient(120deg,#0f4c5c,#2a9d8f)', 'linear-gradient(120deg,#5f0f40,#fb8b24)'];
const slides = computed(() => {
  const photos = props.images.filter(Boolean).slice(0, 3);
  const count = Math.max(2, photos.length);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    bg: { backgroundImage: photos[i] ? `url("${String(photos[i]).replace(/["\\\n\r]/g, '')}"), ${FALLBACK_BG[i % FALLBACK_BG.length]}` : FALLBACK_BG[i % FALLBACK_BG.length] },
    title: tx(`عنوان البانر ${i + 1}`, `Banner title ${i + 1}`),
    desc: tx('وصف قصير يظهر تحت العنوان', 'A short description under the title'),
    button: tx('تسوّق الآن', 'Shop now'),
  }));
});
const current = ref(0);
const direction = ref('right');
const stageKey = ref(0); // a new key rebuilds the stage: it starts clean, with no classes left from an earlier animation
const transitionName = computed(() => bannerTransitionName(selected.value, direction.value));
let timer = null;
let pending = [];
const later = (fn, ms) => { const id = setTimeout(() => { pending = pending.filter((x) => x !== id); fn(); }, ms); pending.push(id); };
const clearPending = () => { pending.forEach(clearTimeout); pending = []; };
const stop = () => { clearInterval(timer); timer = null; clearPending(); };

// One change of slide. If the animation has not finished after a few seconds (a stalled transition), the stage is
// rebuilt on the slide that should be showing, so the preview can never stay blank.
const next = () => {
  direction.value = 'right';
  current.value = (current.value + 1) % slides.value.length;
  const shown = current.value;
  later(() => { if (current.value === shown) stageKey.value += 1; }, 4500);
};
const play = () => {
  stop();
  if (!open.value) return;
  timer = setInterval(() => { if (!document.hidden) next(); }, 4200);
};
const restart = () => {
  stop();
  stageKey.value += 1;
  current.value = 0;
  if (!open.value) return;
  later(() => { next(); play(); }, 600);
};

watch(selected, restart);
watch(open, async (isOpen) => {
  if (isOpen) { filter.value = 'all'; message.value = { text: '', error: false }; await nextTick(); restart(); } else { stop(); }
});

const load = async () => {
  try {
    const response = await settingsService.getAdminSettings();
    const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
    const row = list.find((entry) => entry.key === BANNER_ANIMATION_KEY);
    saved.value = selected.value = resolveBannerAnimation(row?.value);
  } catch {
    message.value = { text: tx('تعذر تحميل الحركة الحالية', 'Could not load the current animation'), error: true };
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!changed.value || saving.value || loading.value) return;
  saving.value = true;
  message.value = { text: '', error: false };
  try {
    await settingsService.bulkUpdate({ [BANNER_ANIMATION_KEY]: selected.value });
    saved.value = selected.value;
    message.value = { text: tx('تم الحفظ. الموقع هيعرض الحركة الجديدة خلال دقيقة تقريباً.', 'Saved. The website shows the new animation within about a minute.'), error: false };
  } catch {
    message.value = { text: tx('فشل الحفظ، حاول مرة أخرى', 'Could not save, try again'), error: true };
  } finally {
    saving.value = false;
  }
};

const close = () => { open.value = false; };
const onKey = (event) => { if (open.value && event.key === 'Escape') close(); };
// A problem inside the dialog must never blank the page behind it: it is caught here and shown as a message.
onErrorCaptured((error) => {
  console.error('Banner animation dialog:', error);
  message.value = { text: tx('تعذر عرض المعاينة. أغلق النافذة وافتحها من جديد.', 'The preview could not be shown. Close the dialog and open it again.'), error: true };
  stop();
  return false;
});

onMounted(() => { load(); window.addEventListener('keydown', onKey); });
onBeforeUnmount(() => { stop(); window.removeEventListener('keydown', onKey); });
</script>

<template>
  <section class="ba-card" data-testid="banner-animation">
    <div class="ba-head">
      <div>
        <h2>{{ tx('حركة البانرات', 'Banner animation') }}</h2>
        <p>
          {{ tx('الحركة الحالية:', 'Current animation:') }}
          <strong data-testid="banner-animation-current">{{ savedItem?.label[lang] }}</strong>
        </p>
      </div>
      <button type="button" class="ba-open" data-testid="banner-animation-open" @click="open = true">
        {{ tx('اختيار الحركة', 'Choose animation') }}
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="open" class="ba-overlay" data-testid="banner-animation-dialog" @click.self="close">
      <div class="ba-dialog" role="dialog" aria-modal="true" :aria-label="tx('حركة البانرات', 'Banner animation')">
        <div class="ba-dialog-head">
          <div>
            <h2>{{ tx('حركة البانرات', 'Banner animation') }}</h2>
            <p>{{ tx('اختار حركة وشوفها في المعاينة قبل ما تحفظ. نفس الحركة هتظهر في الموقع.', 'Pick an animation and watch it in the preview before you save. The website plays the same one.') }}</p>
          </div>
          <button type="button" class="ba-x" :aria-label="tx('إغلاق', 'Close')" data-testid="banner-animation-close" @click="close">×</button>
        </div>

        <div class="ba-dialog-body">
          <div class="ba-preview-wrap">
            <div class="bap-stage" data-testid="banner-animation-stage" dir="ltr">
              <transition-group :key="`${selected}-${stageKey}`" :name="transitionName" tag="div" class="hero-slides-wrapper" :class="`hero-anim-${selected}`">
                <div v-for="(slide, idx) in slides" v-show="current === idx" :key="slide.id" class="hero-slide-item">
                  <div class="hero-bg" :style="slide.bg"></div>
                  <div class="hero-overlay"></div>
                  <div class="hero-content">
                    <h3 class="hero-title">{{ slide.title }}</h3>
                    <p class="hero-desc">{{ slide.desc }}</p>
                    <div class="hero-actions"><span class="hero-btn">{{ slide.button }}</span></div>
                  </div>
                </div>
              </transition-group>
            </div>
            <div class="ba-preview-bar">
              <span><strong>{{ selectedItem?.label[lang] }}</strong> · {{ selectedItem?.hint[lang] }}<em v-if="changed"> — {{ tx('لم تُحفظ بعد', 'not saved yet') }}</em></span>
              <button type="button" class="ba-replay" data-testid="banner-animation-replay" @click="restart">↻ {{ tx('إعادة التشغيل', 'Replay') }}</button>
            </div>
          </div>

          <div class="ba-filters" role="tablist">
            <button type="button" :class="{ active: filter === 'all' }" @click="filter = 'all'">{{ tx('الكل', 'All') }} ({{ BANNER_ANIMATIONS.length }})</button>
            <button v-for="group in BANNER_ANIMATION_GROUPS" :key="group.id" type="button" :class="{ active: filter === group.id }" @click="filter = group.id">{{ group.label[lang] }}</button>
          </div>

          <div v-for="group in groups" :key="group.id" class="ba-group">
            <h4>{{ group.label[lang] }}</h4>
            <div class="ba-grid" role="radiogroup" :aria-label="group.label[lang]">
              <label v-for="entry in group.items" :key="entry.id" class="ba-option" :class="{ active: selected === entry.id }" :data-testid="`banner-animation-${entry.id}`">
                <input v-model="selected" type="radio" name="banner_animation" :value="entry.id" :disabled="loading" />
                <span class="ba-name">{{ entry.label[lang] }}<em v-if="saved === entry.id"> · {{ tx('الحالية', 'Current') }}</em></span>
                <small>{{ entry.hint[lang] }}</small>
              </label>
            </div>
          </div>
          <p class="ba-note">{{ tx('على الأجهزة الضعيفة بيتعرض تلاشي بدل الحركات الثقيلة (3D والضبابية)، وللي مفعّل «تقليل الحركة» بدون حركة.', 'On weak devices heavy animations (3D, blur) play as a fade, and with "reduce motion" there is no animation.') }}</p>
        </div>

        <div class="ba-dialog-foot">
          <p v-if="message.text" class="ba-msg" :class="{ error: message.error }" role="status">{{ message.text }}</p>
          <span class="ba-spacer"></span>
          <button type="button" class="ba-cancel" @click="close">{{ tx('إغلاق', 'Close') }}</button>
          <button type="button" class="ba-save" :disabled="!changed || saving || loading" data-testid="banner-animation-save" @click="save">
            {{ saving ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ الحركة', 'Save animation') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ba-card { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 16px; padding: 14px 20px; margin-bottom: 24px; }
.ba-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.ba-head h2 { margin: 0 0 4px; font-size: 1.05rem; }
.ba-head p { margin: 0; color: #6b7280; font-size: 0.85rem; }
.ba-head strong { color: var(--primary, #660033); }
.ba-open, .ba-save { border: 0; border-radius: 10px; padding: 9px 18px; font: inherit; font-weight: 700; cursor: pointer; color: #fff; background: var(--primary, #660033); }
.ba-save:disabled { opacity: 0.45; cursor: not-allowed; }
.ba-cancel { border: 1px solid #d1d5db; background: #fff; border-radius: 10px; padding: 9px 18px; font: inherit; cursor: pointer; }

.ba-overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(17, 24, 39, 0.55); display: flex; align-items: center; justify-content: center; padding: 16px; }
.ba-dialog { background: #fff; color: #111827; width: 100%; max-width: 980px; max-height: calc(100vh - 32px); border-radius: 18px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3); overflow: hidden; }
.ba-dialog-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.ba-dialog-head h2 { margin: 0 0 4px; font-size: 1.1rem; }
.ba-dialog-head p { margin: 0; color: #6b7280; font-size: 0.85rem; }
.ba-x { border: 0; background: #f3f4f6; width: 34px; height: 34px; border-radius: 50%; font-size: 1.3rem; line-height: 1; cursor: pointer; }
.ba-dialog-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.ba-dialog-foot { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-top: 1px solid #e5e7eb; background: #fafafa; }
.ba-spacer { flex: 1; }
.ba-preview-wrap { max-width: 760px; margin: 0 auto 16px; }
.ba-preview-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 8px; font-size: 0.82rem; color: #4b5563; flex-wrap: wrap; }
.ba-preview-bar em { font-style: normal; color: #b45309; }
.ba-replay { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 4px 12px; font: inherit; font-size: 0.8rem; cursor: pointer; }
.ba-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.ba-filters button { border: 1px solid #e5e7eb; background: #fff; border-radius: 999px; padding: 4px 12px; font: inherit; font-size: 0.8rem; cursor: pointer; }
.ba-filters button.active { background: var(--primary, #660033); color: #fff; border-color: var(--primary, #660033); }
.ba-group h4 { margin: 14px 0 8px; font-size: 0.85rem; color: #374151; }
.ba-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
.ba-option { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 12px; cursor: pointer; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
.ba-option input { position: absolute; opacity: 0; pointer-events: none; }
.ba-option:hover { border-color: #c9c4cf; }
.ba-option:focus-within { box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.18); }
.ba-option.active { border-color: var(--primary, #660033); background: rgba(102, 0, 51, 0.05); }
.ba-name { font-weight: 700; font-size: 0.88rem; }
.ba-name em { font-style: normal; font-weight: 500; color: var(--primary, #660033); font-size: 0.75rem; }
.ba-option small { color: #6b7280; font-size: 0.74rem; line-height: 1.4; }
.ba-note { margin: 14px 0 0; color: #6b7280; font-size: 0.78rem; }
.ba-msg { margin: 0; font-size: 0.85rem; color: #15803d; }
.ba-msg.error { color: #dc2626; }
@media (max-width: 640px) { .ba-dialog { max-height: 100vh; border-radius: 0; } .ba-overlay { padding: 0; } }
</style>
