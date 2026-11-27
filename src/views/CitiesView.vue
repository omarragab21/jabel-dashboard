<template>
  <div class="loc-page" data-testid="cities-page">
    <!-- The list; the add / edit form below replaces it as a page of its own (/admin/cities/new, /admin/cities/:id/edit) -->
    <div v-show="!showForm" class="list-view" style="display: contents">
    <header class="loc-header">
      <div>
        <h1 class="loc-title page-title">{{ tx('المدن', 'Cities') }}</h1>
        <p class="loc-subtitle page-subtitle">{{ tx('مدن التوصيل المتاحة في المتجر. كل مدينة تحتوي على مناطق توصيل، والفروع تُربط بمدينة ومنطقة.', 'The delivery cities of the store. Each city has delivery areas, and branches belong to a city and an area.') }}</p>
      </div>
      <div class="loc-header-actions">
        <button type="button" class="loc-btn loc-btn-ghost" :disabled="loading" data-testid="cities-refresh" @click="load">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ tx('تحديث', 'Refresh') }}
        </button>
        <button type="button" class="loc-btn loc-btn-primary" data-testid="city-add" @click="openCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          {{ tx('إضافة مدينة', 'Add city') }}
        </button>
      </div>
    </header>

    <section class="loc-stats" aria-label="stats">
      <div class="loc-stat"><span class="loc-stat-icon is-brand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg></span><div><div class="loc-stat-label">{{ tx('إجمالي المدن', 'Total cities') }}</div><div class="loc-stat-value" data-testid="cities-total">{{ stats.total }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-ok"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></span><div><div class="loc-stat-label">{{ tx('مدن نشطة', 'Active') }}</div><div class="loc-stat-value" data-testid="cities-active">{{ stats.active }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-off"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg></span><div><div class="loc-stat-label">{{ tx('مدن متوقفة', 'Inactive') }}</div><div class="loc-stat-value" data-testid="cities-inactive">{{ stats.inactive }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-info"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><div><div class="loc-stat-label">{{ tx('مناطق التوصيل', 'Delivery areas') }}</div><div class="loc-stat-value" data-testid="cities-areas-total">{{ areas.length }}</div></div></div>
    </section>

    <div class="loc-toolbar">
      <ColumnPicker table-key="cities" class="toolbar-columns" />
      <label class="loc-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model.trim="query" class="loc-input" type="search" :placeholder="tx('ابحث باسم المدينة (عربي أو إنجليزي)...', 'Search by city name (Arabic or English)...')" data-testid="cities-search" />
      </label>
      <select v-model="status" class="loc-select" data-testid="cities-status-filter" :aria-label="tx('الحالة', 'Status')">
        <option value="">{{ tx('كل الحالات', 'All statuses') }}</option>
        <option value="active">{{ tx('نشطة', 'Active') }}</option>
        <option value="inactive">{{ tx('متوقفة', 'Inactive') }}</option>
      </select>
      <button v-if="hasFilters" type="button" class="loc-btn loc-btn-ghost" data-testid="cities-clear-filters" @click="clearFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
    </div>

    <div class="loc-card">
      <div v-if="loadError" class="loc-state is-error" data-testid="cities-error">
        <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></span>
        <div class="loc-state-title">{{ tx('تعذر تحميل المدن', 'Could not load the cities') }}</div>
        <div class="loc-state-text">{{ loadError }}</div>
        <button type="button" class="loc-btn loc-btn-primary" @click="load">{{ tx('إعادة المحاولة', 'Try again') }}</button>
      </div>

      <div v-else class="loc-table-wrap">
        <table class="loc-table" data-col-key="cities" :data-bulk-table="bulk.tableId" data-testid="cities-table">
          <thead>
            <tr>
              <th class="bulk-col"><input type="checkbox" class="bulk-check" :checked="bulk.allSelected" :indeterminate="bulk.someSelected" :disabled="!visibleRows.length" :aria-label="tx('تحديد الكل', 'Select all')" data-testid="bulk-all" @change="bulk.toggleAll()" /></th>
              <th>{{ tx('المدينة', 'City') }}</th>
              <th>{{ tx('الوصف', 'Description') }}</th>
              <th>{{ tx('المناطق', 'Areas') }}</th>
              <th>{{ tx('الحالة', 'Status') }}</th>
              <th class="loc-th-actions">{{ tx('الإجراءات', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody v-if="loading && !cities.length">
            <tr v-for="n in 5" :key="n" class="loc-skeleton"><td v-for="c in 6" :key="c"><span /></td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="city in visibleRows" :key="city.id" :class="{ 'is-selected': bulk.isSelected(city.id), 'is-off': !city.is_active }" :data-bulk-id="city.id" :data-testid="`city-row-${city.id}`">
              <td class="bulk-col" @click.stop><input type="checkbox" class="bulk-check" :checked="bulk.isSelected(city.id)" :aria-label="tx('تحديد', 'Select')" data-testid="bulk-row" @click="bulk.toggle(city.id, $event)" /></td>
              <td>
                <span class="loc-name">{{ nameOf(city) }}</span>
                <span v-if="otherName(city)" class="loc-name-sub">{{ otherName(city) }}</span>
              </td>
              <td><div class="loc-desc" :title="descriptionOf(city)">{{ descriptionOf(city) || '—' }}</div></td>
              <td>
                <button type="button" class="loc-chip" :class="{ 'is-neutral': !areaCount(city) }" :data-testid="`city-areas-${city.id}`" :title="tx('عرض مناطق المدينة', 'Show the areas of this city')" @click="openAreas(city)">
                  {{ areaCountLabel(areaCount(city)) }}
                </button>
              </td>
              <td>
                <label class="loc-switch" :class="{ 'is-busy': isPending(city.id) }" :data-testid="`city-toggle-${city.id}`">
                  <input type="checkbox" :checked="city.is_active" :disabled="isPending(city.id)" :aria-label="tx('تفعيل المدينة', 'City active')" @change="toggle(city)" />
                  <span class="loc-switch-track" aria-hidden="true"></span>
                  <span class="loc-switch-text" :class="city.is_active ? 'is-on' : 'is-off'">{{ city.is_active ? tx('نشطة', 'Active') : tx('متوقفة', 'Inactive') }}</span>
                </label>
              </td>
              <td>
                <div class="loc-actions">
                  <button type="button" class="loc-icon-btn" :title="tx('إضافة منطقة لهذه المدينة', 'Add an area to this city')" :data-testid="`city-add-area-${city.id}`" @click="addAreaTo(city)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0"/><path d="M18 15v6M15 18h6"/></svg>
                  </button>
                  <button type="button" class="loc-icon-btn" :title="tx('تعديل', 'Edit')" :data-testid="`city-edit-${city.id}`" @click="openEdit(city)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button type="button" class="loc-icon-btn is-danger" :title="tx('حذف', 'Delete')" :disabled="deletingId === city.id" :data-testid="`city-delete-${city.id}`" @click="remove(city)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !visibleRows.length">
              <td colspan="6">
                <div class="loc-state" data-testid="cities-empty">
                  <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14"/></svg></span>
                  <template v-if="cities.length">
                    <div class="loc-state-title">{{ tx('لا توجد نتائج', 'No matching cities') }}</div>
                    <div class="loc-state-text">{{ tx('غيّر كلمة البحث أو الفلاتر.', 'Change the search or the filters.') }}</div>
                    <button type="button" class="loc-btn loc-btn-ghost" @click="clearFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
                  </template>
                  <template v-else>
                    <div class="loc-state-title">{{ tx('لا توجد مدن بعد', 'No cities yet') }}</div>
                    <div class="loc-state-text">{{ tx('أضف أول مدينة توصيل، ثم أضف مناطقها.', 'Add the first delivery city, then its areas.') }}</div>
                    <button type="button" class="loc-btn loc-btn-primary" @click="openCreate">{{ tx('إضافة مدينة', 'Add city') }}</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BulkActionBar :bulk="bulk" :actions="bulkActions" file-name="cities" :label-of="nameOf" />
    </div><!-- /list-view -->

    <!-- Add / edit -->
    <!-- Add / edit page -->
    <EditorPage
      v-if="showForm"
      testid="city-editor"
      :back-label="tx('المدن', 'Cities')"
      :title="editing ? tx('تعديل المدينة', 'Edit city') : tx('إضافة مدينة', 'Add city')"
      :subtitle="tx('الاسم مطلوب بالعربي والإنجليزي.', 'The name is required in Arabic and English.')"
      @back="closeForm"
    >
      <form class="loc-editor" data-testid="city-form" novalidate @submit.prevent="submit">
        <div class="loc-dialog-body">
          <div v-if="formError" class="loc-banner" role="alert" data-testid="city-form-error">{{ formError }}</div>

          <BilingualField class="loc-field" required :ar="form.name_ar" :en="form.name_en" :invalid-ar="!!fieldError('name_ar')" :invalid-en="!!fieldError('name_en')" testid="city-name">
            <template #label="{ lang }"><label class="loc-label" :for="`city-name-${lang}`">{{ tx('اسم المدينة', 'City name') }} <span class="loc-req">*</span></label></template>
            <template #default="{ lang }">
              <input v-show="lang === 'ar'" id="city-name-ar" v-model="form.name_ar" class="loc-input" :class="{ 'is-invalid': fieldError('name_ar') }" dir="rtl" maxlength="255" :placeholder="tx('مثال: عمّان', 'e.g. عمّان')" data-testid="city-name-ar" />
              <input v-show="lang === 'en'" id="city-name-en" v-model="form.name_en" class="loc-input" :class="{ 'is-invalid': fieldError('name_en') }" dir="ltr" maxlength="255" placeholder="e.g. Amman" data-testid="city-name-en" />
            </template>
          </BilingualField>
          <p v-if="fieldError('name_ar')" class="loc-error" data-testid="city-name-ar-error">{{ fieldError('name_ar') }}</p>
          <p v-if="fieldError('name_en')" class="loc-error" data-testid="city-name-en-error">{{ fieldError('name_en') }}</p>

          <BilingualField class="loc-field" :ar="form.description_ar" :en="form.description_en" :invalid-en="!!fieldError('description_en')" testid="city-description">
            <template #label="{ lang }"><label class="loc-label" :for="`city-description-${lang}`">{{ tx('الوصف (اختياري)', 'Description (optional)') }}</label></template>
            <template #default="{ lang }">
              <textarea v-show="lang === 'ar'" id="city-description-ar" v-model="form.description_ar" class="loc-textarea" dir="rtl" rows="3" data-testid="city-description-ar"></textarea>
              <textarea v-show="lang === 'en'" id="city-description-en" v-model="form.description_en" class="loc-textarea" dir="ltr" rows="3" data-testid="city-description-en"></textarea>
            </template>
          </BilingualField>
          <p v-if="fieldError('description_en')" class="loc-error">{{ fieldError('description_en') }}</p>

          <label class="loc-switch" data-testid="city-active">
            <input v-model="form.is_active" type="checkbox" />
            <span class="loc-switch-track" aria-hidden="true"></span>
            <span class="loc-switch-text" :class="form.is_active ? 'is-on' : 'is-off'">{{ form.is_active ? tx('المدينة نشطة ويظهر التوصيل لها', 'Active: delivery to this city is offered') : tx('المدينة متوقفة', 'Inactive') }}</span>
          </label>
        </div>
        <div class="loc-dialog-foot">
          <button type="button" class="loc-btn loc-btn-ghost" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="submit" class="loc-btn loc-btn-primary" :disabled="saving" data-testid="city-submit">{{ saving ? tx('جاري الحفظ...', 'Saving...') : (editing ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة المدينة', 'Add city')) }}</button>
        </div>
      </form>
    </EditorPage>

    <div class="alert-toast" :class="[toast.type, { show: toast.show }]" role="status" data-testid="cities-toast">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import EditorPage from '../components/EditorPage.vue';
import { useEditorRoute } from '../composables/useEditorRoute';
import '../assets/locations.css';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BulkActionBar from '../components/BulkActionBar.vue';
import ColumnPicker from '../components/ColumnPicker.vue';
import BilingualField from '../components/BilingualField.vue';
import { useBulkSelection } from '../composables/useBulkSelection';
import { provideBilingualForm } from '../composables/useBilingualForm';
import { serverFieldErrors, useLocationPage } from '../composables/useLocationPage';
import locationService from '../application/locationService';
import {
  cityFormFrom, countByCity, countLabel, emptyCityForm, filterLocations, localizedDescription, localizedName,
  locationStats, sortByName, validateCityForm,
} from '../domain/locations';

const router = useRouter();
const bilingual = provideBilingualForm();
const { tx, locale, toast, notify, errorText, isPending, toggleRow, confirmDelete, fieldMessage } = useLocationPage();

const cities = ref([]);
const areas = ref([]);
const branches = ref([]);
const loading = ref(false);
const loadError = ref('');
const query = ref('');
const status = ref('');

const lang = computed(() => (locale.value === 'en' ? 'en' : 'ar'));
const nameOf = (item) => localizedName(item, lang.value);
const otherName = (item) => {
  const other = item?.translations?.[lang.value === 'en' ? 'ar' : 'en']?.name || '';
  return other && other !== nameOf(item) ? other : '';
};
const descriptionOf = (item) => localizedDescription(item, lang.value);

const areaCounts = computed(() => countByCity(areas.value));
const areaCount = (city) => (areas.value.length || !Array.isArray(city.areas) ? (areaCounts.value[city.id] || 0) : city.areas.length);
const branchCounts = computed(() => countByCity(branches.value));
const areaCountLabel = (count) => countLabel(count, 'area', lang.value);

// The API deletes a city together with its areas and their branches (checked on the stage server),
// so the confirmation names everything that goes with it.
const deleteWarning = (rows) => {
  const areaTotal = rows.reduce((sum, city) => sum + areaCount(city), 0);
  const branchTotal = rows.reduce((sum, city) => sum + (branchCounts.value[city.id] || 0), 0);
  const subject = rows.length === 1 ? tx(`المدينة «${nameOf(rows[0])}»`, `“${nameOf(rows[0])}”`) : tx(`${rows.length} مدن`, `${rows.length} cities`);
  if (!areaTotal && !branchTotal) return tx(`سيتم حذف ${subject} نهائيًا.`, `${subject} will be deleted permanently.`);
  return tx(
    `سيتم حذف ${subject} نهائيًا، وسيُحذف معها أيضًا: ${countLabel(areaTotal, 'area')} و${countLabel(branchTotal, 'branch')}. لا يمكن التراجع عن ذلك.`,
    `${subject} will be deleted permanently together with ${countLabel(areaTotal, 'area', 'en')} and ${countLabel(branchTotal, 'branch', 'en')}. This cannot be undone.`,
  );
};
const visibleRows = computed(() => sortByName(filterLocations(cities.value, { query: query.value, status: status.value }), lang.value));
const stats = computed(() => locationStats(cities.value));
const hasFilters = computed(() => Boolean(query.value || status.value));
const clearFilters = () => { query.value = ''; status.value = ''; };

const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const [cityList, areaList, branchList] = await Promise.all([
      locationService.listCities(),
      // Areas and branches only feed the counts: a failure there must not hide the cities.
      locationService.listAreas().catch(() => null),
      locationService.listBranches().catch(() => null),
    ]);
    cities.value = cityList;
    if (areaList) areas.value = areaList;
    if (branchList) branches.value = branchList;
  } catch (error) {
    loadError.value = errorText(error);
  } finally {
    loading.value = false;
  }
};
onMounted(load);

const openAreas = (city) => router.push({ path: '/admin/areas', query: { city: city.id } });
const addAreaTo = (city) => router.push({ path: '/admin/areas/new', query: { city: city.id } });

// ---- Form
const showForm = ref(false);
const editing = ref(null);
const form = ref(emptyCityForm());
const errors = ref({});
const serverErrors = ref({});
const formError = ref('');
const saving = ref(false);

const fieldError = (field) => fieldMessage(field, errors.value, serverErrors.value);

const resetFormState = () => { errors.value = {}; serverErrors.value = {}; formError.value = ''; bilingual.reset?.(); };
const openCreate = () => { editing.value = null; form.value = emptyCityForm(); resetFormState(); showForm.value = true; };
const openEdit = (city) => { editing.value = city; form.value = cityFormFrom(city); resetFormState(); showForm.value = true; };
const closeForm = () => { if (!saving.value) showForm.value = false; };

// The form has its own address: /admin/cities/new and /admin/cities/:id/edit.
useEditorRoute({
  base: '/admin/cities',
  isOpen: showForm,
  editId: () => editing.value?.id,
  openAdd: () => openCreate(),
  openEdit,
  close: () => { showForm.value = false; },
  findItem: async (id) => {
    if (!cities.value.length) await load();
    return cities.value.find((city) => String(city.id) === id) || null;
  },
  notFound: () => notify(tx('المدينة غير موجودة', 'City not found'), 'error'),
});

const submit = async () => {
  if (saving.value) return;
  serverErrors.value = {};
  formError.value = '';
  errors.value = validateCityForm(form.value);
  if (Object.keys(errors.value).length) {
    bilingual.reveal?.();
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      const saved = await locationService.updateCity(editing.value.id, form.value);
      cities.value = cities.value.map((city) => (city.id === editing.value.id ? { ...city, ...(saved || {}), ...(saved ? {} : { is_active: form.value.is_active }) } : city));
      notify(tx('تم تحديث المدينة', 'City updated'));
    } else {
      const created = await locationService.createCity(form.value);
      if (created) cities.value = [...cities.value, created];
      notify(tx('تمت إضافة المدينة', 'City added'));
    }
    showForm.value = false;
    load();
  } catch (error) {
    serverErrors.value = serverFieldErrors(error);
    // Field problems are shown under each field; the banner only says to look at them.
    formError.value = Object.keys(serverErrors.value).length
      ? tx('راجع الحقول المظللة بالأحمر.', 'Check the fields marked in red.')
      : errorText(error, tx('تعذر حفظ المدينة', 'Could not save the city'));
    if (Object.keys(serverErrors.value).length) bilingual.reveal?.();
  } finally {
    saving.value = false;
  }
};

// ---- Status / delete
const toggle = (city) => toggleRow(city, locationService.toggleCity);

const deletingId = ref(null);
const remove = async (city) => {
  if (!(await confirmDelete(deleteWarning([city])))) return;
  deletingId.value = city.id;
  try {
    await locationService.deleteCity(city.id);
    cities.value = cities.value.filter((item) => item.id !== city.id);
    bulk.deselect?.([city.id]);
    notify(tx('تم حذف المدينة', 'City deleted'));
    load();
  } catch (error) {
    notify(errorText(error, tx('تعذر حذف المدينة', 'Could not delete the city')), 'error');
  } finally {
    deletingId.value = null;
  }
};

// ---- Bulk
const bulk = useBulkSelection(() => visibleRows.value);
const bulkActions = computed(() => [
  { key: 'activate', label: tx('تفعيل', 'Activate'), icon: 'check', applies: (c) => !c.is_active,
    each: async (c) => { c.is_active = await locationService.toggleCity(c.id, false); }, done: load, success: (n) => tx(`تم تفعيل ${n} مدينة`, `${n} cities activated`) },
  { key: 'deactivate', label: tx('إيقاف', 'Deactivate'), icon: 'ban', applies: (c) => c.is_active,
    each: async (c) => { c.is_active = await locationService.toggleCity(c.id, true); }, done: load, success: (n) => tx(`تم إيقاف ${n} مدينة`, `${n} cities deactivated`) },
  { key: 'delete', label: tx('حذف', 'Delete'), icon: 'trash', tone: 'danger',
    confirm: (rows) => deleteWarning(rows),
    each: (c) => locationService.deleteCity(c.id), done: load, success: (n) => tx(`تم حذف ${n} مدينة`, `${n} cities deleted`) },
]);
</script>
