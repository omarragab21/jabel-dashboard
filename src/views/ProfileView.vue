<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { ref, computed, onMounted } from 'vue';
import adminManagementService from '../application/adminManagementService';
import { useAdminText } from '../composables/useAdminText';
import { useAdminProfile } from '../composables/useAdminProfile';
import {
  NAME_MAX, PASSWORD_MIN, validateProfileForm, validatePasswordChange, passwordStrength,
  toProfilePayload, toPasswordPayload, serverErrorText,
} from '../domain/admins/adminAccount';

const { tx, locale } = useAdminText();
const { apply } = useAdminProfile();

const account = ref(null);
const loading = ref(true);
const loadError = ref(false);

const form = ref({ name: '', phone: '' });
const savedForm = ref({ name: '', phone: '' });
const profileTouched = ref(false);
const savingProfile = ref(false);

const pw = ref({ current: '', next: '', confirm: '' });
const pwTouched = ref(false);
const savingPassword = ref(false);
const show = ref({ current: false, next: false, confirm: false });
const pwServerError = ref('');

const profileErrors = computed(() => (profileTouched.value ? validateProfileForm(form.value) : {}));
const pwErrors = computed(() => (pwTouched.value ? validatePasswordChange(pw.value) : {}));
const strength = computed(() => passwordStrength(pw.value.next));
const strengthText = computed(() => [
  '', tx('ضعيفة', 'Weak'), tx('متوسطة', 'Fair'), tx('جيدة', 'Good'), tx('قوية', 'Strong'),
][strength.value]);

const dirty = computed(() => form.value.name.trim() !== savedForm.value.name.trim() || form.value.phone.trim() !== savedForm.value.phone.trim());

const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');
let alertTimer = null;
const triggerAlert = (message, type = 'success') => {
  alertMessage.value = localizeMessage(message);
  alertType.value = type;
  showAlert.value = true;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => { showAlert.value = false; }, 3500);
};

const messageFor = (scope, field) => {
  const code = (scope === 'profile' ? profileErrors.value : pwErrors.value)[field];
  if (!code) return '';
  const table = {
    name: { required: ['اكتب اسمك', 'Enter your name'], too_long: [`الاسم أطول من ${NAME_MAX} حرف`, `The name is longer than ${NAME_MAX} characters`] },
    phone: { required: ['اكتب رقم الجوال', 'Enter your phone number'], invalid: ['رقم الجوال غير صالح', 'The phone number is not valid'] },
    current: { required: ['اكتب كلمة المرور الحالية', 'Enter your current password'] },
    next: {
      required: ['اكتب كلمة المرور الجديدة', 'Enter a new password'],
      short: [`كلمة المرور يجب ألا تقل عن ${PASSWORD_MIN} أحرف`, `The password must be at least ${PASSWORD_MIN} characters`],
      same: ['كلمة المرور الجديدة مطابقة للحالية', 'The new password is the same as the current one'],
    },
    confirm: { required: ['أكّد كلمة المرور الجديدة', 'Confirm the new password'], mismatch: ['تأكيد كلمة المرور غير مطابق', 'The confirmation does not match'] },
  };
  const pair = table[field]?.[code];
  return pair ? tx(pair[0], pair[1]) : '';
};

