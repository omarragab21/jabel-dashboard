<template>
  <div class="countries-view">
    <!-- The list; the add / edit form below replaces it as a page of its own (/admin/countries/new, /admin/countries/:id/edit) -->
    <div v-show="!showModal" class="list-view">
    <div class="page-header">
      <h1 class="page-title">{{ tx('إدارة الدول', 'Country Management') }}</h1>
      <div class="header-actions">
        <button v-if="!countries.length" class="add-btn" @click="openAdd">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ tx('إضافة دولة', 'Add Country') }}
        </button>
      </div>
    </div>

    <div class="col-toolbar"><ColumnPicker table-key="countries" /></div>
    <div class="table-container">
      <table class="data-table" data-col-key="countries" :data-bulk-table="bulk.tableId">
        <thead>
          <tr>
            <th class="bulk-col"><input type="checkbox" class="bulk-check" :checked="bulk.allSelected" :indeterminate="bulk.someSelected" :aria-label="tx('تحديد الكل', 'Select all')" data-testid="bulk-all" @change="bulk.toggleAll()" /></th>
            <th>{{ tx('العلم', 'Flag') }}</th>
            <th>{{ tx('الاسم', 'Name') }}</th>
            <th>{{ tx('الكود', 'Code') }}</th>
            <th>{{ tx('المدن', 'Cities') }}</th>
            <th>{{ tx('الحالة', 'Status') }}</th>
            <th>{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="country in countries" :key="country.id" :class="{ 'is-selected': bulk.isSelected(country.id) }" :data-bulk-id="country.id">
            <td class="bulk-col" @click.stop><input type="checkbox" class="bulk-check" :checked="bulk.isSelected(country.id)" :aria-label="tx('تحديد', 'Select')" data-testid="bulk-row" @click="bulk.toggle(country.id, $event)" /></td>
            <td>{{ country.flag || '-' }}</td>
            <td>{{ localizedName(country) }}</td>
            <td>{{ country.code }}</td>
            <td>{{ country.cities?.length || 0 }}</td>
            <td>
              <span class="status-badge" :class="country.is_active ? 'active' : 'inactive'">
                {{ country.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="editCountry(country)" :title="tx('تعديل', 'Edit')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon delete" @click="deleteCountry(country.id)" :title="tx('حذف', 'Delete')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <BulkActionBar :bulk="bulk" :actions="bulkActions" file-name="countries" />
    </div><!-- /list-view -->

    <!-- Add / edit page -->
    <EditorPage
      v-if="showModal"
      testid="country-editor"
      :back-label="tx('إدارة الدول', 'Country Management')"
      :title="isEdit ? tx('تعديل دولة', 'Edit Country') : tx('إضافة دولة', 'Add Country')"
      @back="closeForm"
    >
        <form @submit.prevent="handleSubmit">
          <!-- Arabic is required, English optional: a missing English name shows as a warning only. -->
          <BilingualField class="form-group" required="ar" :ar="form.name" :en="form.name_en" testid="country-name">
            <template #label="{ lang }">
              <label :for="`country-name-${lang}`">{{ tx('الاسم', 'Name') }} *</label>
            </template>
            <template #default="{ lang }">
              <input v-show="lang === 'ar'" id="country-name-ar" v-model="form.name" type="text" dir="rtl" data-testid="country-name-ar" />
              <input v-show="lang === 'en'" id="country-name-en" v-model="form.name_en" type="text" dir="ltr" data-testid="country-name-en" />
            </template>
          </BilingualField>
          <div class="form-group">
            <label>{{ tx('الكود', 'Code') }} *</label>
            <input v-model="form.code" type="text" required maxlength="5" />
          </div>
          <div class="form-group">
            <label>{{ tx('العلم (Emoji)', 'Flag (Emoji)') }}</label>
            <input v-model="form.flag" type="text" />
          </div>
          <div class="form-group">
            <label>{{ tx('الترتيب', 'Sort Order') }}</label>
            <input v-model="form.sort_order" type="number" />
          </div>
          <div class="form-group checkbox">
            <label>
              <input v-model="form.is_active" type="checkbox" />
              {{ tx('نشط', 'Active') }}
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-primary">{{ tx('حفظ', 'Save') }}</button>
          </div>
        </form>
    </EditorPage>
  </div>
</template>

<script setup>
import EditorPage from '../components/EditorPage.vue';
import { useEditorRoute } from '../composables/useEditorRoute';
import BulkActionBar from '../components/BulkActionBar.vue';
import { useBulkSelection } from '../composables/useBulkSelection';
import ColumnPicker from '../components/ColumnPicker.vue';
import { useDialog } from '../composables/useDialog';
import { ref, onMounted, computed } from 'vue';
const appDialog = useDialog();
import api from '../config/axios';
import { useAdminText } from '../composables/useAdminText';
import BilingualField from '../components/BilingualField.vue';
import { provideBilingualForm } from '../composables/useBilingualForm';
import { hasText } from '../utils/bilingualText';

const { tx, locale } = useAdminText();
// Each Arabic / English field has its own language switch (BilingualField); this reveals the missing one.
const bilingual = provideBilingualForm();
const localizedName = (item) => item?.name_i18n?.[locale.value] || (locale.value === 'en' ? item?.name_en || item?.name : item?.name || item?.name_en);

const countries = ref([]);
const showModal = ref(false);
const isEdit = ref(false);
const editingId = ref(null);
const form = ref({
  name: '',
  name_en: '',
  code: '',
  flag: '',
  is_active: true,
  sort_order: 0,
});

const isSaudi = (c) => String(c?.code || '').toUpperCase() === 'SA' || c?.name_en === 'Saudi Arabia' || c?.name === 'السعودية' || c?.name === 'المملكة العربية السعودية';

const openAdd = () => {
  resetForm();
  form.value = { ...form.value, name: 'السعودية', name_en: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' };
  showModal.value = true;
};

const fetchCountries = async () => {
  try {
    const res = await api.get('/dashboard/countries');
    // Shipping is Saudi Arabia only: other countries are never listed or edited here.
    countries.value = (res.data.data || []).filter(isSaudi);
  } catch (error) {
    console.error('Failed to fetch countries', error);
  }
};

const handleSubmit = async () => {
  // The Arabic name is required; its input may be hidden behind the English switch, so it is checked here.
  if (!hasText(form.value.name)) {
    bilingual.reveal();
    return;
  }
  try {
    if (isEdit.value) {
      await api.put(`/dashboard/countries/${editingId.value}`, form.value);
    } else {
      await api.post('/dashboard/countries', form.value);
    }
    showModal.value = false;
    resetForm();
    fetchCountries();
  } catch (error) {
    console.error('Failed to save country', error);
  }
};

const editCountry = (country) => {
  isEdit.value = true;
  editingId.value = country.id;
  form.value = { ...country };
  showModal.value = true;
};

const closeForm = () => { showModal.value = false; };

// The form has its own address: /admin/countries/new and /admin/countries/:id/edit.
useEditorRoute({
  base: '/admin/countries',
  isOpen: showModal,
  editId: () => (isEdit.value ? editingId.value : ''),
  openAdd: () => openAdd(),
  openEdit: editCountry,
  close: closeForm,
  findItem: async (id) => {
    if (!countries.value.length) await fetchCountries();
    return countries.value.find((country) => String(country.id) === id) || null;
  },
});

const deleteCountry = async (id) => {
  if (!(await appDialog.confirm('هل أنت متأكد من حذف هذه الدولة؟', { title: 'تأكيد الحذف', confirmText: 'حذف', cancelText: 'إلغاء' }))) return;
  try {
    await api.delete(`/dashboard/countries/${id}`);
    fetchCountries();
  } catch (error) {
    console.error('Failed to delete country', error);
  }
};

const resetForm = () => {
  form.value = {
    name: '',
    name_en: '',
    code: '',
    flag: '',
    is_active: true,
    sort_order: 0,
  };
  isEdit.value = false;
  editingId.value = null;
};

onMounted(fetchCountries);

// Bulk actions on the ticked rows (checkbox column + BulkActionBar)
const bulk = useBulkSelection(() => countries.value);
const bulkActions = computed(() => [
  { key: 'delete', label: tx('حذف', 'Delete'), icon: 'trash', tone: 'danger',
    confirm: (rows) => tx(`هتحذف ${rows.length} دولة. الحذف نهائي ولا يمكن التراجع عنه.`, `Delete ${rows.length} countries? This cannot be undone.`),
    each: (c) => api.delete(`/dashboard/countries/${c.id}`), done: fetchCountries, success: (n) => tx(`تم حذف ${n} دولة`, `${n} countries deleted`) },
]);
</script>

<style scoped>
.countries-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #111827;
}

.header-actions { display: flex; gap: 10px; align-items: center; }

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #660033;
  color: #fff;
  border: none;
  padding: 0.65rem 1.1rem;
  border-radius: 8px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover { background: #4d0026; }

.btn-primary {
  background: #660033;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 16px;
  text-align: right;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 700;
  color: #374151;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-icon.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 800;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group.checkbox input {
  width: auto;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
</style>
