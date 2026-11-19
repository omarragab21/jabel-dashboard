<script setup>
// Choose how the homepage banners change on the website. Picking an option plays it in the preview stage (a small copy of
// the website hero using the website's own CSS) so it can be seen BEFORE saving; "Save animation" stores it in the site
// setting `banner_animation` and the website plays it.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import settingsService from '../services/settingsService';
import { BANNER_ANIMATION_GROUPS, BANNER_ANIMATIONS, BANNER_ANIMATION_KEY, bannerTransitionName, resolveBannerAnimation } from '../domain/bannerAnimation';
import '../assets/bannerAnimations.css';

// Real banner photos (from the table below) make the preview truthful; without any, three coloured slides are used.
const props = defineProps({ images: { type: Array, default: () => [] } });

const { tx, locale } = useAdminText();
const lang = computed(() => (locale.value === 'en' ? 1 : 0));

const saved = ref('cinematic');
const selected = ref('cinematic');
const loading = ref(true);
const saving = ref(false);
const message = ref({ text: '', error: false });
const changed = computed(() => selected.value !== saved.value);
const selectedItem = computed(() => BANNER_ANIMATIONS.find((entry) => entry.id === selected.value));
const filter = ref('all');
const groups = computed(() => (filter.value === 'all' ? BANNER_ANIMATION_GROUPS : BANNER_ANIMATION_GROUPS.filter((group) => group.id === filter.value)));

// ── preview stage ──
const FALLBACK_BG = ['linear-gradient(120deg,#660033,#b83280)', 'linear-gradient(120deg,#0f4c5c,#2a9d8f)', 'linear-gradient(120deg,#5f0f40,#fb8b24)'];
const slides = computed(() => {
  const photos = props.images.filter(Boolean).slice(0, 3);
  const count = Math.max(2, photos.length);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    bg: photos[i] ? { backgroundImage: `url(${photos[i]})` } : { backgroundImage: FALLBACK_BG[i % FALLBACK_BG.length] },
    title: tx(`عنوان البانر ${i + 1}`, `Banner title ${i + 1}`),
    desc: tx('وصف قصير يظهر تحت العنوان', 'A short description under the title'),
    button: tx('تسوّق الآن', 'Shop now'),
  }));
});
const current = ref(0);
const direction = ref('right');
const transitionName = computed(() => bannerTransitionName(selected.value, direction.value));
let timer = null;
const next = () => { direction.value = 'right'; current.value = (current.value + 1) % slides.value.length; };
const stop = () => { clearInterval(timer); timer = null; };
const play = () => { stop(); timer = setInterval(() => { if (!document.hidden) next(); }, 3800); };
const replay = () => { current.value = 0; setTimeout(() => { next(); play(); }, 250); };

// Picking another animation restarts the preview from the first slide and shows the first change right away.
watch(selected, () => { stop(); current.value = 0; setTimeout(() => { next(); play(); }, 500); });

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

onMounted(() => { load(); play(); });
onBeforeUnmount(stop);
</script>

<template>
  <section class="ba-card" data-testid="banner-animation">
    <div class="ba-head">
      <div>
        <h2>{{ tx('حركة البانرات', 'Banner animation') }}</h2>
        <p>{{ tx('اختار حركة وشوفها في المعاينة تحت قبل ما تحفظ. نفس الحركة هتظهر في الموقع.', 'Pick an animation and watch it in the preview before you save. The website plays the same one.') }}</p>
      </div>
      <button type="button" class="ba-save" :disabled="!changed || saving || loading" data-testid="banner-animation-save" @click="save">
        {{ saving ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ الحركة', 'Save animation') }}
      </button>
    </div>

    <!-- Preview: the website hero in small -->
    <div class="ba-preview-wrap">
      <div class="bap-stage" data-testid="banner-animation-stage" dir="ltr">
        <transition-group :key="selected" :name="transitionName" tag="div" class="hero-slides-wrapper" :class="`hero-anim-${selected}`">
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
        <button type="button" class="ba-replay" data-testid="banner-animation-replay" @click="replay">↻ {{ tx('إعادة التشغيل', 'Replay') }}</button>
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
    <p v-if="message.text" class="ba-msg" :class="{ error: message.error }" role="status">{{ message.text }}</p>
  </section>
</template>

<style scoped>
.ba-card { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; }
.ba-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.ba-head h2 { margin: 0 0 4px; font-size: 1.05rem; }
.ba-head p { margin: 0; color: #6b7280; font-size: 0.85rem; }
.ba-save { border: 0; border-radius: 10px; padding: 9px 18px; font: inherit; font-weight: 700; cursor: pointer; color: #fff; background: var(--primary, #660033); }
.ba-save:disabled { opacity: 0.45; cursor: not-allowed; }
.ba-preview-wrap { max-width: 760px; margin-bottom: 16px; }
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
.ba-msg { margin: 10px 0 0; font-size: 0.85rem; color: #15803d; }
.ba-msg.error { color: #dc2626; }
</style>
