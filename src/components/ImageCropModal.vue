<template>
  <Teleport to="body">
    <div v-if="open && source" class="crop-overlay" @keydown.esc.stop="cancel" tabindex="-1" ref="overlay">
      <div class="crop-panel" :dir="isAr ? 'rtl' : 'ltr'" role="dialog" aria-modal="true" @click.stop>
        <!-- Header -->
        <div class="crop-header">
          <div class="crop-header-title">
            <div class="crop-header-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2>{{ title || tx('قص وضبط مقاسات الصورة (Crop & Resize)', 'Crop & resize image') }}</h2>
              <p>{{ subtitle || tx('اختر النسبة الملائمة وموضع الصورة وتكبيرها للحصول على أفضل جودة عرض في التطبيق والموقع.', 'Choose the ratio, position and zoom for the best display quality in the app and website.') }}</p>
            </div>
          </div>
          <button type="button" class="crop-close" :disabled="isApplying" :aria-label="tx('إغلاق', 'Close')" @click="cancel">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="crop-body">
          <!-- 1. Aspect ratio presets -->
          <div>
            <label class="crop-label">{{ tx('اختر النسبة والمقاس المطلوب:', 'Choose the ratio and size:') }}</label>
            <div class="crop-presets">
              <button
                v-for="preset in presets"
                :key="preset.id"
                type="button"
                class="crop-preset"
                :class="{ selected: selectedRatio === preset.id }"
                @click="selectRatio(preset.id)"
              >
                <div class="crop-preset-top">
                  <span class="crop-preset-label">{{ isAr ? preset.labelAr : preset.labelEn }}</span>
                  <span v-if="selectedRatio === preset.id" class="crop-preset-dot" />
                </div>
                <span class="crop-preset-sub">{{ isAr ? preset.subLabelAr : preset.subLabelEn }}</span>
              </button>
            </div>
          </div>

          <!-- 2. Canvas workspace -->
          <div class="crop-workspace">
            <div class="crop-info-row">
              <span class="crop-hint">{{ tx('اسحب الصورة للتحريك • استخدم أزرار (+ / -) أو شريط التمرير للتحكم في التكبير', 'Drag to move • use (+ / -) or the slider to zoom') }}</span>
              <div class="crop-badges">
                <span class="crop-badge" dir="ltr">{{ tx('الأبعاد', 'Size') }}: {{ outputSize.width }} × {{ outputSize.height }} px</span>
                <span v-if="croppedSizeKb !== null" class="crop-badge success" dir="ltr">{{ tx('الحجم المتوقع', 'Expected size') }}: {{ croppedSizeKb }} KB</span>
              </div>
            </div>

            <div
              class="crop-stage"
              :class="{ dragging: isDragging }"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            >
              <canvas ref="canvas" class="crop-canvas" :class="{ transparent: isPng }" />

              <div class="crop-grid" aria-hidden="true">
                <div v-for="cell in 9" :key="cell" />
              </div>

              <div class="crop-live-badge">
                <span class="crop-live-dot" />
                <span>{{ tx('معاينة المقاس المباشر', 'Live preview') }} ({{ isAr ? currentPreset.labelAr : currentPreset.labelEn }})</span>
              </div>

              <div v-if="!isImageReady && !loadError" class="crop-loading">
                <svg class="crop-spin" width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".25" /><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              </div>
            </div>
          </div>

          <!-- 3. Controls -->
          <div class="crop-controls">
            <div class="crop-zoom">
              <span class="crop-zoom-label">{{ tx('التكبير', 'Zoom') }} ({{ Math.round(zoom * 100) }}%):</span>
              <button type="button" class="crop-step" @click="zoom = Math.max(MIN_ZOOM, Number((zoom - 0.1).toFixed(2)))">-</button>
              <input v-model.number="zoom" type="range" :min="MIN_ZOOM" :max="MAX_ZOOM" step="0.05" class="crop-range" />
              <button type="button" class="crop-step" @click="zoom = Math.min(MAX_ZOOM, Number((zoom + 0.1).toFixed(2)))">+</button>
            </div>

            <div class="crop-actions-row">
              <button type="button" class="crop-tool" @click="rotation = (rotation + 90) % 360">
                <svg class="accent" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span>{{ tx('تدوير 90°', 'Rotate 90°') }} ({{ rotation }}°)</span>
              </button>
              <button type="button" class="crop-tool muted" @click="resetTransform">
                <span>{{ tx('إعادة الضبط', 'Reset') }}</span>
              </button>
            </div>
          </div>

          <div v-if="loadError" class="crop-error">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{{ loadError }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="crop-footer">
          <button type="button" class="crop-cancel" :disabled="isApplying" @click="cancel">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="button" class="crop-apply" :disabled="!isImageReady || isApplying" @click="applyCrop">
            <template v-if="isApplying">
              <svg class="crop-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".25" /><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              <span>{{ tx('جاري قص الصورة وتطبيقها...', 'Cropping and applying...') }}</span>
            </template>
            <template v-else>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span>{{ tx('تطبيق وقص الصورة المحددة ✓', 'Apply crop ✓') }}</span>
            </template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import { CROP_ASPECT_PRESETS, loadCropImage } from '../utils/imageCrop';

const props = defineProps({
  open: { type: Boolean, default: false },
  // A File, or a URL (blob:, data: or a backend image URL).
  source: { type: [Object, String], default: null },
  fileName: { type: String, default: 'image.jpg' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  defaultRatio: { type: String, default: '1:1' },
  ratios: { type: Array, default: null },
  outputType: { type: String, default: 'image/jpeg' },
});

const emit = defineEmits(['close', 'cropped']);

const { locale, tx } = useAdminText();
const isAr = computed(() => locale.value !== 'en');

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3.5;
const JPEG_QUALITY = 0.9;
const BACKGROUND = '#0f172a';

const overlay = ref(null);
const canvas = ref(null);
const selectedRatio = ref(props.defaultRatio);
const zoom = ref(1);
const rotation = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const isDragging = ref(false);
const isApplying = ref(false);
const isImageReady = ref(false);
const loadError = ref(null);
const croppedSizeKb = ref(null);

let image = null;
let revokeImage = () => {};
let loadVersion = 0;
let dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
let frameId = 0;
let sizeTimer = 0;

const isPng = computed(() => props.outputType === 'image/png');
const presets = computed(() => (props.ratios?.length
  ? CROP_ASPECT_PRESETS.filter((preset) => props.ratios.includes(preset.id))
  : CROP_ASPECT_PRESETS));
const currentPreset = computed(() => presets.value.find((preset) => preset.id === selectedRatio.value)
  || presets.value.find((preset) => preset.id === props.defaultRatio)
  || presets.value[0]
  || CROP_ASPECT_PRESETS[0]);

// "Free" keeps the image's own proportions, capped at 1200 wide / 1000 tall.
const outputSize = computed(() => {
  const preset = currentPreset.value;
  if (preset.id !== 'free' || !isImageReady.value || !image) {
    return { width: preset.targetWidth, height: preset.targetHeight };
  }
  const sideways = rotation.value === 90 || rotation.value === 270;
  const ratio = sideways ? image.height / image.width : image.width / image.height;
  return ratio >= 1
    ? { width: 1200, height: Math.round(1200 / ratio) }
    : { width: Math.round(1000 * ratio), height: 1000 };
});

const render = () => {
  const el = canvas.value;
  const ctx = el?.getContext('2d');
  if (!ctx || !image) return;
  const { width, height } = outputSize.value;
  el.width = width;
  el.height = height;
  ctx.clearRect(0, 0, width, height);
  if (!isPng.value) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.translate(width / 2 + offsetX.value, height / 2 + offsetY.value);
  ctx.rotate((rotation.value * Math.PI) / 180);
  const sideways = rotation.value === 90 || rotation.value === 270;
  const effectiveWidth = sideways ? image.height : image.width;
  const effectiveHeight = sideways ? image.width : image.height;
  // Cover the output at 100% zoom.
  const scale = Math.max(width / effectiveWidth, height / effectiveHeight) * zoom.value;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  try {
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } catch {
    isImageReady.value = false;
    loadError.value = tx('تعذر رسم ومعالجة الصورة على الكانفاس.', 'The image could not be drawn on the canvas.');
  }
  ctx.restore();
};

const scheduleRender = () => {
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(render);
  clearTimeout(sizeTimer);
  sizeTimer = setTimeout(() => {
    try {
      canvas.value?.toBlob((blob) => {
        if (blob) croppedSizeKb.value = Math.round(blob.size / 1024);
      }, props.outputType, JPEG_QUALITY);
    } catch {
      // The size badge is informative only.
    }
  }, 120);
};

const resetTransform = () => {
  zoom.value = 1;
  rotation.value = 0;
  offsetX.value = 0;
  offsetY.value = 0;
};

const releaseImage = () => {
  revokeImage();
  revokeImage = () => {};
  image = null;
};

const loadSource = async () => {
  const version = ++loadVersion;
  releaseImage();
  isImageReady.value = false;
  isApplying.value = false;
  loadError.value = null;
  croppedSizeKb.value = null;
  if (!props.open || !props.source) return;

  selectedRatio.value = props.defaultRatio;
  resetTransform();
  await nextTick();
  overlay.value?.focus();
  try {
    const loaded = await loadCropImage(props.source);
    if (version !== loadVersion) {
      loaded.revoke();
      return;
    }
    image = loaded.image;
    revokeImage = loaded.revoke;
    isImageReady.value = true;
    await nextTick();
    scheduleRender();
  } catch {
    if (version !== loadVersion) return;
    loadError.value = tx(
      'تعذر تحميل الصورة للقص والمعالجة. يرجى اختيار صورة صالحة من جهازك أو التحقق من الرابط.',
      'The image could not be loaded for cropping. Choose a valid image from your device or check the link.',
    );
  }
};

watch(() => [props.open, props.source], loadSource, { immediate: true });
watch([zoom, rotation, offsetX, offsetY, selectedRatio], () => {
  if (isImageReady.value) scheduleRender();
});

const selectRatio = (id) => {
  selectedRatio.value = id;
  offsetX.value = 0;
  offsetY.value = 0;
};

// Pointer drag pans the image. Offsets are in output pixels, so screen
// movement is scaled by how much the canvas is shrunk to fit the stage.
const displayScale = () => {
  const el = canvas.value;
  if (!el || !el.clientWidth) return 1;
  return el.width / el.clientWidth;
};

const onPointerDown = (event) => {
  if (!isImageReady.value) return;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  isDragging.value = true;
  dragStart = { x: event.clientX, y: event.clientY, offsetX: offsetX.value, offsetY: offsetY.value, scale: displayScale() };
};

const onPointerMove = (event) => {
  if (!isDragging.value) return;
  offsetX.value = dragStart.offsetX + (event.clientX - dragStart.x) * dragStart.scale;
  offsetY.value = dragStart.offsetY + (event.clientY - dragStart.y) * dragStart.scale;
};

const onPointerUp = (event) => {
  if (!isDragging.value) return;
  try {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  } catch {
    // Pointer already released.
  }
  isDragging.value = false;
};

const cancel = () => {
  if (isApplying.value) return;
  emit('close');
};

const applyCrop = () => {
  const el = canvas.value;
  if (!el || !image || isApplying.value) return;
  isApplying.value = true;
  const version = loadVersion;
  render();
  try {
    el.toBlob((blob) => {
      if (version !== loadVersion) return;
      isApplying.value = false;
      if (!blob) {
        loadError.value = tx('فشل استخراج ملف الصورة المقصوصة.', 'The cropped image could not be created.');
        return;
      }
      const extension = props.outputType === 'image/png' ? 'png' : 'jpg';
      const baseName = String(props.fileName || 'image').replace(/\.[^/.]+$/, '').replace(/[^\w؀-ۿ-]+/g, '_') || 'image';
      const file = new File([blob], `${baseName}_cropped_${Date.now()}.${extension}`, {
        type: props.outputType,
        lastModified: Date.now(),
      });
      emit('cropped', file, URL.createObjectURL(blob));
    }, props.outputType, JPEG_QUALITY);
  } catch {
    isApplying.value = false;
    loadError.value = tx(
      'تعذر إكمال عملية القص لهذا الرابط. يرجى التأكد من صلاحية الرابط أو رفع الصورة محلياً.',
      'Cropping failed for this link. Check the link or upload the image from your device.',
    );
  }
};

onBeforeUnmount(() => {
  loadVersion += 1;
  cancelAnimationFrame(frameId);
  clearTimeout(sizeTimer);
  releaseImage();
});
</script>

<style scoped>
/* Mirrors the Zalameh dashboard crop modal; the accent follows the Mastergas brand. */
.crop-overlay {
  --crop-accent: #660033;
  --crop-accent-hover: #4d0026;
  --crop-accent-soft: rgba(102, 0, 51, 0.05);
  --crop-accent-ring: rgba(102, 0, 51, 0.2);
  --crop-accent-shadow: rgba(102, 0, 51, 0.25);
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  animation: crop-fade-in 0.2s ease-out;
  outline: none;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}
@keyframes crop-fade-in { from { opacity: 0; } to { opacity: 1; } }

.crop-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 56rem;
  max-height: 92vh;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.crop-header, .crop-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(248, 250, 252, 0.8);
}
.crop-header { border-bottom: 1px solid #f1f5f9; }
.crop-footer { border-top: 1px solid #f1f5f9; }
.crop-header-title { display: flex; align-items: center; gap: 0.75rem; }
.crop-header-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  color: #fff;
  background: linear-gradient(to top right, var(--crop-accent), #f59e0b);
  box-shadow: 0 4px 6px -1px var(--crop-accent-ring), 0 2px 4px -2px var(--crop-accent-ring);
}
.crop-header h2 { margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 800; color: #0f172a; }
.crop-header p { margin: 0; font-size: 0.75rem; line-height: 1rem; color: #64748b; }
.crop-close {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}
.crop-close:hover { color: #334155; background: rgba(226, 232, 240, 0.6); }

.crop-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.crop-label { display: block; margin-bottom: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #334155; text-align: start; }

.crop-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.625rem; }
@media (min-width: 640px) { .crop-presets { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (min-width: 768px) { .crop-presets { grid-template-columns: repeat(7, minmax(0, 1fr)); } }
.crop-preset {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.75rem;
  text-align: start;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.crop-preset:hover { border-color: #cbd5e1; background: rgba(248, 250, 252, 0.6); }
.crop-preset.selected {
  border-color: var(--crop-accent);
  background: var(--crop-accent-soft);
  box-shadow: 0 0 0 2px var(--crop-accent-ring), 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.crop-preset-top { display: flex; align-items: center; justify-content: space-between; gap: 0.25rem; margin-bottom: 0.25rem; }
.crop-preset-label { font-size: 0.75rem; font-weight: 800; color: #1e293b; }
.crop-preset.selected .crop-preset-label { color: var(--crop-accent); }
.crop-preset-dot { flex-shrink: 0; width: 0.5rem; height: 0.5rem; border-radius: 999px; background: var(--crop-accent); }
.crop-preset-sub { font-size: 10px; line-height: 1.25; color: #94a3b8; }

.crop-workspace { display: flex; flex-direction: column; gap: 0.5rem; }
.crop-info-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; padding: 0 0.25rem; font-size: 0.75rem; color: #64748b; }
.crop-hint { font-weight: 600; }
.crop-badges { display: flex; align-items: center; gap: 0.5rem; }
.crop-badge { padding: 0.125rem 0.5rem; border-radius: 0.5rem; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; }
.crop-badge.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }

.crop-stage {
  position: relative;
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 1rem;
  user-select: none;
  touch-action: none;
  cursor: grab;
}
@media (min-width: 640px) { .crop-stage { height: 370px; } }
.crop-stage.dragging { cursor: grabbing; }
.crop-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px #000;
  pointer-events: none;
}
/* Transparent PNG output shows a checkerboard behind it. */
.crop-canvas.transparent {
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
.crop-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  opacity: 0.2;
  border: 1px solid rgba(255, 255, 255, 0.3);
  pointer-events: none;
}
.crop-grid > div { border-right: 1px solid rgba(255, 255, 255, 0.3); border-bottom: 1px solid rgba(255, 255, 255, 0.3); }
.crop-grid > div:nth-child(3n) { border-right: none; }
.crop-grid > div:nth-child(n + 7) { border-bottom: none; }
.crop-live-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
}
.crop-live-dot { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: #34d399; animation: crop-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes crop-pulse { 50% { opacity: 0.5; } }
.crop-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #cbd5e1; pointer-events: none; }

.crop-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1rem;
}
@media (min-width: 640px) { .crop-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.crop-zoom { display: flex; align-items: center; gap: 0.75rem; }
.crop-zoom-label { white-space: nowrap; font-size: 0.75rem; font-weight: 700; color: #334155; }
.crop-step {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}
.crop-step:hover { background: #f1f5f9; }
.crop-range { flex: 1; min-width: 0; accent-color: var(--crop-accent); cursor: pointer; }
.crop-actions-row { display: flex; align-items: center; justify-content: flex-end; gap: 0.625rem; }
.crop-tool {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  color: #334155;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.15s;
}
.crop-tool.muted { color: #475569; }
.crop-tool:hover { border-color: #cbd5e1; background: #f1f5f9; }
.crop-tool .accent { color: var(--crop-accent); }

.crop-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid #fecdd3;
  border-radius: 1rem;
  background: #fff1f2;
  color: #be123c;
  font-size: 0.75rem;
  font-weight: 700;
}
.crop-error svg { flex-shrink: 0; color: #f43f5e; }

.crop-cancel {
  padding: 0.625rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: transparent;
  color: #475569;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.crop-cancel:hover { background: rgba(226, 232, 240, 0.7); }
.crop-apply {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--crop-accent);
  color: #fff;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px var(--crop-accent-shadow), 0 4px 6px -4px var(--crop-accent-shadow);
  transition: all 0.15s;
}
.crop-apply:hover { background: var(--crop-accent-hover); }
.crop-cancel:disabled, .crop-apply:disabled, .crop-close:disabled { opacity: 0.5; cursor: not-allowed; }
.crop-spin { animation: crop-spin 1s linear infinite; }
@keyframes crop-spin { to { transform: rotate(360deg); } }
</style>