const load = async () => {
  loading.value = true;
  loadError.value = false;
  try {
    const data = await adminManagementService.getProfile();
    account.value = data;
    form.value = { name: data.name || '', phone: data.phone || '' };
    savedForm.value = { ...form.value };
    apply(data);
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const saveProfile = async () => {
  profileTouched.value = true;
  if (Object.keys(validateProfileForm(form.value)).length || savingProfile.value) return;
  savingProfile.value = true;
  try {
    await adminManagementService.updateProfile(toProfilePayload(form.value));
    // Read it back so the page and the header show what the server stored.
    const data = await adminManagementService.getProfile();
    account.value = data;
    form.value = { name: data.name || '', phone: data.phone || '' };
    savedForm.value = { ...form.value };
    profileTouched.value = false;
    apply(data);
    triggerAlert('تم تحديث بياناتك بنجاح');
  } catch (error) {
    triggerAlert(serverErrorText(error, locale.value) || 'تعذّر حفظ البيانات', 'error');
  } finally {
    savingProfile.value = false;
  }
};

const resetProfile = () => {
  form.value = { ...savedForm.value };
  profileTouched.value = false;
};

const savePassword = async () => {
  pwTouched.value = true;
  pwServerError.value = '';
  if (Object.keys(validatePasswordChange(pw.value)).length || savingPassword.value) return;
  savingPassword.value = true;
  try {
    await adminManagementService.changePassword(toPasswordPayload(pw.value));
    pw.value = { current: '', next: '', confirm: '' };
    pwTouched.value = false;
    show.value = { current: false, next: false, confirm: false };
    triggerAlert('تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    const text = serverErrorText(error, locale.value) || tx('تعذّر تغيير كلمة المرور', 'Could not change the password');
    pwServerError.value = text;
    triggerAlert(text, 'error');
  } finally {
    savingPassword.value = false;
  }
};
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <div class="header-titles">
        <div>
          <h1 class="page-title">{{ tx('الملف الشخصي', 'My profile') }}</h1>
          <p class="page-subtitle">{{ tx('إدارة بيانات حسابك وكلمة المرور', 'Manage your account details and password') }}</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid" data-testid="profile-skeleton" aria-busy="true">
      <div class="stack"><div class="card"><span class="shimmer sk-line w40"></span><span class="shimmer sk-field"></span><span class="shimmer sk-field"></span></div></div>
    </div>

    <div v-else-if="loadError" class="card state" data-testid="profile-error">
      <p>{{ tx('تعذّر تحميل بيانات حسابك.', 'Could not load your account.') }}</p>
      <button type="button" class="btn-primary" @click="load">{{ tx('إعادة المحاولة', 'Retry') }}</button>
    </div>

    <div v-else class="grid">
      <div class="stack">
        <!-- Details -->
        <section class="card" data-testid="details-card">
          <h3 class="card-title">{{ tx('البيانات الشخصية', 'Personal details') }}</h3>
          <p class="card-sub">{{ tx('يمكنك تغيير اسمك ورقم جوالك.', 'You can change your name and phone number.') }}</p>
          <form class="form" novalidate @submit.prevent="saveProfile">
            <div class="field-row">
              <div class="form-group">
                <label class="form-label" for="pf-name">{{ tx('الاسم', 'Name') }}</label>
                <input id="pf-name" v-model="form.name" type="text" class="form-control" :class="{ invalid: profileErrors.name }" autocomplete="name" data-testid="pf-name" />
                <span v-if="profileErrors.name" class="field-error" data-testid="err-pf-name">{{ messageFor('profile', 'name') }}</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="pf-phone">{{ tx('رقم الجوال', 'Phone') }}</label>
                <input id="pf-phone" v-model="form.phone" type="tel" class="form-control ltr-text" :class="{ invalid: profileErrors.phone }" autocomplete="tel" data-testid="pf-phone" />
                <span v-if="profileErrors.phone" class="field-error" data-testid="err-pf-phone">{{ messageFor('profile', 'phone') }}</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-email">{{ tx('البريد الإلكتروني', 'Email') }}</label>
              <div class="locked">
                <input id="pf-email" :value="account.email" type="email" class="form-control ltr-text" readonly data-testid="pf-email" />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <small class="hint">{{ tx('البريد هو اسم الدخول ولا يمكن تغييره من هنا.', 'The email is your sign-in and cannot be changed here.') }}</small>
            </div>
            <div class="actions">
              <button type="button" class="btn-ghost" :disabled="!dirty || savingProfile" data-testid="pf-reset" @click="resetProfile">{{ tx('تراجع', 'Reset') }}</button>
              <button type="submit" class="btn-primary" :disabled="!dirty || savingProfile" data-testid="pf-save">
                {{ savingProfile ? tx('جاري الحفظ...', 'Saving...') : tx('حفظ التغييرات', 'Save changes') }}
              </button>
            </div>
          </form>
        </section>

        <!-- Password -->
        <section class="card" data-testid="password-card">
          <h3 class="card-title">{{ tx('تغيير كلمة المرور', 'Change password') }}</h3>
          <p class="card-sub">{{ tx(`استخدم ${PASSWORD_MIN} أحرف على الأقل، ويُفضّل مزيج من الحروف والأرقام والرموز.`, `Use at least ${PASSWORD_MIN} characters; a mix of letters, numbers and symbols is best.`) }}</p>
          <form class="form" novalidate @submit.prevent="savePassword">
            <div class="form-group">
              <label class="form-label" for="pw-current">{{ tx('كلمة المرور الحالية', 'Current password') }}</label>
              <div class="password-wrap">
                <input id="pw-current" v-model="pw.current" :type="show.current ? 'text' : 'password'" class="form-control ltr-text" :class="{ invalid: pwErrors.current }" autocomplete="current-password" data-testid="pw-current" />
                <button type="button" class="eye-btn" :aria-label="show.current ? tx('إخفاء', 'Hide') : tx('إظهار', 'Show')" @click="show.current = !show.current">
                  <svg v-if="!show.current" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <span v-if="pwErrors.current" class="field-error" data-testid="err-pw-current">{{ messageFor('pw', 'current') }}</span>
            </div>
            <div class="field-row">
              <div class="form-group">
                <label class="form-label" for="pw-next">{{ tx('كلمة المرور الجديدة', 'New password') }}</label>
                <div class="password-wrap">
                  <input id="pw-next" v-model="pw.next" :type="show.next ? 'text' : 'password'" class="form-control ltr-text" :class="{ invalid: pwErrors.next }" autocomplete="new-password" data-testid="pw-next" />
                  <button type="button" class="eye-btn" :aria-label="show.next ? tx('إخفاء', 'Hide') : tx('إظهار', 'Show')" @click="show.next = !show.next">
                    <svg v-if="!show.next" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <div v-if="pw.next" class="strength" :data-level="strength" data-testid="strength">
                  <span v-for="n in 4" :key="n" :class="{ on: n <= strength }"></span>
                  <em>{{ strengthText }}</em>
                </div>
                <span v-if="pwErrors.next" class="field-error" data-testid="err-pw-next">{{ messageFor('pw', 'next') }}</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="pw-confirm">{{ tx('تأكيد كلمة المرور', 'Confirm password') }}</label>
                <div class="password-wrap">
                  <input id="pw-confirm" v-model="pw.confirm" :type="show.confirm ? 'text' : 'password'" class="form-control ltr-text" :class="{ invalid: pwErrors.confirm }" autocomplete="new-password" data-testid="pw-confirm" />
                  <button type="button" class="eye-btn" :aria-label="show.confirm ? tx('إخفاء', 'Hide') : tx('إظهار', 'Show')" @click="show.confirm = !show.confirm">
                    <svg v-if="!show.confirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <span v-if="pwErrors.confirm" class="field-error" data-testid="err-pw-confirm">{{ messageFor('pw', 'confirm') }}</span>
              </div>
            </div>
            <p v-if="pwServerError" class="server-error" role="alert" data-testid="pw-server-error">{{ pwServerError }}</p>
            <div class="actions">
              <button type="submit" class="btn-primary" :disabled="savingPassword" data-testid="pw-save">
                {{ savingPassword ? tx('جاري التحديث...', 'Updating...') : tx('تحديث كلمة المرور', 'Update password') }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>

    <div class="alert-toast" data-testid="toast" :class="[alertType, { show: showAlert }]" role="status">{{ alertMessage }}</div>
  </div>
</template>

<style scoped>
.profile-page { display: flex; flex-direction: column; gap: 1.25rem; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.header-titles { display: flex; align-items: center; gap: 0.9rem; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; line-height: 1.3; }
.page-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0.1rem 0 0; }

.grid { max-width: 860px; }
.stack { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.card-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #111827; }
.card-sub { margin: 0.25rem 0 1.25rem; font-size: 0.82rem; color: #6b7280; line-height: 1.6; }
.state { text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center; color: #6b7280; }


.form { display: flex; flex-direction: column; gap: 1rem; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #374151; }
.form-control { width: 100%; box-sizing: border-box; height: 44px; padding: 0 0.9rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: inherit; font-size: 0.88rem; color: #111827; background: #f9fafb; outline: none; transition: border-color 0.15s, background 0.15s; }
.form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.12); }
.form-control.invalid { border-color: #dc2626; background: #fef2f2; }
.form-control[readonly] { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
.ltr-text { direction: ltr; text-align: start; }
[dir='rtl'] .ltr-text { text-align: right; }
.field-error { color: #dc2626; font-size: 0.74rem; font-weight: 600; }
.server-error { margin: 0; padding: 0.65rem 0.9rem; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 0.82rem; font-weight: 600; }
.hint { color: #9ca3af; font-size: 0.74rem; }
.locked { position: relative; }
.locked svg { position: absolute; top: 50%; transform: translateY(-50%); inset-inline-end: 0.9rem; color: #9ca3af; }
.locked .form-control { padding-left: 2.4rem; padding-right: 2.4rem; }
.password-wrap { position: relative; }
.password-wrap .form-control { padding-left: 2.6rem; padding-right: 2.6rem; }
.eye-btn { position: absolute; top: 50%; transform: translateY(-50%); inset-inline-end: 0.5rem; background: none; border: none; color: #6b7280; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; }
.eye-btn:hover { background: #f3f4f6; }

.strength { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.1rem; }
.strength span { flex: 1; height: 4px; border-radius: 4px; background: #e5e7eb; transition: background 0.2s; }
.strength[data-level='1'] span.on { background: #ef4444; }
.strength[data-level='2'] span.on { background: #f59e0b; }
.strength[data-level='3'] span.on { background: #84cc16; }
.strength[data-level='4'] span.on { background: #16a34a; }
.strength em { font-style: normal; font-size: 0.72rem; font-weight: 700; color: #6b7280; margin-inline-start: 0.4rem; min-width: 3rem; }

.actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.25rem; }
.btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 0.65rem 1.4rem; border-radius: 8px; border: none; background: #660033; color: #fff; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.btn-primary:hover:not(:disabled) { background: #4d0026; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-ghost { padding: 0.65rem 1.1rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.btn-ghost:hover:not(:disabled) { background: #f9fafb; }
.btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

.shimmer { display: block; border-radius: 8px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
.sk-line { height: 14px; margin: 0.6rem auto; }
.sk-line.w40 { width: 40%; }
.sk-field { height: 44px; margin-top: 1rem; }
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }


@media (max-width: 600px) {
  .field-row { grid-template-columns: 1fr; }
  .card { padding: 1.1rem; }
  .actions { justify-content: stretch; }
  .actions button { flex: 1; }
}
</style>
