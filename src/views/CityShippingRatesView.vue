<template>
  <div class="shipping-rates-view">
    <div class="page-header">
      <h1 class="page-title">{{ tx('أسعار الشحن حسب المدينة', 'City Shipping Rates') }}</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="openBulkUpdate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          {{ tx('تعديل جماعي', 'Bulk Update') }}
        </button>
      </div>
    </div>

    <div class="filters">
      <select v-model="selectedCountry" @change="fetchRates">
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
            <th>{{ tx('المدينة', 'City') }}</th>
            <th>{{ tx('الدولة', 'Country') }}</th>
            <th>{{ tx('سعر الشحن', 'Shipping Cost') }}</th>
            <th>{{ tx('الحالة', 'Status') }}</th>
            <th>{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rate in rates" :key="rate.id">
            <td>{{ localizedName(rate.city) }}</td>
            <td>{{ localizedName(rate.city?.country) }}</td>
            <td>{{ rate.shipping_cost + ' ' + currency }}</td>
            <td>
              <span class="status-badge" :class="rate.is_active ? 'active' : 'inactive'">
                {{ rate.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="editRate(rate)" :title="tx('تعديل', 'Edit')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon delete" @click="deleteRate(rate.id)" :title="tx('حذف', 'Delete')">
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

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h2>{{ tx('تعديل سعر الشحن', 'Edit Shipping Rate') }}</h2>
        <form @submit.prevent="handleEditSubmit">
          <div class="form-group">
            <label>{{ tx('المدينة', 'City') }}</label>
            <input :value="editingRate?.city?.name" disabled />
          </div>
          <div class="form-group">
            <label>{{ tx('سعر الشحن', 'Shipping Cost') }} *</label>
            <input v-model="editForm.shipping_cost" type="number" step="0.01" required />
          </div>
          <div class="form-group checkbox">
            <label>
              <input v-model="editForm.is_active" type="checkbox" />
              {{ tx('نشط', 'Active') }}
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showEditModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-primary">{{ tx('حفظ', 'Save') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk Update Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click.self="showBulkModal = false">
      <div class="modal-content bulk-modal">
        <h2>{{ tx('تعديل جماعي للأسعار', 'Bulk Update Shipping Rates') }}</h2>
        <div class="bulk-options">
          <div class="option-card" @click="bulkOption = 'all'">
            <input type="radio" v-model="bulkOption" value="all" />
            <label>{{ tx('سعر ثابت لكل المدن', 'One fixed rate for all cities') }}</label>
          </div>
          <div class="option-card" @click="bulkOption = 'individual'">
            <input type="radio" v-model="bulkOption" value="individual" />
            <label>{{ tx('أسعار خاصة لكل مدينة', 'Custom rates per city') }}</label>
          </div>
        </div>
        
        <div v-if="bulkOption === 'all'" class="bulk-form">
          <div class="form-group">
            <label>{{ tx('السعر الموحد', 'Uniform Rate') }} *</label>
            <input v-model="bulkForm.uniform_rate" type="number" step="0.01" />
          </div>
        </div>
        
        <div v-if="bulkOption === 'individual'" class="bulk-list">
          <div v-for="city in cities" :key="city.id" class="bulk-item">
            <label>{{ city.name }}</label>
            <input 
              v-model="bulkForm.rates[city.id]" 
              type="number" 
              step="0.01" 
              :placeholder="city.shipping_rate?.shipping_cost || 0"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showBulkModal = false">{{ tx('إلغاء', 'Cancel') }}</button>
          <button class="btn-primary" @click="handleBulkSubmit">{{ tx('حفظ التغييرات', 'Save Changes') }}</button>
        </div>
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

const rates = ref([]);
const cities = ref([]);
const countries = ref([]);
const selectedCountry = ref('');
const showEditModal = ref(false);
const showBulkModal = ref(false);
const bulkOption = ref('all');
const currency = ref('JOD');
const editingRate = ref(null);
const editForm = ref({
  shipping_cost: 0,
  is_active: true,
});
const bulkForm = ref({
  uniform_rate: 0,
  rates: {},
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

const fetchRates = async () => {
  try {
    const params = selectedCountry.value ? { country_id: selectedCountry.value } : {};
    const res = await api.get('/dashboard/city-shipping-rates', { params });
    rates.value = res.data.data;
  } catch (error) {
    console.error('Failed to fetch rates', error);
  }
};

const editRate = (rate) => {
  editingRate.value = rate;
  editForm.value = {
    shipping_cost: rate.shipping_cost,
    is_active: rate.is_active,
  };
  showEditModal.value = true;
};

const handleEditSubmit = async () => {
  try {
    await api.put(`/dashboard/city-shipping-rates/${editingRate.value.id}`, editForm.value);
    showEditModal.value = false;
    fetchRates();
  } catch (error) {
    console.error('Failed to update rate', error);
  }
};

const deleteRate = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا السعر؟')) return;
  try {
    await api.delete(`/dashboard/city-shipping-rates/${id}`);
    fetchRates();
  } catch (error) {
    console.error('Failed to delete rate', error);
  }
};

const openBulkUpdate = async () => {
  await fetchCities();
  bulkForm.value.rates = {};
  cities.value.forEach(city => {
    bulkForm.value.rates[city.id] = city.shipping_rate?.shipping_cost || 0;
  });
  showBulkModal.value = true;
};

const handleBulkSubmit = async () => {
  try {
    if (bulkOption.value === 'all') {
      // Apply uniform rate to all cities
      const ratesData = cities.value.map(city => ({
        city_id: city.id,
        shipping_cost: bulkForm.value.uniform_rate,
        is_active: true,
      }));
      await api.post('/dashboard/city-shipping-rates/bulk-update', { rates: ratesData });
    } else {
      // Apply individual rates
      const ratesData = cities.value.map(city => ({
        city_id: city.id,
        shipping_cost: bulkForm.value.rates[city.id] || 0,
        is_active: true,
      }));
      await api.post('/dashboard/city-shipping-rates/bulk-update', { rates: ratesData });
    }
    showBulkModal.value = false;
    fetchRates();
  } catch (error) {
    console.error('Failed to bulk update rates', error);
  }
};

onMounted(() => {
  fetchCountries();
  fetchRates();
});
</script>

<style scoped>
.shipping-rates-view {
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

.header-actions {
  display: flex;
  gap: 1rem;
}

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
  display: flex;
  align-items: center;
  gap: 8px;
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

.modal-content.bulk-modal {
  max-width: 700px;
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
.form-group input[disabled] {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input[disabled] {
  background: #f3f4f6;
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

.bulk-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.option-card {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.option-card:hover {
  border-color: #660033;
}

.option-card label {
  display: block;
  margin-top: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.option-card input {
  margin-right: 0.5rem;
}

.bulk-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.bulk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.bulk-item label {
  font-weight: 600;
}

.bulk-item input {
  width: 120px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
</style>
