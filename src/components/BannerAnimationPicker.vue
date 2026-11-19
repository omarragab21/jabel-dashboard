<script setup>
// Choose how the homepage banners change on the website. Every option has a looping preview; the choice is saved in the
// site setting `banner_animation` and the website plays it.
import { computed, onMounted, ref } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import settingsService from '../services/settingsService';
import { BANNER_ANIMATIONS, BANNER_ANIMATION_KEY, resolveBannerAnimation } from '../domain/bannerAnimation';

const { tx, locale } = useAdminText();
const lang = computed(() => (locale.value === 'en' ? 1 : 0));

const saved = ref('cinematic');
const selected = ref('cinematic');
const loading = ref(true);
const saving = ref(false);
const message = ref({ text: '', error: false });
const changed = computed(() => selected.value !== saved.value);

const load = async () => {
  try {
    const response = await settingsService.getAdminSettings();
    const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
    const row = list.find((item) => item.key === BANNER_ANIMATION_KEY);
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

onMounted(load);
</script>

<template>
  <section class="ba-card" data-testid="banner-animation">
    <div class="ba-head">
      <div>
        <h2>{{ tx('حركة البانرات', 'Banner animation') }}</h2>
        <p>{{ tx('اختار الحركة اللي تتغير بيها البانرات في الصفحة الرئيسية للموقع.', 'Pick how the banners change on the website homepage.') }}</p>
      </div>
      <button type="button" class="ba-save" :disabled="!changed || saving || loading" data-testid="banner-animation-save" @click="save">
        {{ saving ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ الحركة', 'Save animation') }}
      </button>
    </div>

    <div class="ba-grid" role="radiogroup" :aria-label="tx('حركة البانرات', 'Banner animation')">
      <label v-for="item in BANNER_ANIMATIONS" :key="item.id" class="ba-option" :class="{ active: selected === item.id }" :data-testid="`banner-animation-${item.id}`">
        <input v-model="selected" type="radio" name="banner_animation" :value="item.id" :disabled="loading" />
        <span class="ba-preview" :class="`pv-${item.id}`" aria-hidden="true">
          <i class="a">1</i><i class="b">2</i>
        </span>
        <span class="ba-name">{{ item.label[lang] }}<em v-if="saved === item.id"> · {{ tx('الحالية', 'Current') }}</em></span>
        <small>{{ item.hint[lang] }}</small>
      </label>
    </div>
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
.ba-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.ba-option { display: flex; flex-direction: column; gap: 6px; padding: 10px; border: 1.5px solid #e5e7eb; border-radius: 14px; cursor: pointer; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
.ba-option input { position: absolute; opacity: 0; pointer-events: none; }
.ba-option:hover { border-color: #c9c4cf; }
.ba-option:focus-within { box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.18); }
.ba-option.active { border-color: var(--primary, #660033); background: rgba(102, 0, 51, 0.05); }
.ba-name { font-weight: 700; font-size: 0.88rem; }
.ba-name em { font-style: normal; font-weight: 500; color: var(--primary, #660033); font-size: 0.75rem; }
.ba-option small { color: #6b7280; font-size: 0.74rem; line-height: 1.4; }
.ba-msg { margin: 12px 0 0; font-size: 0.85rem; color: #15803d; }
.ba-msg.error { color: #dc2626; }

/* Looping preview: slide 1 leaves while slide 2 comes in, then back. */
.ba-preview { position: relative; display: block; height: 62px; border-radius: 9px; overflow: hidden; background: #111; perspective: 400px; }
.ba-preview i { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-style: normal; font-weight: 800; color: #fff; font-size: 1.1rem; }
.ba-preview .a { background: #660033; animation: pv-a 2.6s ease-in-out infinite alternate; }
.ba-preview .b { background: #b8860b; animation: pv-b 2.6s ease-in-out infinite alternate; }
@keyframes pv-a { from { transform: none; opacity: 1; filter: none; } 15% { transform: none; opacity: 1; filter: none; } to { transform: var(--at, none); opacity: var(--ao, 1); filter: var(--af, none); } }
@keyframes pv-b { from { transform: var(--bt, none); opacity: var(--bo, 1); filter: var(--bf, none); clip-path: var(--bc, inset(0)); } 15% { transform: var(--bt, none); opacity: var(--bo, 1); filter: var(--bf, none); clip-path: var(--bc, inset(0)); } to { transform: none; opacity: 1; filter: none; clip-path: inset(0); } }
.pv-cinematic { --bc: inset(0 0 0 100%); --at: translateX(-24%) scale(0.9); --af: brightness(0.3); }
.pv-fade { --bo: 0; --ao: 0; }
.pv-slide { --bt: translateX(100%); --at: translateX(-100%); }
.pv-vertical { --bt: translateY(100%); --at: translateY(-100%); }
.pv-zoom { --bt: scale(1.4); --bo: 0; --at: scale(0.8); --ao: 0; }
.pv-flip { --bt: rotateY(-85deg); --bo: 0; --at: rotateY(85deg); --ao: 0; }
.pv-blur { --bo: 0; --bf: blur(10px); --ao: 0; --af: blur(10px); }
.pv-kenburns { --bo: 0; --bt: scale(1.25); --ao: 0; }
.pv-none .a, .pv-none .b { animation-timing-function: steps(1, end); }
.pv-none { --bo: 0; --ao: 0; }
@media (prefers-reduced-motion: reduce) { .ba-preview i { animation: none !important; } .ba-preview .b { display: none; } }
</style>
