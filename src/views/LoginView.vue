<template>
  <div class="login-page">
    <!-- القسم الأيسر: نموذج تسجيل الدخول -->
    <div class="login-left">
      <div class="login-form-wrapper">
        <!-- العنوان -->
        <div class="login-header">
          <h2 class="login-title">مرحباً بك في تجارة</h2>
          <p class="login-subtitle">أدخل بيانات الاعتماد للوصول إلى لوحة التحكم</p>
        </div>

        <!-- نموذج تسجيل الدخول -->
        <form @submit.prevent="handleLogin" class="login-form" novalidate>
          <!-- البريد الإلكتروني -->
          <div class="form-group">
            <label for="email" class="form-label">البريد الإلكتروني</label>
            <div class="input-wrapper">
              <input
                id="email"
                name="email"
                v-model="form.email"
                type="email"
                required
                placeholder="admin@example.com"
                class="form-input"
                :class="{ 'input-error': errors.email }"
                autocomplete="username"
                spellcheck="false"
                enterkeyhint="next"
              />
              <span class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
            </div>
            <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
          </div>

          <!-- كلمة المرور -->
          <div class="form-group">
            <label for="password" class="form-label">كلمة المرور</label>
            <div class="input-wrapper">
              <input
                id="password"
                name="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="أدخل كلمة المرور"
                class="form-input"
                :class="{ 'input-error': errors.password }"
                autocomplete="current-password"
                enterkeyhint="done"
              />
              <span class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <button
                v-if="form.password"
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
                tabindex="-1"
                aria-label="إظهار أو إخفاء كلمة المرور"
              >
                <PasswordEyeIcon v-if="showPassword" />
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
          </div>

          <!-- تذكرني -->
          <div class="form-row">
            <label class="remember-label">
              <input
                type="checkbox"
                v-model="form.remember"
                class="remember-checkbox"
              />
              <span>تذكرني</span>
            </label>
          </div>

          <!-- رسالة الخطأ العامة -->
          <div v-if="error" class="error-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <!-- زر تسجيل الدخول -->
          <button
            type="submit"
            class="login-btn"
            :disabled="loading"
          >
            <span v-if="!loading" class="btn-content">
              <span>تسجيل الدخول إلى لوحة التحكم</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </span>
            <span v-else class="btn-loading">
              <span class="spinner"></span>
              جاري تسجيل الدخول...
            </span>
          </button>
        </form>
      </div>
    </div>

    <!-- القسم الأيمن: لوحة العلامة التجارية -->
    <div class="login-right">
      <!-- اللوجو والعنوان العلوي -->
      <div class="brand-logo">
        <img src="/brand/tijara-icon-light.svg" alt="Tijara" class="brand-logo-img" />
        <span class="brand-logo-text">لوحة الإدارة</span>
      </div>

      <!-- المحتوى الرئيسي -->
      <div class="brand-content">
        <h1 class="brand-title">
          إدارة منصة<br />التجارة الإلكترونية
        </h1>
        <p class="brand-desc">
          الوصول إلى لوحة التحكم لمراقبة المبيعات وإدارة المنتجات وتنمية أعمالك.
        </p>
      </div>

      <!-- Footer للقسم الأيمن -->
      <div class="brand-footer">
        <p>جميع الحقوق محفوظة © Be Kite {{ currentYear }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import api from '../config/axios';
import { useRouter } from 'vue-router';
import PasswordEyeIcon from '../components/PasswordEyeIcon.vue';
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginRateLimit,
  isExplicitNonAdminUser,
  clearAdminSessionArtifacts,
  hasControlCharacters,
} from '../utils/adminSecurity';

const router = useRouter();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rawSavedEmail = String(localStorage.getItem('remembered_email') || '').trim();
const savedEmail = EMAIL_REGEX.test(rawSavedEmail) ? rawSavedEmail : '';

const form = ref({
  email: savedEmail,
  password: '',
  remember: Boolean(savedEmail),
});

const loading = ref(false);
const error = ref('');
const errors = ref({});
const showPassword = ref(false);

const currentYear = computed(() => new Date().getFullYear());

onMounted(() => {
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = '/brand/tijara-icon-dark.svg';
});

const validate = () => {
  errors.value = {};

  if (!form.value.email) {
    errors.value.email = 'البريد الإلكتروني مطلوب';
  } else if (!EMAIL_REGEX.test(form.value.email.trim())) {
    errors.value.email = 'البريد الإلكتروني غير صحيح';
  }

  if (!form.value.password) {
    errors.value.password = 'كلمة المرور مطلوبة';
  } else if (form.value.password.length < 6) {
    errors.value.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  }

  return Object.keys(errors.value).length === 0;
};

