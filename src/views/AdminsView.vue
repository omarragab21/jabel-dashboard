<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { ref, computed, onMounted } from 'vue';
import adminManagementService from '../application/adminManagementService';
import { useAdminText } from '../composables/useAdminText';
import { useAdminProfile } from '../composables/useAdminProfile';
import { safeObjectUrl } from '../utils/adminSecurity';
import ImageCropModal from '../components/ImageCropModal.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';
import {
  ADMIN_ROLES, NAME_MAX, PASSWORD_MIN, roleLabel, validateAdminForm, filterAdmins, dayOf, serverErrorText,
} from '../domain/admins/adminAccount';

const { tx, locale } = useAdminText();
const { profile: me } = useAdminProfile();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();

const admins = ref([]);
const loading = ref(true);
const loadFailed = ref(false);
const searchQuery = ref('');
const roleFilter = ref('');

const showFormModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const currentAdmin = ref(null);
const previewAvatar = ref(null);
const avatarFile = ref(null);
const showPassword = ref(false);
const touched = ref(false);

const emptyForm = () => ({ name: '', email: '', phone: '', password: '', role: ADMIN_ROLES[0], is_active: true });
const form = ref(emptyForm());
const errors = computed(() => (touched.value ? validateAdminForm(form.value, { isEdit: isEditing.value }) : {}));

const deleteTarget = ref(null);
const isDeleting = ref(false);
const togglingId = ref(null);

const isMe = (admin) => String(admin.id) === String(me.value.id) || (!!admin.email && admin.email === me.value.email);

const visibleAdmins = computed(() => filterAdmins(admins.value.filter((admin) => !isMe(admin)), { search: searchQuery.value, role: roleFilter.value }));

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

const fieldMessage = (field) => {
  const code = errors.value[field];
  if (!code) return '';
  const messages = {
    name: { required: ['اكتب اسم المدير', 'Enter the administrator name'], too_long: [`الاسم أطول من ${NAME_MAX} حرف`, `The name is longer than ${NAME_MAX} characters`] },
    email: { required: ['اكتب البريد الإلكتروني', 'Enter the email'], invalid: ['البريد الإلكتروني غير صالح', 'The email is not valid'] },
    phone: { required: ['اكتب رقم الجوال', 'Enter the phone number'], invalid: ['رقم الجوال غير صالح', 'The phone number is not valid'] },
    role: { required: ['اختر الصلاحية', 'Choose a role'] },
    password: { required: ['اكتب كلمة المرور', 'Enter a password'], short: [`كلمة المرور يجب ألا تقل عن ${PASSWORD_MIN} أحرف`, `The password must be at least ${PASSWORD_MIN} characters`] },
  };
  const pair = messages[field]?.[code];
  return pair ? tx(pair[0], pair[1]) : '';
};

