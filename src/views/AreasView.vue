<template>
  <div class="loc-page" data-testid="areas-page">
    <!-- The list; the add / edit form below replaces it as a page of its own (/admin/areas/new, /admin/areas/:id/edit) -->
    <div v-show="!showForm" class="list-view" style="display: contents">
    <header class="loc-header">
      <div>
        <h1 class="loc-title page-title">{{ tx('مناطق التوصيل', 'Delivery areas') }}</h1>
        <p class="loc-subtitle page-subtitle">{{ tx('الأحياء والمناطق داخل كل مدينة. المنطقة المتوقفة لا يُعرض التوصيل لها.', 'The districts inside each city. Delivery is not offered to an inactive area.') }}</p>
      </div>
      <div class="loc-header-actions">
        <button type="button" class="loc-btn loc-btn-ghost" :disabled="loading" data-testid="areas-refresh" @click="load">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ tx('تحديث', 'Refresh') }}
        </button>
        <button type="button" class="loc-btn loc-btn-primary" :disabled="!cities.length && !loading" :title="!cities.length ? tx('أضف مدينة أولًا', 'Add a city first') : ''" data-testid="area-add" @click="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          {{ tx('إضافة منطقة', 'Add area') }}
        </button>
      </div>
    </header>

    <section class="loc-stats" aria-label="stats">
      <div class="loc-stat"><span class="loc-stat-icon is-brand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><div><div class="loc-stat-label">{{ cityFilter ? tx('مناطق المدينة', 'Areas in city') : tx('إجمالي المناطق', 'Total areas') }}</div><div class="loc-stat-value" data-testid="areas-total">{{ stats.total }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-ok"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></span><div><div class="loc-stat-label">{{ tx('نشطة', 'Active') }}</div><div class="loc-stat-value" data-testid="areas-active">{{ stats.active }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-off"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg></span><div><div class="loc-stat-label">{{ tx('متوقفة', 'Inactive') }}</div><div class="loc-stat-value" data-testid="areas-inactive">{{ stats.inactive }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-info"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14"/></svg></span><div><div class="loc-stat-label">{{ tx('المدن', 'Cities') }}</div><div class="loc-stat-value">{{ cities.length }}</div></div></div>
    </section>

    <div v-if="!loading && !loadError && !cities.length" class="loc-banner is-info" data-testid="areas-no-cities">
      {{ tx('لا توجد مدن بعد. كل منطقة لازم تتبع مدينة، فابدأ بإضافة مدينة.', 'There are no cities yet. Every area belongs to a city, so add a city first.') }}
      <router-link to="/admin/cities" class="loc-map-link">{{ tx('إدارة المدن', 'Manage cities') }}</router-link>
    </div>

    <div class="loc-toolbar">
      <ColumnPicker table-key="areas" class="toolbar-columns" />
      <label class="loc-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model.trim="query" class="loc-input" type="search" :placeholder="tx('ابحث باسم المنطقة أو المدينة...', 'Search by area or city name...')" data-testid="areas-search" />
      </label>
      <select v-model="cityFilter" class="loc-select" data-testid="areas-city-filter" :aria-label="tx('المدينة', 'City')">
        <option value="">{{ tx('كل المدن', 'All cities') }}</option>
        <option v-for="city in sortedCities" :key="city.id" :value="city.id">{{ cityLabel(city) }}</option>
      </select>
      <select v-model="status" class="loc-select" data-testid="areas-status-filter" :aria-label="tx('الحالة', 'Status')">
        <option value="">{{ tx('كل الحالات', 'All statuses') }}</option>
        <option value="active">{{ tx('نشطة', 'Active') }}</option>
        <option value="inactive">{{ tx('متوقفة', 'Inactive') }}</option>
      </select>
      <button v-if="hasFilters" type="button" class="loc-btn loc-btn-ghost" data-testid="areas-clear-filters" @click="clearFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
    </div>

    <div class="loc-card">
      <div v-if="loadError" class="loc-state is-error" data-testid="areas-error">
        <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></span>
        <div class="loc-state-title">{{ tx('تعذر تحميل المناطق', 'Could not load the areas') }}</div>
        <div class="loc-state-text">{{ loadError }}</div>
        <button type="button" class="loc-btn loc-btn-primary" @click="load">{{ tx('إعادة المحاولة', 'Try again') }}</button>
      </div>

      <div v-else class="loc-table-wrap">
        <table class="loc-table" data-col-key="areas" :data-bulk-table="bulk.tableId" data-testid="areas-table">
          <thead>
            <tr>
              <th class="bulk-col"><input type="checkbox" class="bulk-check" :checked="bulk.allSelected" :indeterminate="bulk.someSelected" :disabled="!visibleRows.length" :aria-label="tx('تحديد الكل', 'Select all')" data-testid="bulk-all" @change="bulk.toggleAll()" /></th>
              <th>{{ tx('المنطقة', 'Area') }}</th>
              <th>{{ tx('المدينة', 'City') }}</th>
              <th>{{ tx('الوصف', 'Description') }}</th>
              <th>{{ tx('الحالة', 'Status') }}</th>
              <th>{{ tx('الإجراءات', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody v-if="loading && !areas.length">
            <tr v-for="n in 5" :key="n" class="loc-skeleton"><td v-for="c in 6" :key="c"><span /></td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="area in visibleRows" :key="area.id" :class="{ 'is-selected': bulk.isSelected(area.id), 'is-off': !area.is_active }" :data-bulk-id="area.id" :data-testid="`area-row-${area.id}`">
              <td class="bulk-col" @click.stop><input type="checkbox" class="bulk-check" :checked="bulk.isSelected(area.id)" :aria-label="tx('تحديد', 'Select')" data-testid="bulk-row" @click="bulk.toggle(area.id, $event)" /></td>
              <td>
                <span class="loc-name">{{ nameOf(area) }}</span>
                <span v-if="otherName(area)" class="loc-name-sub">{{ otherName(area) }}</span>
              </td>
              <td>
                <button v-if="cityOf(area)" type="button" class="loc-chip" :class="{ 'is-warn': !cityOf(area).is_active }" :title="!cityOf(area).is_active ? tx('المدينة متوقفة', 'The city is inactive') : tx('فلترة بهذه المدينة', 'Filter by this city')" @click="cityFilter = area.city_id">
                  {{ nameOf(cityOf(area)) }}
                </button>
                <span v-else class="loc-muted">—</span>
              </td>
              <td><div class="loc-desc" :title="descriptionOf(area)">{{ descriptionOf(area) || '—' }}</div></td>
              <td>
                <label class="loc-switch" :class="{ 'is-busy': isPending(area.id) }" :data-testid="`area-toggle-${area.id}`">
                  <input type="checkbox" :checked="area.is_active" :disabled="isPending(area.id)" :aria-label="tx('تفعيل المنطقة', 'Area active')" @change="toggle(area)" />
                  <span class="loc-switch-track" aria-hidden="true"></span>
                  <span class="loc-switch-text" :class="area.is_active ? 'is-on' : 'is-off'">{{ area.is_active ? tx('نشطة', 'Active') : tx('متوقفة', 'Inactive') }}</span>
                </label>
              </td>
              <td>
                <div class="loc-actions">
                  <button type="button" class="loc-icon-btn" :title="tx('تعديل', 'Edit')" :data-testid="`area-edit-${area.id}`" @click="openEdit(area)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button type="button" class="loc-icon-btn is-danger" :title="tx('حذف', 'Delete')" :disabled="deletingId === area.id" :data-testid="`area-delete-${area.id}`" @click="remove(area)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !visibleRows.length">
              <td colspan="6">
                <div class="loc-state" data-testid="areas-empty">
                  <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/></svg></span>
                  <template v-if="areas.length && hasFilters">
                    <div class="loc-state-title">{{ tx('لا توجد نتائج', 'No matching areas') }}</div>
                    <div class="loc-state-text">{{ cityFilter ? tx('هذه المدينة ليس لها مناطق تطابق البحث.', 'This city has no areas matching the search.') : tx('غيّر كلمة البحث أو الفلاتر.', 'Change the search or the filters.') }}</div>
                    <div class="loc-header-actions">
                      <button type="button" class="loc-btn loc-btn-ghost" @click="clearFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
                      <button v-if="cityFilter" type="button" class="loc-btn loc-btn-primary" @click="openCreate(cityFilter)">{{ tx('إضافة منطقة لهذه المدينة', 'Add an area to this city') }}</button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="loc-state-title">{{ tx('لا توجد مناطق بعد', 'No areas yet') }}</div>
                    <div class="loc-state-text">{{ tx('أضف مناطق التوصيل داخل كل مدينة.', 'Add the delivery areas inside each city.') }}</div>
                    <button v-if="cities.length" type="button" class="loc-btn loc-btn-primary" @click="openCreate(cityFilter)">{{ tx('إضافة منطقة', 'Add area') }}</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BulkActionBar :bulk="bulk" :actions="bulkActions" file-name="areas" :label-of="nameOf" />
    </div><!-- /list-view -->

    <!-- Add / edit page -->
    <EditorPage
      v-if="showForm"
      testid="area-editor"
      :back-label="tx('المناطق', 'Areas')"
      :title="editing ? tx('تعديل المنطقة', 'Edit area') : tx('إضافة منطقة', 'Add area')"
      :subtitle="tx('اختر المدينة، ثم اكتب اسم المنطقة بالعربي والإنجليزي.', 'Pick the city, then write the area name in Arabic and English.')"
      @back="closeForm"
    >
      <form class="loc-editor" data-testid="area-form" novalidate @submit.prevent="submit">
        <div class="loc-dialog-body">
          <div v-if="formError" class="loc-banner" role="alert" data-testid="area-form-error">{{ formError }}</div>

          <div class="loc-field">
            <label class="loc-label" for="area-city">{{ tx('المدينة', 'City') }} <span class="loc-req">*</span></label>
            <select id="area-city" v-model="form.city_id" class="loc-select" :class="{ 'is-invalid': fieldError('city_id') }" data-testid="area-city">
              <option value="">{{ tx('اختر المدينة', 'Choose the city') }}</option>
              <option v-for="city in sortedCities" :key="city.id" :value="city.id">{{ cityLabel(city) }}</option>
            </select>
            <p v-if="fieldError('city_id')" class="loc-error" data-testid="area-city-error">{{ fieldError('city_id') }}</p>
          </div>

          <BilingualField class="loc-field" required :ar="form.name_ar" :en="form.name_en" :invalid-ar="!!fieldError('name_ar')" :invalid-en="!!fieldError('name_en')" testid="area-name">
            <template #label="{ lang }"><label class="loc-label" :for="`area-name-${lang}`">{{ tx('اسم المنطقة', 'Area name') }} <span class="loc-req">*</span></label></template>
            <template #default="{ lang }">
              <input v-show="lang === 'ar'" id="area-name-ar" v-model="form.name_ar" class="loc-input" :class="{ 'is-invalid': fieldError('name_ar') }" dir="rtl" maxlength="255" :placeholder="tx('مثال: حي العليا', 'e.g. حي العليا')" data-testid="area-name-ar" />
              <input v-show="lang === 'en'" id="area-name-en" v-model="form.name_en" class="loc-input" :class="{ 'is-invalid': fieldError('name_en') }" dir="ltr" maxlength="255" placeholder="e.g. Al Olaya" data-testid="area-name-en" />
            </template>
          </BilingualField>
          <p v-if="fieldError('name_ar')" class="loc-error" data-testid="area-name-ar-error">{{ fieldError('name_ar') }}</p>
          <p v-if="fieldError('name_en')" class="loc-error" data-testid="area-name-en-error">{{ fieldError('name_en') }}</p>

          <BilingualField class="loc-field" :ar="form.description_ar" :en="form.description_en" :invalid-en="!!fieldError('description_en')" testid="area-description">
            <template #label="{ lang }"><label class="loc-label" :for="`area-description-${lang}`">{{ tx('الوصف (اختياري)', 'Description (optional)') }}</label></template>
            <template #default="{ lang }">
              <textarea v-show="lang === 'ar'" id="area-description-ar" v-model="form.description_ar" class="loc-textarea" dir="rtl" rows="3" data-testid="area-description-ar"></textarea>
              <textarea v-show="lang === 'en'" id="area-description-en" v-model="form.description_en" class="loc-textarea" dir="ltr" rows="3" data-testid="area-description-en"></textarea>
            </template>
          </BilingualField>
          <p v-if="fieldError('description_en')" class="loc-error">{{ fieldError('description_en') }}</p>

          <label class="loc-switch" data-testid="area-active">
            <input v-model="form.is_active" type="checkbox" />
            <span class="loc-switch-track" aria-hidden="true"></span>
            <span class="loc-switch-text" :class="form.is_active ? 'is-on' : 'is-off'">{{ form.is_active ? tx('المنطقة نشطة', 'Active') : tx('المنطقة متوقفة', 'Inactive') }}</span>
          </label>
        </div>
        <div class="loc-dialog-foot">
          <button type="button" class="loc-btn loc-btn-ghost" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="submit" class="loc-btn loc-btn-primary" :disabled="saving" data-testid="area-submit">{{ saving ? tx('جاري الحفظ...', 'Saving...') : (editing ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة المنطقة', 'Add area')) }}</button>
        </div>
      </form>
    </EditorPage>

    <div class="alert-toast" :class="[toast.type, { show: toast.show }]" role="status" data-testid="areas-toast">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import EditorPage from '../components/EditorPage.vue';
import { useEditorRoute } from '../composables/useEditorRoute';
import '../assets/locations.css';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BulkActionBar from '../components/BulkActionBar.vue';
import ColumnPicker from '../components/ColumnPicker.vue';
import BilingualField from '../components/BilingualField.vue';
import { useBulkSelection } from '../composables/useBulkSelection';
import { provideBilingualForm } from '../composables/useBilingualForm';
import { serverFieldErrors, useLocationPage } from '../composables/useLocationPage';
import locationService from '../application/locationService';
import {
  areaFormFrom, countByArea, countLabel, emptyAreaForm, filterLocations, localizedDescription, localizedName, locationStats, sortByName,
  validateAreaForm,
} from '../domain/locations';

const route = useRoute();
const router = useRouter();
const bilingual = provideBilingualForm();
const { tx, locale, toast, notify, errorText, isPending, toggleRow, confirmDelete, fieldMessage } = useLocationPage();

const areas = ref([]);
const cities = ref([]);
const branches = ref([]);
const loading = ref(false);
const loadError = ref('');
const query = ref('');
const status = ref('');
// ?city=ID (from the Cities page) opens the list on that city.
const cityFilter = ref(Number(route.query.city) || '');

const lang = computed(() => (locale.value === 'en' ? 'en' : 'ar'));
const nameOf = (item) => localizedName(item, lang.value);
const otherName = (item) => {
  const other = item?.translations?.[lang.value === 'en' ? 'ar' : 'en']?.name || '';
  return other && other !== nameOf(item) ? other : '';
};
const descriptionOf = (item) => localizedDescription(item, lang.value);
const sortedCities = computed(() => sortByName(cities.value, lang.value));
const cityById = computed(() => Object.fromEntries(cities.value.map((city) => [city.id, city])));
// The cities list is the fresh source; the city nested in the area is the fallback.
const cityOf = (area) => cityById.value[area.city_id] || area.city || null;
const cityLabel = (city) => (city.is_active ? nameOf(city) : `${nameOf(city)} (${tx('متوقفة', 'inactive')})`);

const scoped = computed(() => filterLocations(areas.value, { cityId: cityFilter.value }));
const visibleRows = computed(() => sortByName(filterLocations(scoped.value, { query: query.value, status: status.value }), lang.value));
const stats = computed(() => locationStats(scoped.value));
const hasFilters = computed(() => Boolean(query.value || status.value || cityFilter.value));
const clearFilters = () => { query.value = ''; status.value = ''; cityFilter.value = ''; };

// Keep ?city= in the address so a refresh or a shared link keeps the filter.
watch(cityFilter, (value) => {
  const next = { ...route.query };
  if (value) next.city = String(value); else delete next.city;
  delete next.add;
  router.replace({ query: next });
});

const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const [areaList, cityList, branchList] = await Promise.all([
      locationService.listAreas(),
      locationService.listCities(),
      // Branches only feed the delete warning: a failure there must not hide the areas.
      locationService.listBranches().catch(() => null),
    ]);
    areas.value = areaList;
    cities.value = cityList;
    if (branchList) branches.value = branchList;
    if (cityFilter.value && !cityList.some((city) => city.id === Number(cityFilter.value))) cityFilter.value = '';
  } catch (error) {
    loadError.value = errorText(error);
  } finally {
    loading.value = false;
  }
};

// ---- Form
const showForm = ref(false);
const editing = ref(null);
const form = ref(emptyAreaForm());
const errors = ref({});
const serverErrors = ref({});
const formError = ref('');
const saving = ref(false);

const fieldError = (field) => fieldMessage(field, errors.value, serverErrors.value);

const resetFormState = () => { errors.value = {}; serverErrors.value = {}; formError.value = ''; bilingual.reset(); };
const openCreate = (cityId = '') => {
  editing.value = null;
  form.value = emptyAreaForm(cityId || cityFilter.value || (cities.value.length === 1 ? cities.value[0].id : ''));
  resetFormState();
  showForm.value = true;
};
const openEdit = (area) => { editing.value = area; form.value = areaFormFrom(area); resetFormState(); showForm.value = true; };
const closeForm = () => { if (!saving.value) showForm.value = false; };

onMounted(async () => {
  // Older links: ?add=1 (the "add area" button of a city) now means the add page, on that city.
  if (route.path === '/admin/areas' && route.query.add) {
    router.replace({ path: '/admin/areas/new', query: route.query.city ? { city: route.query.city } : {} });
  }
  await loadOnce();
});

// The form has its own address: /admin/areas/new (?city=<id> picks the city) and /admin/areas/:id/edit.
let loading$ = null;
const loadOnce = () => (cities.value.length ? null : (loading$ ||= load().finally(() => { loading$ = null; })));
useEditorRoute({
  base: '/admin/areas',
  isOpen: showForm,
  editId: () => editing.value?.id,
  addQuery: () => ({ city: form.value.city_id }),
  openAdd: async (q = {}) => { await loadOnce(); openCreate(Number(q.city) || ''); },
  openEdit,
  close: () => { showForm.value = false; },
  findItem: async (id) => {
    await loadOnce();
    return areas.value.find((area) => String(area.id) === id) || null;
  },
  notFound: () => notify(tx('المنطقة غير موجودة', 'Area not found'), 'error'),
});

const submit = async () => {
  if (saving.value) return;
  serverErrors.value = {};
  formError.value = '';
  errors.value = validateAreaForm(form.value);
  if (Object.keys(errors.value).length) {
    bilingual.reveal();
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await locationService.updateArea(editing.value.id, form.value);
      notify(tx('تم تحديث المنطقة', 'Area updated'));
    } else {
      await locationService.createArea(form.value);
      // A new area in another city than the one filtered would be hidden: show its city.
      if (cityFilter.value && Number(cityFilter.value) !== Number(form.value.city_id)) cityFilter.value = Number(form.value.city_id);
      notify(tx('تمت إضافة المنطقة', 'Area added'));
    }
    showForm.value = false;
    await load();
  } catch (error) {
    serverErrors.value = serverFieldErrors(error);
    // Field problems are shown under each field; the banner only says to look at them.
    formError.value = Object.keys(serverErrors.value).length
      ? tx('راجع الحقول المظللة بالأحمر.', 'Check the fields marked in red.')
      : errorText(error, tx('تعذر حفظ المنطقة', 'Could not save the area'));
    if (Object.keys(serverErrors.value).length) bilingual.reveal();
  } finally {
    saving.value = false;
  }
};

const toggle = (area) => toggleRow(area, locationService.toggleArea);

// The API deletes an area together with its branches (checked on the stage server): the confirmation says so.
const branchCounts = computed(() => countByArea(branches.value));
const deleteWarning = (rows) => {
  const branchTotal = rows.reduce((sum, area) => sum + (branchCounts.value[area.id] || 0), 0);
  const subject = rows.length === 1 ? tx(`المنطقة «${nameOf(rows[0])}»`, `“${nameOf(rows[0])}”`) : tx(`${rows.length} مناطق`, `${rows.length} areas`);
  if (!branchTotal) return tx(`سيتم حذف ${subject} نهائيًا.`, `${subject} will be deleted permanently.`);
  return tx(
    `سيتم حذف ${subject} نهائيًا، وسيُحذف معها أيضًا: ${countLabel(branchTotal, 'branch')}. لا يمكن التراجع عن ذلك.`,
    `${subject} will be deleted permanently together with ${countLabel(branchTotal, 'branch', 'en')}. This cannot be undone.`,
  );
};

const deletingId = ref(null);
const remove = async (area) => {
  const ok = await confirmDelete(deleteWarning([area]));
  if (!ok) return;
  deletingId.value = area.id;
  try {
    await locationService.deleteArea(area.id);
    areas.value = areas.value.filter((item) => item.id !== area.id);
    bulk.deselect([area.id]);
    notify(tx('تم حذف المنطقة', 'Area deleted'));
    load();
  } catch (error) {
    notify(errorText(error, tx('تعذر حذف المنطقة', 'Could not delete the area')), 'error');
  } finally {
    deletingId.value = null;
  }
};

const bulk = useBulkSelection(() => visibleRows.value);
const bulkActions = computed(() => [
  { key: 'activate', label: tx('تفعيل', 'Activate'), icon: 'check', applies: (a) => !a.is_active,
    each: async (a) => { a.is_active = await locationService.toggleArea(a.id, false); }, done: load, success: (n) => tx(`تم تفعيل ${n} منطقة`, `${n} areas activated`) },
  { key: 'deactivate', label: tx('إيقاف', 'Deactivate'), icon: 'ban', applies: (a) => a.is_active,
    each: async (a) => { a.is_active = await locationService.toggleArea(a.id, true); }, done: load, success: (n) => tx(`تم إيقاف ${n} منطقة`, `${n} areas deactivated`) },
  { key: 'delete', label: tx('حذف', 'Delete'), icon: 'trash', tone: 'danger',
    confirm: (rows) => deleteWarning(rows),
    each: (a) => locationService.deleteArea(a.id), done: load, success: (n) => tx(`تم حذف ${n} منطقة`, `${n} areas deleted`) },
]);
</script>
