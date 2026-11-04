import { reactive } from 'vue';
import { validateAdminImageFile } from '../utils/adminSecurity';
import { cropOutputType, isCroppableFile } from '../utils/imageCrop';

/**
 * Wires components/ImageCropModal.vue into a form.
 *
 *   const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();
 *   <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
 *
 * prepareImage(file, options) validates a picked file (type only, any size),
 * opens the crop and resolves { file } (the cropped copy, or the original if
 * the crop was cancelled) or { error }.
 */
export function useImageCrop() {
  const cropModal = reactive({
    open: false,
    source: null,
    fileName: 'image.jpg',
    title: '',
    subtitle: '',
    defaultRatio: '1:1',
    ratios: null,
    outputType: 'image/jpeg',
  });
  let settle = null;

  const finish = (result) => {
    cropModal.open = false;
    cropModal.source = null;
    const resolve = settle;
    settle = null;
    resolve?.(result);
  };

  // Resolves the cropped File, or null when the crop is cancelled.
  const requestCrop = (source, options = {}) => {
    if (settle) finish(null);
    Object.assign(cropModal, {
      source,
      fileName: options.fileName || (typeof source === 'object' && source?.name) || 'image.jpg',
      title: options.title || '',
      subtitle: options.subtitle || '',
      defaultRatio: options.defaultRatio || '1:1',
      ratios: options.ratios || null,
      outputType: options.outputType || (typeof source === 'object' ? cropOutputType(source) : 'image/jpeg'),
      open: true,
    });
    return new Promise((resolve) => { settle = resolve; });
  };

  const closeCrop = () => finish(null);
  const finishCrop = (file, previewUrl) => {
    // Callers build their own previews from the File.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    finish(file);
  };

  const prepareImage = async (file, { allowIco = false, ...cropOptions } = {}) => {
    const typeCheck = validateAdminImageFile(file, { allowIco });
    if (!typeCheck.valid) return { error: typeCheck.error };
    if (!isCroppableFile(file)) return { file };

    const cropped = await requestCrop(file, cropOptions);
    const result = cropped || file;
    const check = validateAdminImageFile(result, { allowIco });
    return check.valid ? { file: result } : { error: check.error };
  };

  // Re-crops an image already in the form (a File or a backend URL).
  // Resolves { file }, { error } or {} when cancelled.
  const recropImage = async (source, cropOptions = {}) => {
    if (!source) return {};
    const cropped = await requestCrop(source, cropOptions);
    if (!cropped) return {};
    const check = validateAdminImageFile(cropped);
    return check.valid ? { file: cropped } : { error: check.error };
  };

  return { cropModal, closeCrop, finishCrop, prepareImage, recropImage };
}