const fetchAdmins = async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    admins.value = await adminManagementService.listAdmins();
  } catch {
    loadFailed.value = true;
    triggerAlert('فشل تحميل قائمة المديرين', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAdmins);

const openAddModal = () => {
  isEditing.value = false;
  currentAdmin.value = null;
  form.value = emptyForm();
  previewAvatar.value = null;
  avatarFile.value = null;
  showPassword.value = false;
  touched.value = false;
  showFormModal.value = true;
};

const openEditModal = (admin) => {
  isEditing.value = true;
  currentAdmin.value = admin;
  form.value = { name: admin.name, email: admin.email, phone: admin.phone, password: '', role: admin.role, is_active: admin.is_active };
  previewAvatar.value = admin.avatar || null;
  avatarFile.value = null;
  showPassword.value = false;
  touched.value = false;
  showFormModal.value = true;
};

const closeForm = () => { if (!isSubmitting.value) showFormModal.value = false; };

const cropOptions = () => ({ defaultRatio: '1:1', fileName: 'avatar', title: tx('قص وضبط الصورة الشخصية (Crop & Resize)', 'Crop & resize profile image') });

const handleAvatarChange = async (e) => {
  const picked = e.target.files?.[0];
  e.target.value = '';
  if (!picked) return;
  const { file, error } = await prepareImage(picked, cropOptions());
  if (error) { triggerAlert(error, 'error'); return; }
  avatarFile.value = file;
  previewAvatar.value = safeObjectUrl(file, previewAvatar.value);
};

const recropCurrentImage = async () => {
  const { file, error } = await recropImage(avatarFile.value || previewAvatar.value, cropOptions());
  if (error) triggerAlert(error, 'error');
  if (!file) return;
  avatarFile.value = file;
  previewAvatar.value = safeObjectUrl(file, previewAvatar.value);
};

// Shows the HTTP status and the server's own words so a rejected add can be traced to the API.
const serverStatus = (error) => {
  const status = error?.response?.status;
  return status ? ` (${status})` : '';
};

const submitForm = async () => {
  touched.value = true;
  if (Object.keys(validateAdminForm(form.value, { isEdit: isEditing.value })).length) return;
  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      // The server's "email is taken" check does not skip the account itself, so the email is sent only when it changed.
      const email = form.value.email.trim() === currentAdmin.value.email ? '' : form.value.email;
      await adminManagementService.updateUser(currentAdmin.value.id, { ...form.value, email }, avatarFile.value);
      triggerAlert('تم تحديث بيانات المدير بنجاح');
    } else {
      await adminManagementService.createUser(form.value, avatarFile.value);
      triggerAlert('تمت إضافة المدير بنجاح');
    }
    showFormModal.value = false;
    fetchAdmins();
  } catch (error) {
    const known = serverErrorText(error, locale.value);
    // Editing an account currently answers 500 from the server; say so instead of showing its stack message.
    const fallback = isEditing.value
      ? tx('تعذّر حفظ التعديل: الخادم لا يقبل تعديل بيانات المدير حالياً (خطأ 500 في PUT /users).', 'Could not save: the server rejects administrator edits for now (500 on PUT /users).')
      : tx(`تعذّرت إضافة المدير${serverStatus(error)}`, `Could not add the administrator${serverStatus(error)}`);
    triggerAlert(known || fallback, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (admin) => { deleteTarget.value = admin; };
const cancelDelete = () => { if (!isDeleting.value) deleteTarget.value = null; };

const executeDelete = async () => {
  if (!deleteTarget.value || isDeleting.value) return;
  const target = deleteTarget.value;
  isDeleting.value = true;
  try {
    await adminManagementService.deleteUser(target.id);
    admins.value = admins.value.filter((admin) => admin.id !== target.id);
    deleteTarget.value = null;
    triggerAlert('تم حذف المدير بنجاح');
  } catch (error) {
    triggerAlert(serverErrorText(error, locale.value) || 'فشلت عملية الحذف', 'error');
  } finally {
    isDeleting.value = false;
  }
};

const toggleAdminStatus = async (admin) => {
  if (togglingId.value) return;
  togglingId.value = admin.id;
  const next = !admin.is_active;
  try {
    await adminManagementService.updateUser(admin.id, { ...admin, email: '', is_active: next });
    admin.is_active = next;
    triggerAlert(next ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب');
  } catch (error) {
    triggerAlert(serverErrorText(error, locale.value)
      || tx('تعذّر تغيير الحالة: الخادم لا يقبل تعديل بيانات المدير حالياً (خطأ 500 في PUT /users).', 'Could not change the status: the server rejects administrator edits for now (500 on PUT /users).'), 'error');
  } finally {
    togglingId.value = null;
  }
};
</script>

<template>
  <div class="admins-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <div class="icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>
        </div>
        <div>
          <h1 class="page-title">{{ tx('إدارة المديرين', 'Administrators') }}</h1>
          <p class="page-subtitle">{{ tx('إضافة وإدارة المديرين وصلاحياتهم', 'Add and manage administrators and their roles') }}</p>
        </div>
      </div>
      <button class="add-btn" type="button" data-testid="add-admin" @click="openAddModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {{ tx('إضافة مدير جديد', 'Add administrator') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" v-model="searchQuery" data-testid="search" :placeholder="tx('البحث في المديرين...', 'Search administrators...')" />
      </div>
      <div class="select-wrapper role-filter">
        <select v-model="roleFilter" data-testid="role-filter" :aria-label="tx('الصلاحية', 'Role')">
          <option value="">{{ tx('الكل', 'All') }}</option>
          <option v-for="role in ADMIN_ROLES" :key="role" :value="role">{{ roleLabel(role, locale) }}</option>
        </select>
        <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-avatar">{{ tx('الصورة', 'Photo') }}</th>
            <th>{{ tx('الاسم', 'Name') }}</th>
            <th>{{ tx('رقم الجوال', 'Phone') }}</th>
            <th>{{ tx('البريد الإلكتروني', 'Email') }}</th>
            <th>{{ tx('الصلاحية', 'Role') }}</th>
            <th>{{ tx('الحالة', 'Status') }}</th>
            <th>{{ tx('وقت التسجيل', 'Registered') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="8">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="loadFailed" class="state-row"><td colspan="8">
            {{ tx('تعذّر تحميل المديرين.', 'Could not load the administrators.') }}
            <button type="button" class="link-btn" @click="fetchAdmins">{{ tx('إعادة المحاولة', 'Retry') }}</button>
          </td></tr>
          <tr v-else-if="visibleAdmins.length === 0" class="state-row"><td colspan="8">{{ admins.length ? tx('لا يوجد مديرون مطابقون', 'No matching administrators') : tx('لا يوجد مديرون حالياً', 'No administrators yet') }}</td></tr>
          <template v-else>
            <tr v-for="admin in visibleAdmins" :key="admin.id" class="data-row" :data-id="admin.id" :data-email="admin.email" :data-active="admin.is_active ? '1' : '0'">
              <td class="col-avatar">
                <div class="admin-avatar">
                  <img v-if="admin.avatar" :src="admin.avatar" :alt="admin.name" />
                  <span v-else>{{ (admin.name || '?').trim().charAt(0).toUpperCase() }}</span>
                </div>
              </td>
              <td class="name-cell">
                {{ admin.name }}
                <span v-if="isMe(admin)" class="me-chip" data-testid="me-chip">{{ tx('أنت', 'You') }}</span>
              </td>
              <td class="ltr-text">{{ admin.phone || '—' }}</td>
              <td class="email-cell">{{ admin.email }}</td>
              <td><span class="role-chip">{{ roleLabel(admin.role, locale) }}</span></td>
              <td><span :class="['status-pill', admin.is_active ? 'on' : 'off']" data-testid="status">{{ admin.is_active ? tx('مفعّل', 'Active') : tx('غير مفعّل', 'Disabled') }}</span></td>
              <td class="muted">{{ dayOf(admin.createdAt) || '—' }}</td>
              <td class="col-actions">
                <div class="actions-group">
                  <button
                    v-if="!isMe(admin)"
                    :class="['action-btn', admin.is_active ? 'disable' : 'enable']"
                    type="button"
                    data-testid="toggle-admin"
                    :disabled="togglingId === admin.id"
                    :title="admin.is_active ? tx('تعطيل الحساب', 'Disable account') : tx('تفعيل الحساب', 'Enable account')"
                    @click="toggleAdminStatus(admin)"
                  >
                    <svg v-if="admin.is_active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19.7 14a6.9 6.9 0 0 0 .3-2V5l-8-3-3.2 1.2"/><path d="M4.7 4.7 4 5v7c0 6 8 10 8 10a20.3 20.3 0 0 0 5.6-4.6"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  </button>
                  <span v-else class="action-slot"></span>
                  <button class="action-btn edit" type="button" data-testid="edit-admin" :title="isMe(admin) ? tx('تعديل بياناتي', 'Edit my details') : tx('تعديل', 'Edit')" @click="openEditModal(admin)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button v-if="!isMe(admin)" class="action-btn delete" type="button" data-testid="delete-admin" :title="tx('حذف', 'Delete')" @click="confirmDelete(admin)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                  <span v-else class="action-slot"></span>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="closeForm">
      <div class="modal-content form-content" role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
        <button class="modal-close" type="button" :aria-label="tx('إغلاق', 'Close')" @click="closeForm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header">
          <h2 id="admin-form-title">{{ isEditing ? tx('تعديل بيانات المدير', 'Edit administrator') : tx('إضافة مدير جديد', 'Add a new administrator') }}</h2>
          <p>{{ isEditing ? tx('عدّل بيانات حساب المدير', 'Update the administrator account') : tx('أدخل بيانات المدير الجديد وحدد صلاحياته', 'Enter the new administrator and choose a role') }}</p>
        </div>

        <form class="admin-form" novalidate @submit.prevent="submitForm">
          <div class="form-group">
            <label class="form-label">{{ tx('الصورة الشخصية', 'Profile photo') }}</label>
            <div class="avatar-row">
              <div class="avatar-circle" @click="$refs.avatarInput.click()">
                <img v-if="previewAvatar" :src="previewAvatar" alt="" />
                <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="avatar-actions">
                <button type="button" class="upload-btn" data-testid="upload-avatar" @click="$refs.avatarInput.click()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {{ tx('رفع صورة', 'Upload photo') }}
                </button>
                <ImageCropButton v-if="previewAvatar" @crop="recropCurrentImage" />
              </div>
              <input type="file" ref="avatarInput" accept="image/*" hidden @change="handleAvatarChange" />
              <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
            </div>
            <small v-if="isEditing" class="hint">{{ tx('الخادم يحفظ الصورة عند إنشاء الحساب فقط.', 'The server stores the photo only when the account is created.') }}</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="adm-name">{{ tx('الاسم', 'Name') }}</label>
            <input id="adm-name" v-model="form.name" type="text" class="form-control" :class="{ invalid: errors.name }" :maxlength="NAME_MAX + 20" :placeholder="tx('أدخل الاسم الكامل', 'Enter the full name')" autocomplete="off" />
            <span v-if="errors.name" class="field-error" data-testid="err-name">{{ fieldMessage('name') }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="adm-email">{{ tx('البريد الإلكتروني', 'Email') }}</label>
            <input id="adm-email" v-model="form.email" type="email" class="form-control ltr-text" :class="{ invalid: errors.email }" placeholder="admin@example.com" autocomplete="off" />
            <span v-if="errors.email" class="field-error" data-testid="err-email">{{ fieldMessage('email') }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="adm-phone">{{ tx('رقم الجوال', 'Phone') }}</label>
            <input id="adm-phone" v-model="form.phone" type="tel" class="form-control ltr-text" :class="{ invalid: errors.phone }" placeholder="+962 79 123 4567" autocomplete="off" />
            <span v-if="errors.phone" class="field-error" data-testid="err-phone">{{ fieldMessage('phone') }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="adm-role">{{ tx('الصلاحية', 'Role') }}</label>
            <div class="select-wrapper">
              <select id="adm-role" v-model="form.role" class="form-control" :class="{ invalid: errors.role }">
                <option v-for="role in ADMIN_ROLES" :key="role" :value="role">{{ roleLabel(role, locale) }}</option>
              </select>
              <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="adm-password">{{ isEditing ? tx('كلمة المرور (اتركها فارغة بدون تغيير)', 'Password (leave blank to keep it)') : tx('كلمة المرور', 'Password') }}</label>
            <div class="password-wrap">
              <input id="adm-password" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-control ltr-text" :class="{ invalid: errors.password }" :placeholder="tx('أدخل كلمة المرور', 'Enter a password')" autocomplete="new-password" />
              <button type="button" class="eye-btn" :aria-label="showPassword ? tx('إخفاء', 'Hide') : tx('إظهار', 'Show')" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <span v-if="errors.password" class="field-error" data-testid="err-password">{{ fieldMessage('password') }}</span>
          </div>

          <div v-if="isEditing" class="form-group status-group">
            <span class="form-label">{{ tx('حالة الحساب', 'Account status') }}</span>
            <label class="switch">
              <input type="checkbox" v-model="form.is_active" />
              <span class="slider"></span>
              <span class="switch-text">{{ form.is_active ? tx('مفعّل', 'Active') : tx('غير مفعّل', 'Disabled') }}</span>
            </label>
          </div>

          <div class="form-footer-btns">
            <button type="button" class="btn-cancel-form" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-submit-form" data-testid="save-admin" :disabled="isSubmitting">
              <svg v-if="!isEditing && !isSubmitting" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEditing ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة المدير', 'Add administrator')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete -->
    <div class="modal-overlay" v-if="deleteTarget" @click.self="cancelDelete">
      <div class="modal-content delete-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-title">
        <h2 id="admin-delete-title">{{ tx('تأكيد الحذف', 'Confirm deletion') }}</h2>
        <p>{{ tx(`هل أنت متأكد من حذف المدير "${deleteTarget.name}"؟ لا يمكن التراجع عن هذا الإجراء.`, `Are you sure you want to delete the administrator "${deleteTarget.name}"? This action cannot be undone.`) }}</p>
        <div class="delete-footer">
          <button class="btn-delete-confirm" type="button" data-testid="confirm-delete" :disabled="isDeleting" @click="executeDelete">
            <span v-if="isDeleting" class="spinner" aria-hidden="true"></span>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            {{ isDeleting ? tx('جاري الحذف...', 'Deleting...') : tx('حذف المدير', 'Delete administrator') }}
          </button>
          <button class="btn-cancel-form" type="button" :disabled="isDeleting" @click="cancelDelete">{{ tx('إلغاء', 'Cancel') }}</button>
        </div>
      </div>
    </div>

    <div class="alert-toast" data-testid="toast" :class="[alertType, { show: showAlert }]" role="status">{{ alertMessage }}</div>
  </div>
</template>

<style scoped>
.admins-page { display: flex; flex-direction: column; gap: 1.25rem; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem; }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.header-titles { display: flex; align-items: center; gap: 0.9rem; }
.icon-box { width: 48px; height: 48px; border-radius: 12px; background: #f6e9ef; color: #660033; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; line-height: 1.3; }
.page-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0.1rem 0 0; }
.add-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #660033; color: #fff; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.add-btn:hover { background: #4d0026; }

.filters-card { display: flex; gap: 0.9rem; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.search-box { position: relative; flex: 1; display: flex; align-items: center; min-width: 0; }
.search-icon { position: absolute; inset-inline-start: 1rem; color: #6b7280; pointer-events: none; }
.search-box input { width: 100%; box-sizing: border-box; padding: 0.7rem 2.9rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.85rem; outline: none; background: #fff; }
.search-box input:focus { border-color: #660033; }
.role-filter { width: 190px; flex-shrink: 0; }
.select-wrapper { position: relative; }
.select-wrapper select { width: 100%; box-sizing: border-box; appearance: none; height: 44px; padding: 0 0.9rem 0 2.2rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-family: inherit; font-size: 0.85rem; color: #111827; cursor: pointer; outline: none; }
.select-wrapper select:focus { border-color: #660033; }
.select-icon { position: absolute; inset-inline-end: auto; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; }
[dir='rtl'] .select-icon { left: 0.9rem; right: auto; }
[dir='ltr'] .select-icon { right: 0.9rem; left: auto; }
[dir='ltr'] .select-wrapper select { padding: 0 2.2rem 0 0.9rem; }

.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.95rem 0.9rem; border-bottom: 1px solid #e5e7eb; vertical-align: middle; text-align: start; }
.data-table th { background: #f3f4f6; font-size: 0.8rem; font-weight: 700; color: #374151; white-space: nowrap; }
.data-table td { font-size: 0.85rem; color: #1f2937; }
.data-table tbody tr:last-child td { border-bottom: 0; }
.data-row:hover td { background: #fafafa; }
.state-row td { text-align: center; color: #6b7280; padding: 2.5rem; }
.col-avatar { width: 1%; }
.col-actions { width: 1%; }
.ltr-text { direction: ltr; text-align: start; }
[dir='rtl'] td.ltr-text { text-align: right; }
.muted { color: #6b7280 !important; white-space: nowrap; }
.name-cell { font-weight: 600; }
.email-cell { color: #374151; word-break: break-all; }
.me-chip { display: inline-block; margin-inline-start: 0.4rem; padding: 0.05rem 0.5rem; border-radius: 999px; background: #f6e9ef; color: #660033; font-size: 0.68rem; font-weight: 700; }
.link-btn { background: none; border: none; color: #660033; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: underline; margin-inline-start: 0.4rem; }

.admin-avatar { width: 44px; height: 44px; border-radius: 50%; background: #f6e9ef; color: #660033; display: flex; align-items: center; justify-content: center; font-weight: 800; overflow: hidden; }
.admin-avatar img { width: 100%; height: 100%; object-fit: cover; }

.role-chip { display: inline-block; padding: 0.25rem 0.7rem; border-radius: 999px; background: #f6e9ef; color: #660033; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.status-pill { display: inline-block; padding: 0.22rem 0.8rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.status-pill.on { background: #dcfce7; color: #15803d; }
.status-pill.off { background: #fee2e2; color: #dc2626; }

.actions-group { display: flex; align-items: center; gap: 0.35rem; }
.action-slot { width: 32px; height: 32px; }
.action-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: transparent; cursor: pointer; transition: 0.15s; }
.action-btn:hover:not(:disabled) { background: #f3f4f6; }
.action-btn:disabled { opacity: 0.5; cursor: wait; }
.action-btn.delete { color: #dc2626; }
.action-btn.edit { color: #374151; }
.action-btn.disable { color: #dc2626; }
.action-btn.enable { color: #16a34a; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: #fff; border-radius: 12px; width: 100%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.modal-close { position: absolute; top: 1.3rem; inset-inline-end: auto; left: 1.3rem; background: transparent; color: #6b7280; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
[dir='ltr'] .modal-close { left: auto; right: 1.3rem; }
.modal-close:hover { background: #f3f4f6; }
.form-content { max-width: 500px; max-height: 95vh; overflow-y: auto; }
.form-header { padding: 1.4rem 1.5rem 0.5rem; }
.form-header h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #111827; }
.form-header p { margin: 0.25rem 0 0; font-size: 0.82rem; color: #6b7280; }
.admin-form { padding: 0.75rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 0.9rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #374151; }
.form-control { width: 100%; box-sizing: border-box; height: 42px; padding: 0 0.9rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: inherit; font-size: 0.85rem; color: #111827; background: #f9fafb; outline: none; transition: border-color 0.15s, background 0.15s; }
.form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 3px rgba(102, 0, 51, 0.12); }
.form-control.invalid { border-color: #dc2626; background: #fef2f2; }
.field-error { color: #dc2626; font-size: 0.74rem; font-weight: 600; }
.hint { color: #9ca3af; font-size: 0.72rem; }
.form-content .select-wrapper select.form-control { padding: 0 0.9rem 0 2.2rem; }
[dir='ltr'] .form-content .select-wrapper select.form-control { padding: 0 2.2rem 0 0.9rem; }

.avatar-row { display: flex; align-items: center; gap: 1rem; }
.avatar-circle { width: 76px; height: 76px; border-radius: 50%; border: 2px solid #d1d5db; background: #f9fafb; color: #9ca3af; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; flex-shrink: 0; }
.avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
.avatar-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem; }
.upload-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1rem; border: none; border-radius: 8px; background: #f6e9ef; color: #660033; font-family: inherit; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.upload-btn:hover { background: #efd6e1; }

.password-wrap { position: relative; }
.password-wrap .form-control { padding-left: 2.6rem; padding-right: 2.6rem; }
.eye-btn { position: absolute; top: 50%; transform: translateY(-50%); inset-inline-end: 0.5rem; background: none; border: none; color: #6b7280; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 6px; }
.eye-btn:hover { background: #f3f4f6; }

.status-group { flex-direction: row; align-items: center; justify-content: space-between; }
.switch { display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; }
.switch input { display: none; }
.slider { width: 40px; height: 22px; border-radius: 999px; background: #d1d5db; position: relative; transition: 0.2s; }
.slider::after { content: ''; position: absolute; top: 3px; inset-inline-start: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: 0.2s; }
.switch input:checked + .slider { background: #16a34a; }
.switch input:checked + .slider::after { inset-inline-start: 21px; }
.switch-text { font-size: 0.8rem; font-weight: 700; color: #374151; }

.form-footer-btns { display: flex; gap: 0.6rem; justify-content: flex-end; margin-top: 0.5rem; }
.btn-cancel-form { padding: 0.65rem 1.1rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
.btn-cancel-form:hover { background: #f9fafb; }
.btn-submit-form { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.65rem 1.3rem; border-radius: 8px; border: none; background: #660033; color: #fff; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.btn-submit-form:hover:not(:disabled) { background: #4d0026; }
.btn-submit-form:disabled { opacity: 0.6; cursor: not-allowed; }

.delete-modal { max-width: 500px; padding: 1.5rem; }
.delete-modal h2 { margin: 0 0 0.5rem; color: #111827; font-size: 1.1rem; font-weight: 800; }
.delete-modal p { margin: 0; color: #6b7280; line-height: 1.7; font-size: 0.88rem; }
.delete-footer { display: flex; gap: 0.6rem; margin-top: 1.25rem; }
.btn-delete-confirm { background: #ef4444; color: #fff; border: none; padding: 0.65rem 1.1rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; }
.btn-delete-confirm:hover { background: #dc2626; }
.btn-delete-confirm:disabled, .btn-cancel-form:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.45); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }


@media (max-width: 768px) {
  .filters-card { flex-direction: column; align-items: stretch; }
  .role-filter { width: 100%; }
  .form-footer-btns { justify-content: stretch; }
  .form-footer-btns button { flex: 1; justify-content: center; }
}
</style>
