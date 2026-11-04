<template>
  <div class="cities-view">
    <div class="page-header">
      <h1 class="page-title">{{ tx('إدارة المدن', 'City Management') }}</h1>
      <button class="add-btn" @click="showModal = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة مدينة', 'Add City') }}
      </button>
    </div>

    <div class="filters">
      <select v-model="selectedCountry" @change="fetchCities">
        <option value="">{{ tx('كل الدول', 'All Countries') }}</option>
        <option v-for="country in countries" :key="country.id" :value="country.id">
          {{ country.name }}
        </option>
      </select>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ tx('الاسم', 'Name') }}</th>
            <th>{{ tx('الدولة', 'Country') }}</th>
            <th>{{ tx('سعر الشحن', 'Shipping Cost') }}</th>
            <th>{{ tx('الحالة', 'Status') }}</th>
            <th>{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="city in cities" :key="city.id">
            <td>{{ localizedName(city) }}</td>
            <td>{{ localizedName(city.country) }}</td>
            <td>{{ city.shipping_rate?.shipping_cost ? city.shipping_rate.shipping_cost + ' ' + currency : '-' }}</td>
            <td>
              <span class="status-badge" :class="city.is_active ? 'active' : 'inactive'">
                {{ city.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="editCity(city)" :title="tx('تعديل', 'Edit')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon delete" @click="deleteCity(city.id)" :title="tx('حذف', 'Delete')">
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

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h2>{{ isEdit ? tx('تعديل مدينة', 'Edit City') : tx('إضافة مدينة', 'Add City') }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>{{ tx('الدولة', 'Country') }} *</label>
            <select v-model="form.country_id" required>
              <option value="">{{ tx('اختر الدولة', 'Select Country') }}</option>
              <option v-for="country in countries" :key="country.id" :value="country.id">
                {{ localizedName(country) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ tx('الاسم', 'Name') }} *</label>
            <input v-model="form.name" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ tx('الاسم بالإنجليزي', 'English Name') }}</label>
            <input v-model="form.name_en" type="text" />
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
            <button type="button" class="btn-secondary" @click="showModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-primary">{{ tx('حفظ', 'Save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../config/axios';
import { useAdminText } from '../composables/useAdminText';

const { tx, locale } = useAdminText();
const localizedName = (item) => item?.name_i18n?.[locale.value] || (locale.value === 'en' ? item?.name_en || item?.name : item?.name || item?.name_en);

const cities = ref([]);
const countries = ref([]);
const selectedCountry = ref('');
const showModal = ref(false);
const isEdit = ref(false);
const editingId = ref(null);
const currency = ref('JOD');
const form = ref({
  country_id: '',
  name: '',
  name_en: '',
  is_active: true,
  sort_order: 0,
});

const fetchCountries = async () => {
  try {
    const res = await api.get('/dashboard/countries');
    countries.value = res.data.data;
  } catch (error) {
    console.error('Failed to fetch countries', error);
  }
};

const fetchCities = async () => {
  try {
    const params = selectedCountry.value ? { country_id: selectedCountry.value } : {};
    const res = await api.get('/dashboard/cities', { params });
    cities.value = res.data.data;
  } catch (error) {
    console.error('Failed to fetch cities', error);
  }
};

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await api.put(`/dashboard/cities/${editingId.value}`, form.value);
    } else {
      await api.post('/dashboard/cities', form.value);
    }
    showModal.value = false;
    resetForm();
    fetchCities();
  } catch (error) {
    console.error('Failed to save city', error);
  }
};

const editCity = (city) => {
  isEdit.value = true;
  editingId.value = city.id;
  form.value = { ...city };
  showModal.value = true;
};

const deleteCity = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذه المدينة؟')) return;
  try {
    await api.delete(`/dashboard/cities/${id}`);
    fetchCities();
  } catch (error) {
    console.error('Failed to delete city', error);
  }
};

const resetForm = () => {
  form.value = {
    country_id: '',
    name: '',
    name_en: '',
    is_active: true,
    sort_order: 0,
  };
  isEdit.value = false;
  editingId.value = null;
};

onMounted(() => {
  fetchCountries();
  fetchCities();
});
</script>

<style scoped>
.cities-view {
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

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.filters {
  margin-bottom: 1.5rem;
}

.filters select {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 200px;
  font-size: 1rem;
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
.form-group input[type="number"],
.form-group select {
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
