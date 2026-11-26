// Administrator accounts (إدارة المديرين) and the signed-in admin's own profile.
//   GET    /v1/dashboard/users?role=admin   list (the API returns `admin` and `super_admin` accounts together)
//   POST   /v1/users                        { name, email, phone_number, password(min 8), role, status, image_file? }
//   PUT    /v1/users/{id}                   update (multipart; send `role` every time, an update without it clears the role)
//   DELETE /v1/users/{id}
//   GET    /v1/profile                      the signed-in admin
//   POST   /v1/profile                      { name, phone_number }  (it also accepts `email`; the page keeps it read-only)
//   PUT    /v1/profile/password             { current_password, password, password_confirmation }

import { roleLabel, countModules } from './permissions.js';

// Roles an administrator can have. Each one starts from a permission preset (see permissions.js) that the
// "إدارة الصلاحيات" tab of the form can adjust. The API accepts only `super_admin`, `admin` and `user` today
// (the other presets answer 422 "selected role is invalid"), so only the first two can be assigned here.
export const ADMIN_ROLES = ['super_admin', 'admin'];
export const SUPER_ADMIN_ROLE = 'super_admin';
export const isSuperAdmin = (account) => String(account?.role || '').toLowerCase() === SUPER_ADMIN_ROLE;
// A super admin manages everyone; any other administrator cannot edit, disable or delete a super admin.
export const canManageAdmin = (actor, target) => isSuperAdmin(actor) || !isSuperAdmin(target);
// Roles the signed-in administrator may hand out: only a super admin can create another super admin.
export const assignableRoles = (actor) => ADMIN_ROLES.filter((role) => role !== SUPER_ADMIN_ROLE || isSuperAdmin(actor));
export const PASSWORD_MIN = 8;
export const NAME_MAX = 100;

export { roleLabel };

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());

// Digits with an optional leading + and the usual separators, 7 to 15 digits.
export const isValidPhone = (value) => {
  const text = String(value || '').trim();
  if (!/^\+?[0-9\s\-()]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
};

// Field errors as codes; the page turns each code into a sentence in the current language.
export const validateAdminForm = (form = {}, { isEdit = false } = {}) => {
  const errors = {};
  const name = clean(form.name);
  if (!name) errors.name = 'required';
  else if (name.length > NAME_MAX) errors.name = 'too_long';
  if (!String(form.email || '').trim()) errors.email = 'required';
  else if (!isValidEmail(form.email)) errors.email = 'invalid';
  if (!String(form.phone || '').trim()) errors.phone = 'required';
  else if (!isValidPhone(form.phone)) errors.phone = 'invalid';
  if (!ADMIN_ROLES.includes(form.role)) errors.role = 'required';
  // Every role except the full-access admin needs at least one module, otherwise the account could open nothing.
  else if (form.role !== 'super_admin' && !countModules(form.permissions)) errors.permissions = 'required';
  const password = String(form.password || '');
  if (!isEdit && !password) errors.password = 'required';
  else if (password && password.length < PASSWORD_MIN) errors.password = 'short';
  return errors;
};

export const validateProfileForm = (form = {}) => {
  const errors = {};
  const name = clean(form.name);
  if (!name) errors.name = 'required';
  else if (name.length > NAME_MAX) errors.name = 'too_long';
  if (!String(form.phone || '').trim()) errors.phone = 'required';
  else if (!isValidPhone(form.phone)) errors.phone = 'invalid';
  return errors;
};

export const validatePasswordChange = ({ current = '', next = '', confirm = '' } = {}) => {
  const errors = {};
  if (!current) errors.current = 'required';
  if (!next) errors.next = 'required';
  else if (next.length < PASSWORD_MIN) errors.next = 'short';
  else if (current && next === current) errors.next = 'same';
  if (!confirm) errors.confirm = 'required';
  else if (next && confirm !== next) errors.confirm = 'mismatch';
  return errors;
};

// 0 (empty), 1 (too short) to 4: length, mixed case, a digit, a symbol.
export const passwordStrength = (password = '') => {
  const text = String(password);
  if (!text) return 0;
  let score = 0;
  if (text.length >= PASSWORD_MIN) score += 1;
  if (/[a-z]/.test(text) && /[A-Z]/.test(text)) score += 1;
  if (/\d/.test(text)) score += 1;
  if (/[^A-Za-z0-9]/.test(text)) score += 1;
  return text.length < PASSWORD_MIN ? 1 : score;
};

export const toProfilePayload = (form = {}) => ({
  name: clean(form.name),
  phone_number: String(form.phone || '').trim(),
});

export const toPasswordPayload = ({ current, next, confirm }) => ({
  current_password: current,
  password: next,
  password_confirmation: confirm,
});

// "2026-10-11T14:37:19+00:00" → "2026-10-11"
export const dayOf = (value) => {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : '';
};

export const filterAdmins = (admins = [], { search = '', role = '' } = {}) => {
  const query = clean(search).toLowerCase();
  return admins.filter((admin) => {
    if (role && admin.role !== role) return false;
    if (!query) return true;
    return [admin.name, admin.email, admin.phone].some((field) => String(field ?? '').toLowerCase().includes(query));
  });
};

// Server messages arrive in English; the usual ones are shown in Arabic.
const SERVER_MESSAGES = [
  [/email has already been taken/i, 'البريد الإلكتروني مستخدم بالفعل', 'This email is already in use'],
  [/phone.*already been taken/i, 'رقم الجوال مستخدم بالفعل', 'This phone number is already in use'],
  [/password.*at least 8/i, 'كلمة المرور يجب ألا تقل عن 8 أحرف', 'The password must be at least 8 characters'],
  [/password is incorrect/i, 'كلمة المرور الحالية غير صحيحة', 'The current password is incorrect'],
  [/confirmation does not match/i, 'تأكيد كلمة المرور غير مطابق', 'The password confirmation does not match'],
  [/selected role is invalid/i, 'هذه الصلاحية غير مدعومة من الخادم', 'The server does not support this role'],
  [/not have administrative access/i, 'هذا الحساب لا يملك صلاحية دخول لوحة التحكم', 'This account has no dashboard access'],
  [/valid email/i, 'البريد الإلكتروني غير صالح', 'The email is not valid'],
];

export const serverErrorText = (error, lang = 'ar') => {
  const data = error?.response?.data;
  const first = data?.errors ? Object.values(data.errors).flat()[0] : '';
  const raw = String(first || data?.message || '');
  if (!raw) return '';
  const hit = SERVER_MESSAGES.find(([pattern]) => pattern.test(raw));
  if (hit) return lang === 'ar' ? hit[1] : hit[2];
  // A stack-trace style message is of no use to the admin.
  if (error?.response?.status >= 500) return '';
  return raw;
};
