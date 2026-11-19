import { apiErrorMessage } from './apiMessage.js';

// What the admin reads when a drag-and-drop reorder could not be saved. The rows have already slid back by then.
export const reorderFailureMessage = (error) => {
  if (error?.code === 'ORDER_NOT_PERSISTED') {
    return 'الـ API لم يحفظ الترتيب الجديد (حقل sort_order غير مدعوم). تمت إعادة الصفوف إلى أماكنها.';
  }
  const detail = apiErrorMessage(error, '');
  return `حدثت مشكلة في الـ API ولم يُحفظ الترتيب${detail ? ` (${detail})` : ''}. تمت إعادة الصفوف إلى أماكنها.`;
};