const handleLogin = async () => {
  error.value = '';

  const rateLimit = checkLoginRateLimit();
  if (rateLimit.blocked) {
    error.value = `تم تجاوز الحد المسموح لمحاولات الدخول. يرجى الانتظار ${rateLimit.remainingSeconds} ثانية ثم المحاولة مجدداً`;
    return;
  }

  if (!validate()) return;

  loading.value = true;

  try {
    const cleanEmail = form.value.email.trim();
    const response = await api.post('/v1/admin/login', {
      email: cleanEmail,
      password: form.value.password,
    });

    const rawToken = String(response.data?.token ?? response.data?.access_token ?? '').trim();
    const user = response.data?.user || response.data?.admin || response.data?.customer || {};

    if (!rawToken || rawToken === 'undefined' || rawToken === 'null' || hasControlCharacters(rawToken)) {
      error.value = 'تعذر التحقق من جلسة الدخول، يرجى المحاولة مرة أخرى';
      return;
    }

    if (isExplicitNonAdminUser(user)) {
      clearAdminSessionArtifacts(localStorage);
      form.value.password = '';
      error.value = 'غير مصرح لهذا الحساب بالدخول إلى لوحة الإدارة';
      return;
    }

    resetLoginRateLimit();
    clearAdminSessionArtifacts(localStorage);

    // حفظ الـ token والمعلومات
    localStorage.setItem('token', rawToken);
    localStorage.setItem('admin', JSON.stringify(user));
    form.value.password = '';

    if (form.value.remember) {
      localStorage.setItem('remembered_email', cleanEmail);
    } else {
      localStorage.removeItem('remembered_email');
    }

    // الانتقال للوحة التحكم
    router.push('/admin/dashboard');
  } catch (err) {
    form.value.password = '';
    const failure = recordLoginFailure();
    if (failure.blocked) {
      error.value = `تم تجاوز الحد المسموح لمحاولات الدخول. يرجى الانتظار ${failure.remainingSeconds} ثانية ثم المحاولة مجدداً`;
    } else {
      error.value = apiErrorMessage(err, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ===== تخطيط الصفحة الرئيسي ===== */
.login-page {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  direction: ltr; /* LTR على الحاوية لترتيب الأعمدة: نموذج يسار، براند يمين */
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  background: #f8f7fa;
}

/* ===== القسم الأيسر (النموذج) ===== */
.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #f8f7fa;
  padding: 3rem;
  position: relative;
  min-height: 100vh;
  direction: rtl; /* RTL داخل النموذج */
}

.login-form-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 400px;
  margin: auto;
  width: 100%;
}

/* ===== رأس صفحة تسجيل الدخول ===== */
.login-header {
  text-align: right;
  margin-bottom: 1.85rem;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #3b3547 !important;
  margin-bottom: 0.45rem;
  letter-spacing: -0.3px;
}

.login-subtitle {
  font-size: 0.88rem;
  color: #7e7a8a !important;
  line-height: 1.5;
  font-weight: 400;
}

/* ===== النموذج ===== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #3b3547 !important;
  text-align: right;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.7rem 2.5rem 0.7rem 1rem;
  border: 1px solid #e2e0e7 !important;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  color: #1f2937 !important;
  background: #ffffff !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  direction: ltr;
  text-align: right;
  outline: none;
}

.form-input::placeholder {
  color: #8b8896 !important;
  direction: ltr;
  text-align: right;
}

.form-input:focus {
  border-color: #660033 !important;
  box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.12);
}

.form-input.input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-icon {
  position: absolute;
  right: 0.85rem;
  color: #787586;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.toggle-password {
  position: absolute;
  left: 0.85rem;
  color: #787586;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #660033;
}

.error-msg {
  font-size: 0.72rem;
  color: #ef4444;
  text-align: right;
}

/* ===== صف تذكرني ===== */
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.15rem;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  color: #2e2b3a !important;
  user-select: none;
}

.remember-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border: 1px solid #d4d2dc;
  border-radius: 3px;
  background-color: #ffffff;
  cursor: pointer;
  display: inline-grid;
  place-content: center;
  margin: 0;
  transition: all 0.15s ease;
}

.remember-checkbox:checked {
  background-color: #660033;
  border-color: #660033;
}

.remember-checkbox:checked::before {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 1.8px solid #ffffff;
  border-bottom: 1.8px solid #ffffff;
  transform: rotate(-45deg) translate(0.5px, -0.5px);
}

/* ===== رسالة الخطأ العامة ===== */
.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

/* ===== زر تسجيل الدخول ===== */
.login-btn {
  width: 100%;
  padding: 0.78rem 1rem;
  background: #660033;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.86rem;
  font-weight: 500;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 0.35rem;
  position: relative;
  overflow: hidden;
}

.login-btn:hover:not(:disabled) {
  background: #4d0026;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 0, 51, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}

.btn-icon {
  flex-shrink: 0;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== القسم الأيمن (البراندينج) ===== */
.login-right {
  width: 40%;
  background-color: #660033;
  background-image:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.065) 0%, rgba(255, 255, 255, 0) 65%),
    linear-gradient(to right, rgba(255, 255, 255, 0.022) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
  background-size: 100% 100%, 48px 48px, 48px 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2.25rem 2.5rem;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  direction: rtl; /* RTL داخل القسم الملوّن */
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
  position: relative;
  z-index: 2;
}

.brand-logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.brand-logo-text {
  color: #ffffff !important;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.3px;
}

/* المحتوى الرئيسي للبراند */
.brand-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: right;
  position: relative;
  z-index: 2;
}

.brand-title {
  font-size: 2.4rem;
  font-weight: 600;
  color: #ffffff !important;
  line-height: 1.32;
  margin-bottom: 1rem;
  letter-spacing: -0.5px;
  text-align: right;
}

.brand-desc {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.78) !important;
  line-height: 1.7;
  max-width: 390px;
  text-align: right;
}

/* فوتر القسم الأيمن */
.brand-footer {
  text-align: right;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5) !important;
  position: relative;
  z-index: 2;
}

.brand-footer p {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .login-page {
    flex-direction: column;
  }

  .login-right {
    display: none;
  }

  .login-left {
    padding: 2.5rem 1.5rem;
    min-height: 100vh;
  }

  .login-form-wrapper {
    margin: auto;
  }
}
</style>
