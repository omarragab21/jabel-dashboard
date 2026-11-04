// One place that turns an API failure into the Arabic message shown in toasts and dialogs.
// Backend messages that already contain Arabic are shown as they are. Known English (Laravel)
// messages are translated by the table below; anything technical (SQL / PHP / stack text)
// is replaced by a plain Arabic sentence so the screen never shows it.
const ARABIC = /[؀-ۿ]/;
const LINKED = /foreign key|constraint|integrity|referenc|still (has|have|contain)|has (related )?(products|items)|in use|associated|products\(\)/i;
const TECHNICAL = /SQLSTATE|Call to|undefined|Trying to|Class "|Illuminate\\|vendor\/|Stack trace|Integrity|Exception|Server Error|syntax error|Column not found/i;

// [pattern, Arabic text]. Order matters: the first match wins.
const KNOWN = [
  [/unauthenticated|token (is )?(invalid|expired)|session expired/i, 'انتهت الجلسة. سجّل الدخول مرة أخرى.'],
  [/invalid credentials|credentials (do not|don't) match|these credentials|incorrect (email|password)|wrong password/i, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
  [/this action is unauthorized|unauthorized|forbidden|do(es)? not have (the right )?permission|not allowed/i, 'ليست لديك صلاحية لتنفيذ هذا الإجراء.'],
  [/too many (login )?attempts|too many requests|throttle/i, 'تم إرسال طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.'],
  [/(no query results|not found)/i, 'العنصر المطلوب لم يعد موجودًا. حدّث الصفحة وحاول مرة أخرى.'],
  [/email.*(already been taken|already exists|is taken)/i, 'البريد الإلكتروني مستخدم من قبل.'],
  [/phone.*(already been taken|already exists|is taken)/i, 'رقم الهاتف مستخدم من قبل.'],
  [/(slug|code|name|sku|barcode).*(already been taken|already exists|is taken)/i, 'هذه القيمة مستخدمة من قبل، اختر قيمة أخرى.'],
  [/already been taken|already exists|duplicate/i, 'هذه القيمة مستخدمة من قبل، اختر قيمة أخرى.'],
  [/(is|are) required|field is required|must not be empty|can't be blank/i, 'يرجى تعبئة جميع الحقول المطلوبة.'],
  [/must be a valid email|valid email/i, 'يرجى إدخال بريد إلكتروني صحيح.'],
  [/password.*(at least|min)|password confirmation|passwords? (do not|don't) match/i, 'كلمة المرور قصيرة أو غير متطابقة مع التأكيد.'],
  [/must be (at least|greater|less|between)|may not be greater|must not be greater|too (long|short)/i, 'إحدى القيم المدخلة خارج الحد المسموح به.'],
  [/must be an? (image|file)|mimes|mime type|invalid image|image.*(invalid|failed)/i, 'ملف الصورة غير مدعوم. استخدم صورة بصيغة JPG أو PNG أو WEBP.'],
  [/failed to upload|upload.*(fail|error)|may not be greater than \d+ kilobytes/i, 'تعذر رفع الملف. تأكد من نوعه وحجمه وحاول مرة أخرى.'],
  [/insufficient stock|out of stock|not enough stock|quantity.*(exceed|available)/i, 'الكمية المطلوبة غير متوفرة في المخزون.'],
  [/coupon|discount code|promo/i, 'كود الخصم غير صالح أو منتهي.'],
  [/invalid|selected .* is invalid/i, 'إحدى القيم المدخلة غير صحيحة.'],
  [/validation|given data was invalid|unprocessable/i, 'البيانات المدخلة غير صحيحة. راجع الحقول وحاول مرة أخرى.'],
  [/(has|have) (a )?(parent|children|sub)|sub-?categor/i, 'لا يمكن تنفيذ العملية لوجود عناصر فرعية مرتبطة.'],
  [/cannot delete|can't delete|could not delete|delete.*(fail|not allowed)/i, 'تعذر الحذف لأن العنصر مرتبط ببيانات أخرى.'],
  [/network error|timeout|timed out/i, 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.'],
  [/server error|internal server|whoops|something went wrong/i, 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.'],
];

const translate = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return '';
  if (ARABIC.test(raw)) return raw;
  if (TECHNICAL.test(raw)) return '';
  const hit = KNOWN.find(([pattern]) => pattern.test(raw));
  return hit ? hit[1] : '';
};

// Laravel validation: { errors: { field: ['msg', ...] } } -> first translatable message.
const fromErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return '';
  const list = Object.values(errors).flat().map(translate).filter(Boolean);
  return [...new Set(list)][0] || '';
};

export const apiErrorMessage = (error, fallback = 'حدث خطأ غير متوقع. حاول مرة أخرى.') => {
  if (error && !error.response) return 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.';
  const status = error?.response?.status;
  const data = error?.response?.data;
  const raw = String(data?.message || '').trim();
  if (raw && ARABIC.test(raw)) return raw;
  const fromField = fromErrors(data?.errors);
  if (fromField) return fromField;
  if (raw && LINKED.test(raw)) return fallback;
  const known = translate(raw);
  if (known) return known;
  if (status === 401) return 'انتهت الجلسة. سجّل الدخول مرة أخرى.';
  if (status === 403) return 'ليست لديك صلاحية لتنفيذ هذا الإجراء.';
  if (status === 404) return 'العنصر المطلوب لم يعد موجودًا. حدّث الصفحة وحاول مرة أخرى.';
  if (status === 409) return fallback;
  if (status === 413) return 'حجم الملف أكبر من المسموح به.';
  if (status === 422) return 'البيانات المدخلة غير صحيحة. راجع الحقول وحاول مرة أخرى.';
  if (status === 429) return 'تم إرسال طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.';
  return fallback;
};
