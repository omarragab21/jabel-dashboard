// Shared behaviour of the Cities / Areas / Branches screens: toast, confirm, server errors and the
// optimistic status switch (PATCH .../toggle-status), so the three pages act the same way.
import { reactive, ref } from 'vue';
import { useAdminText } from './useAdminText';
import { useDialog } from './useDialog';
import { apiErrorMessage } from '../utils/apiMessage';

/** Laravel 422 `errors` as { field: 'first message' }, each message in the same words the toasts use. */
export const serverFieldErrors = (error) => {
  const errors = error?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => {
    const raw = Array.isArray(messages) ? String(messages[0] || '') : String(messages || '');
    return [field, apiErrorMessage({ response: { data: { message: raw } } }, raw)];
  }));
};

export function useLocationPage() {
  const { tx, locale } = useAdminText();
  const dialog = useDialog();
  const toast = reactive({ show: false, message: '', type: 'success' });
  let toastTimer = null;
  const pendingIds = ref(new Set());

  const notify = (message, type = 'success') => {
    toast.message = message;
    toast.type = type;
    toast.show = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.show = false; }, 3200);
  };

  const errorText = (error, fallback) => apiErrorMessage(error, fallback || tx('حدث خطأ غير متوقع. حاول مرة أخرى.', 'Something went wrong. Please try again.'));

  const isPending = (id) => pendingIds.value.has(id);
  const setPending = (id, on) => {
    const next = new Set(pendingIds.value);
    if (on) next.add(id); else next.delete(id);
    pendingIds.value = next;
  };

  /**
   * Flips row.is_active on screen at once, then asks the server; the server's answer wins, and a failure puts
   * the old value back. `call(id, previous)` resolves to the new is_active.
   */
  const toggleRow = async (row, call, { onDone } = {}) => {
    if (!row || isPending(row.id)) return;
    const previous = row.is_active;
    row.is_active = !previous;
    setPending(row.id, true);
    try {
      row.is_active = await call(row.id, previous);
      notify(row.is_active ? tx('تم التفعيل', 'Activated') : tx('تم الإيقاف', 'Deactivated'));
      if (onDone) onDone(row);
    } catch (error) {
      row.is_active = previous;
      notify(errorText(error, tx('تعذر تغيير الحالة', 'Could not change the status')), 'error');
    } finally {
      setPending(row.id, false);
    }
  };

  const confirmDelete = (message, title) => dialog.confirm(message, {
    type: 'error',
    title: title || tx('تأكيد الحذف', 'Confirm delete'),
    confirmText: tx('حذف', 'Delete'),
    cancelText: tx('إلغاء', 'Cancel'),
  });

  // Client-side reasons (domain/locations validate*) as text; name fields say which language is missing.
  const FIELD_NAMES = {
    name_ar: () => tx('الاسم بالعربي', 'The Arabic name'),
    name_en: () => tx('الاسم بالإنجليزي', 'The English name'),
    city_id: () => tx('المدينة', 'The city'),
    area_id: () => tx('المنطقة', 'The area'),
    lat: () => tx('خط العرض', 'The latitude'),
    lang: () => tx('خط الطول', 'The longitude'),
  };
  const reasonText = (field, reason) => {
    const name = FIELD_NAMES[field]?.() || '';
    switch (reason) {
      case 'required': {
        if (!name) return tx('هذا الحقل مطلوب', 'This field is required');
        // Arabic gender: المدينة / المنطقة are feminine.
        const feminine = field === 'city_id' || field === 'area_id';
        return tx(`${name} ${feminine ? 'مطلوبة' : 'مطلوب'}`, `${name} is required`);
      }
      case 'too_long': return tx('النص أطول من 255 حرفًا', 'Longer than 255 characters');
      case 'arabic_in_english': return tx('اكتب هذا الحقل بالإنجليزية فقط (بدون حروف عربية)', 'Use English letters only');
      case 'invalid': return tx('اكتب رقمًا صحيحًا مثل 24.7136', 'Enter a number such as 24.7136');
      case 'out_of_range': return field === 'lat' ? tx('خط العرض بين −90 و 90', 'Latitude is between −90 and 90') : tx('خط الطول بين −180 و 180', 'Longitude is between −180 and 180');
      case 'mismatch': return tx('المنطقة لا تتبع المدينة المختارة', 'This area is not in the chosen city');
      default: return reason || '';
    }
  };
  /** The message under a field: the server's 422 message first, then the form's own check. */
  const fieldMessage = (field, clientErrors, serverErrors) => serverErrors?.[field] || (clientErrors?.[field] ? reasonText(field, clientErrors[field]) : '');

  return { tx, locale, toast, notify, errorText, isPending, toggleRow, confirmDelete, dialog, fieldMessage };
}
