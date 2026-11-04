// Helpers for the image crop modal (components/ImageCropModal.vue).
//
// The crop runs on a <canvas>. A canvas that draws a cross-origin image without
// CORS headers is "tainted" and cannot be exported, and the backend storage does
// not send CORS headers. Backend images are therefore loaded through the
// dashboard's own origin (/public/storage and /storage are proxied by Vite in
// development and rewritten by vercel.json in production).

export const CROP_ASPECT_PRESETS = Object.freeze([
  { id: '1:1', labelAr: 'مربع (1:1)', labelEn: 'Square (1:1)', subLabelAr: 'مناسب للشعار واللوجو والمنتجات', subLabelEn: 'For logos and products', ratio: 1, targetWidth: 800, targetHeight: 800 },
  { id: '2:3', labelAr: 'بطاقة طولية (2:3)', labelEn: 'Portrait card (2:3)', subLabelAr: 'مناسب لبطاقات الأقسام والعروض في الصفحة الرئيسية', subLabelEn: 'For category and offer cards on the home page', ratio: 2 / 3, targetWidth: 840, targetHeight: 1260 },
  { id: '16:9', labelAr: 'عرضي قياسي (16:9)', labelEn: 'Widescreen (16:9)', subLabelAr: 'مناسب لصفحات العروض والبانرات', subLabelEn: 'For offers and banners', ratio: 16 / 9, targetWidth: 1200, targetHeight: 675 },
  { id: '9:16', labelAr: 'طولي / ستوري (9:16)', labelEn: 'Story (9:16)', subLabelAr: 'مناسب لقصص الجوال والشاشات الرأسية', subLabelEn: 'For mobile stories and vertical screens', ratio: 9 / 16, targetWidth: 720, targetHeight: 1280 },
  { id: '4:3', labelAr: 'أفقي كلاسيكي (4:3)', labelEn: 'Classic (4:3)', subLabelAr: 'مناسب لبطاقات القوائم والصور', subLabelEn: 'For cards and photos', ratio: 4 / 3, targetWidth: 960, targetHeight: 720 },
  { id: '2:1', labelAr: 'بانر عريض (2:1)', labelEn: 'Wide banner (2:1)', subLabelAr: 'مناسب للبانر الرئيسي والمتحرك', subLabelEn: 'For the main and hero sliders', ratio: 2, targetWidth: 1200, targetHeight: 600 },
  { id: 'free', labelAr: 'أبعاد حُرة', labelEn: 'Free', subLabelAr: 'الحفاظ على أبعاد الصورة الأصلية', subLabelEn: 'Keep the original proportions', ratio: null, targetWidth: 1200, targetHeight: 800 },
]);

// Absolute or relative backend storage URL -> captures the /…storage/… path.
const BACKEND_STORAGE_URL = /^(?:https?:\/\/backend-jabal\.be-kite\.com)?(\/(?:public\/)?storage\/.+)$/i;

// Animated GIFs would lose their animation and .ico favicons their sizes, so
// they are uploaded as they are instead of going through the crop.
const NON_CROPPABLE_TYPES = new Set(['image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']);

export const isCroppableFile = (file) => Boolean(file && typeof file === 'object' && !NON_CROPPABLE_TYPES.has(String(file.type || '').toLowerCase()));

// PNG and WEBP may be transparent (logos), so they stay PNG. Photos become JPEG.
export const cropOutputType = (file) => (
  /^image\/(png|webp)$/i.test(String(file?.type || '')) ? 'image/png' : 'image/jpeg'
);

/** Rewrites a backend storage URL to the same-origin proxy path. */
export const toSameOriginImageUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  const storagePath = value.match(BACKEND_STORAGE_URL);
  return storagePath ? storagePath[1] : value;
};

const loadImageElement = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('image failed to load'));
  image.src = src;
});

/**
 * Loads a File, blob:/data: URL or backend URL as an image the canvas can export.
 * Resolves { image, revoke } where revoke() frees any object URL it created.
 */
export const loadCropImage = async (source) => {
  if (!source) throw new Error('No image source provided');

  if (typeof source === 'object') {
    const objectUrl = URL.createObjectURL(source);
    try {
      return { image: await loadImageElement(objectUrl), revoke: () => URL.revokeObjectURL(objectUrl) };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }

  const url = toSameOriginImageUrl(source);
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return { image: await loadImageElement(url), revoke: () => {} };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (!blob.size || !String(blob.type).startsWith('image/')) throw new Error('not an image');
    const objectUrl = URL.createObjectURL(blob);
    try {
      return { image: await loadImageElement(objectUrl), revoke: () => URL.revokeObjectURL(objectUrl) };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }
};
