<template>
  <div class="loc-page" data-testid="branches-page">
    <!-- The list; the add / edit form below replaces it as a page of its own (/admin/branches/new, /admin/branches/:id/edit) -->
    <div v-show="!showForm" class="list-view" style="display: contents">
    <header class="loc-header">
      <div>
        <h1 class="loc-title page-title">{{ tx('الفروع', 'Branches') }}</h1>
        <p class="loc-subtitle page-subtitle">{{ tx('فروع المتجر ومستودعاته. كل فرع يتبع مدينة ومنطقة، ويمكن تحديد موقعه على الخريطة.', 'The store branches and warehouses. Each branch belongs to a city and an area, and can have a map pin.') }}</p>
      </div>
      <div class="loc-header-actions">
        <button type="button" class="loc-btn loc-btn-ghost" :disabled="loading" data-testid="branches-refresh" @click="load">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ tx('تحديث', 'Refresh') }}
        </button>
        <button type="button" class="loc-btn loc-btn-primary" :disabled="!loading && !areas.length" :title="!areas.length ? tx('أضف مدينة ومنطقة أولًا', 'Add a city and an area first') : ''" data-testid="branch-add" @click="openCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          {{ tx('إضافة فرع', 'Add branch') }}
        </button>
      </div>
    </header>

    <section class="loc-stats" aria-label="stats">
      <div class="loc-stat"><span class="loc-stat-icon is-brand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/></svg></span><div><div class="loc-stat-label">{{ tx('إجمالي الفروع', 'Total branches') }}</div><div class="loc-stat-value" data-testid="branches-total">{{ stats.total }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-ok"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></span><div><div class="loc-stat-label">{{ tx('فروع نشطة', 'Active') }}</div><div class="loc-stat-value" data-testid="branches-active">{{ stats.active }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-off"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg></span><div><div class="loc-stat-label">{{ tx('فروع متوقفة', 'Inactive') }}</div><div class="loc-stat-value" data-testid="branches-inactive">{{ stats.inactive }}</div></div></div>
      <div class="loc-stat"><span class="loc-stat-icon is-info"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><div><div class="loc-stat-label">{{ tx('لها موقع على الخريطة', 'With a map pin') }}</div><div class="loc-stat-value" data-testid="branches-pinned">{{ pinnedCount }}</div></div></div>
    </section>

    <div v-if="!loading && !loadError && !areas.length" class="loc-banner is-info" data-testid="branches-no-areas">
      {{ tx('كل فرع لازم يتبع مدينة ومنطقة. أضف مدينة ومنطقة واحدة على الأقل قبل إضافة الفروع.', 'Every branch needs a city and an area. Add at least one city and one area before adding branches.') }}
      <router-link to="/admin/areas" class="loc-map-link">{{ tx('إدارة المناطق', 'Manage areas') }}</router-link>
    </div>

    <div class="loc-toolbar">
      <ColumnPicker table-key="branches" class="toolbar-columns" />
      <label class="loc-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model.trim="query" class="loc-input" type="search" :placeholder="tx('ابحث باسم الفرع أو المدينة أو المنطقة...', 'Search by branch, city or area...')" data-testid="branches-search" />
      </label>
      <select v-model="cityFilter" class="loc-select" data-testid="branches-city-filter" :aria-label="tx('المدينة', 'City')">
        <option value="">{{ tx('كل المدن', 'All cities') }}</option>
        <option v-for="city in sortedCities" :key="city.id" :value="city.id">{{ nameOf(city) }}</option>
      </select>
      <select v-model="areaFilter" class="loc-select" data-testid="branches-area-filter" :aria-label="tx('المنطقة', 'Area')" :disabled="!filterAreas.length">
        <option value="">{{ tx('كل المناطق', 'All areas') }}</option>
        <option v-for="area in filterAreas" :key="area.id" :value="area.id">{{ nameOf(area) }}</option>
      </select>
      <select v-model="status" class="loc-select" data-testid="branches-status-filter" :aria-label="tx('الحالة', 'Status')">
        <option value="">{{ tx('كل الحالات', 'All statuses') }}</option>
        <option value="active">{{ tx('نشطة', 'Active') }}</option>
        <option value="inactive">{{ tx('متوقفة', 'Inactive') }}</option>
      </select>
      <button v-if="hasFilters" type="button" class="loc-btn loc-btn-ghost" data-testid="branches-clear-filters" @click="clearFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
    </div>

    <div class="loc-card">
      <div v-if="loadError" class="loc-state is-error" data-testid="branches-error">
        <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></span>
        <div class="loc-state-title">{{ tx('تعذر تحميل الفروع', 'Could not load the branches') }}</div>
        <div class="loc-state-text">{{ loadError }}</div>
        <button type="button" class="loc-btn loc-btn-primary" @click="load">{{ tx('إعادة المحاولة', 'Try again') }}</button>
      </div>

      <div v-else class="loc-table-wrap">
        <table class="loc-table" data-col-key="branches" :data-bulk-table="bulk.tableId" data-testid="branches-table">
          <thead>
            <tr>
              <th class="bulk-col"><input type="checkbox" class="bulk-check" :checked="bulk.allSelected" :indeterminate="bulk.someSelected" :disabled="!visibleRows.length" :aria-label="tx('تحديد الكل', 'Select all')" data-testid="bulk-all" @change="bulk.toggleAll()" /></th>
              <th>{{ tx('الفرع', 'Branch') }}</th>
              <th>{{ tx('المدينة / المنطقة', 'City / area') }}</th>
              <th>{{ tx('الموقع', 'Location') }}</th>
              <th>{{ tx('الحالة', 'Status') }}</th>
              <th>{{ tx('الإجراءات', 'Actions') }}</th>
            </tr>
          </thead>
          <tbody v-if="loading && !branches.length">
            <tr v-for="n in 5" :key="n" class="loc-skeleton"><td v-for="c in 6" :key="c"><span /></td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="branch in visibleRows" :key="branch.id" :class="{ 'is-selected': bulk.isSelected(branch.id), 'is-off': !branch.is_active }" :data-bulk-id="branch.id" :data-testid="`branch-row-${branch.id}`">
              <td class="bulk-col" @click.stop><input type="checkbox" class="bulk-check" :checked="bulk.isSelected(branch.id)" :aria-label="tx('تحديد', 'Select')" data-testid="bulk-row" @click="bulk.toggle(branch.id, $event)" /></td>
              <td>
                <button type="button" class="loc-name loc-link-btn" :data-testid="`branch-view-${branch.id}`" @click="openView(branch)">{{ nameOf(branch) }}</button>
                <span v-if="descriptionOf(branch)" class="loc-name-sub loc-desc" :title="descriptionOf(branch)">{{ descriptionOf(branch) }}</span>
              </td>
              <td>
                <span class="loc-name">{{ cityName(branch) || '—' }}</span>
                <span class="loc-name-sub">{{ areaName(branch) || '—' }}</span>
              </td>
              <td>
                <a v-if="mapLink(branch)" :href="mapLink(branch)" target="_blank" rel="noopener noreferrer" class="loc-map-link" dir="ltr" :data-testid="`branch-map-${branch.id}`">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                  {{ formatCoordinates(branch) }}
                </a>
                <span v-else class="loc-chip is-neutral">{{ tx('بدون موقع', 'No pin') }}</span>
              </td>
              <td>
                <label class="loc-switch" :class="{ 'is-busy': isPending(branch.id) }" :data-testid="`branch-toggle-${branch.id}`">
                  <input type="checkbox" :checked="branch.is_active" :disabled="isPending(branch.id)" :aria-label="tx('تفعيل الفرع', 'Branch active')" @change="toggle(branch)" />
                  <span class="loc-switch-track" aria-hidden="true"></span>
                  <span class="loc-switch-text" :class="branch.is_active ? 'is-on' : 'is-off'">{{ branch.is_active ? tx('نشط', 'Active') : tx('متوقف', 'Inactive') }}</span>
                </label>
              </td>
              <td>
                <div class="loc-actions">
                  <button type="button" class="loc-icon-btn" :title="tx('عرض', 'View')" @click="openView(branch)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button type="button" class="loc-icon-btn" :title="tx('تعديل', 'Edit')" :data-testid="`branch-edit-${branch.id}`" @click="openEdit(branch)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button type="button" class="loc-icon-btn is-danger" :title="tx('حذف', 'Delete')" :disabled="deletingId === branch.id" :data-testid="`branch-delete-${branch.id}`" @click="remove(branch)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !visibleRows.length">
              <td colspan="6">
                <div class="loc-state" data-testid="branches-empty">
                  <span class="loc-state-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9"/></svg></span>
                  <template v-if="branches.length">
                    <div class="loc-state-title">{{ tx('لا توجد نتائج', 'No matching branches') }}</div>
                    <div class="loc-state-text">{{ tx('غيّر كلمة البحث أو الفلاتر.', 'Change the search or the filters.') }}</div>
                    <button type="button" class="loc-btn loc-btn-ghost" @click="clearFilters">{{ tx('مسح الفلاتر', 'Clear filters') }}</button>
                  </template>
                  <template v-else>
                    <div class="loc-state-title">{{ tx('لا توجد فروع بعد', 'No branches yet') }}</div>
                    <div class="loc-state-text">{{ tx('أضف أول فرع للمتجر.', 'Add the first branch of the store.') }}</div>
                    <button v-if="areas.length" type="button" class="loc-btn loc-btn-primary" @click="openCreate">{{ tx('إضافة فرع', 'Add branch') }}</button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BulkActionBar :bulk="bulk" :actions="bulkActions" file-name="branches" :label-of="nameOf" />
    </div><!-- /list-view -->

    <!-- Add / edit -->
    <!-- Add / edit page -->
    <EditorPage
      v-if="showForm"
      testid="branch-editor"
      :back-label="tx('الفروع', 'Branches')"
      :title="editing ? tx('تعديل الفرع', 'Edit branch') : tx('إضافة فرع', 'Add branch')"
      :subtitle="tx('الاسم والمدينة والمنطقة مطلوبين. الموقع على الخريطة اختياري.', 'Name, city and area are required. The map pin is optional.')"
      @back="closeForm"
    >
      <form class="loc-editor" data-testid="branch-form" novalidate @submit.prevent="submit">
        <div class="loc-dialog-body">
          <div v-if="formError" class="loc-banner" role="alert" data-testid="branch-form-error">{{ formError }}</div>

          <BilingualField class="loc-field" required :ar="form.name_ar" :en="form.name_en" :invalid-ar="!!fieldError('name_ar')" :invalid-en="!!fieldError('name_en')" testid="branch-name">
            <template #label="{ lang }"><label class="loc-label" :for="`branch-name-${lang}`">{{ tx('اسم الفرع', 'Branch name') }} <span class="loc-req">*</span></label></template>
            <template #default="{ lang }">
              <input v-show="lang === 'ar'" id="branch-name-ar" v-model="form.name_ar" class="loc-input" :class="{ 'is-invalid': fieldError('name_ar') }" dir="rtl" maxlength="255" :placeholder="tx('مثال: فرع عمّان الرئيسي', 'e.g. فرع عمّان الرئيسي')" data-testid="branch-name-ar" />
              <input v-show="lang === 'en'" id="branch-name-en" v-model="form.name_en" class="loc-input" :class="{ 'is-invalid': fieldError('name_en') }" dir="ltr" maxlength="255" placeholder="e.g. Amman Main Branch" data-testid="branch-name-en" />
            </template>
          </BilingualField>
          <p v-if="fieldError('name_ar')" class="loc-error" data-testid="branch-name-ar-error">{{ fieldError('name_ar') }}</p>
          <p v-if="fieldError('name_en')" class="loc-error" data-testid="branch-name-en-error">{{ fieldError('name_en') }}</p>

          <div class="loc-row">
            <div class="loc-field">
              <label class="loc-label" for="branch-city">{{ tx('المدينة', 'City') }} <span class="loc-req">*</span></label>
              <select id="branch-city" v-model="form.city_id" class="loc-select" :class="{ 'is-invalid': fieldError('city_id') }" data-testid="branch-city" @change="onCityChange">
                <option value="">{{ tx('اختر المدينة', 'Choose the city') }}</option>
                <option v-for="city in formCities" :key="city.id" :value="city.id">{{ city.is_active ? nameOf(city) : `${nameOf(city)} (${tx('متوقفة', 'inactive')})` }}</option>
              </select>
              <p v-if="fieldError('city_id')" class="loc-error" data-testid="branch-city-error">{{ fieldError('city_id') }}</p>
            </div>
            <div class="loc-field">
              <label class="loc-label" for="branch-area">{{ tx('المنطقة', 'Area') }} <span class="loc-req">*</span></label>
              <select id="branch-area" v-model="form.area_id" class="loc-select" :class="{ 'is-invalid': fieldError('area_id') }" :disabled="!form.city_id" data-testid="branch-area">
                <option value="">{{ !form.city_id ? tx('اختر المدينة أولًا', 'Choose the city first') : (formAreas.length ? tx('اختر المنطقة', 'Choose the area') : tx('لا توجد مناطق لهذه المدينة', 'This city has no areas')) }}</option>
                <option v-for="area in formAreas" :key="area.id" :value="area.id">{{ area.is_active ? nameOf(area) : `${nameOf(area)} (${tx('متوقفة', 'inactive')})` }}</option>
              </select>
              <p v-if="fieldError('area_id')" class="loc-error" data-testid="branch-area-error">{{ fieldError('area_id') }}</p>
              <router-link v-if="form.city_id && !formAreas.length" :to="{ path: '/admin/areas/new', query: { city: form.city_id } }" class="loc-map-link">{{ tx('إضافة منطقة لهذه المدينة', 'Add an area to this city') }}</router-link>
            </div>
          </div>

          <BilingualField class="loc-field" :ar="form.description_ar" :en="form.description_en" :invalid-en="!!fieldError('description_en')" testid="branch-description">
            <template #label="{ lang }"><label class="loc-label" :for="`branch-description-${lang}`">{{ tx('الوصف (اختياري)', 'Description (optional)') }}</label></template>
            <template #default="{ lang }">
              <textarea v-show="lang === 'ar'" id="branch-description-ar" v-model="form.description_ar" class="loc-textarea" dir="rtl" rows="3" :placeholder="tx('العنوان، أوقات العمل، ملاحظات...', 'Address, working hours, notes...')" data-testid="branch-description-ar"></textarea>
              <textarea v-show="lang === 'en'" id="branch-description-en" v-model="form.description_en" class="loc-textarea" dir="ltr" rows="3" placeholder="Address, working hours, notes..." data-testid="branch-description-en"></textarea>
            </template>
          </BilingualField>
          <p v-if="fieldError('description_en')" class="loc-error">{{ fieldError('description_en') }}</p>

          <div class="loc-field">
            <span class="loc-label">{{ tx('الموقع على الخريطة (اختياري)', 'Map pin (optional)') }}</span>
            <input v-model.trim="mapPaste" class="loc-input" dir="ltr" :placeholder="tx('الصق رابط جوجل ماب أو الإحداثيات هنا (24.7136, 46.6753)', 'Paste a Google Maps link or coordinates (24.7136, 46.6753)')" data-testid="branch-map-paste" @input="readPastedPin" />
            <div class="loc-row">
              <div class="loc-field">
                <label class="loc-hint" for="branch-lat">{{ tx('خط العرض (−90 إلى 90)', 'Latitude (−90 to 90)') }}</label>
                <input id="branch-lat" v-model.trim="form.lat" class="loc-input" :class="{ 'is-invalid': fieldError('lat') }" dir="ltr" inputmode="decimal" placeholder="24.7136" data-testid="branch-lat" />
                <p v-if="fieldError('lat')" class="loc-error" data-testid="branch-lat-error">{{ fieldError('lat') }}</p>
              </div>
              <div class="loc-field">
                <label class="loc-hint" for="branch-lang">{{ tx('خط الطول (−180 إلى 180)', 'Longitude (−180 to 180)') }}</label>
                <input id="branch-lang" v-model.trim="form.lang" class="loc-input" :class="{ 'is-invalid': fieldError('lang') }" dir="ltr" inputmode="decimal" placeholder="46.6753" data-testid="branch-lang" />
                <p v-if="fieldError('lang')" class="loc-error" data-testid="branch-lang-error">{{ fieldError('lang') }}</p>
              </div>
            </div>
            <a v-if="formMapLink" :href="formMapLink" target="_blank" rel="noopener noreferrer" class="loc-map-link" data-testid="branch-form-map">{{ tx('معاينة الموقع على جوجل ماب', 'Preview on Google Maps') }} ↗</a>
          </div>

          <label class="loc-switch" data-testid="branch-active">
            <input v-model="form.is_active" type="checkbox" />
            <span class="loc-switch-track" aria-hidden="true"></span>
            <span class="loc-switch-text" :class="form.is_active ? 'is-on' : 'is-off'">{{ form.is_active ? tx('الفرع نشط', 'Active') : tx('الفرع متوقف', 'Inactive') }}</span>
          </label>
        </div>
        <div class="loc-dialog-foot">
          <button type="button" class="loc-btn loc-btn-ghost" @click="closeForm">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="submit" class="loc-btn loc-btn-primary" :disabled="saving" data-testid="branch-submit">{{ saving ? tx('جاري الحفظ...', 'Saving...') : (editing ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة الفرع', 'Add branch')) }}</button>
        </div>
      </form>
    </EditorPage>

    <!-- Details -->
    <div v-if="viewing" class="loc-overlay" @click.self="viewing = null" @keydown.esc="viewing = null">
      <div class="loc-dialog" role="dialog" aria-modal="true" aria-labelledby="branch-view-title" data-testid="branch-details">
        <div class="loc-dialog-head">
          <div>
            <h2 id="branch-view-title" class="loc-dialog-title">{{ nameOf(viewing) }}</h2>
            <p class="loc-dialog-sub">{{ otherName(viewing) }}</p>
          </div>
          <button type="button" class="loc-icon-btn" :aria-label="tx('إغلاق', 'Close')" @click="viewing = null"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="loc-dialog-body">
          <dl class="loc-details">
            <dt>{{ tx('الحالة', 'Status') }}</dt><dd><span class="loc-switch-text" :class="viewing.is_active ? 'is-on' : 'is-off'">{{ viewing.is_active ? tx('نشط', 'Active') : tx('متوقف', 'Inactive') }}</span></dd>
            <dt>{{ tx('المدينة', 'City') }}</dt><dd>{{ cityName(viewing) || '—' }}</dd>
            <dt>{{ tx('المنطقة', 'Area') }}</dt><dd>{{ areaName(viewing) || '—' }}</dd>
            <dt>{{ tx('الوصف (عربي)', 'Description (Arabic)') }}</dt><dd>{{ viewing.translations.ar.description || '—' }}</dd>
            <dt>{{ tx('الوصف (إنجليزي)', 'Description (English)') }}</dt><dd dir="ltr">{{ viewing.translations.en.description || '—' }}</dd>
            <dt>{{ tx('الإحداثيات', 'Coordinates') }}</dt>
            <dd>
              <a v-if="mapLink(viewing)" :href="mapLink(viewing)" target="_blank" rel="noopener noreferrer" class="loc-map-link" dir="ltr">{{ formatCoordinates(viewing) }} ↗</a>
              <span v-else>—</span>
            </dd>
          </dl>
        </div>
        <div class="loc-dialog-foot">
          <button type="button" class="loc-btn loc-btn-ghost" @click="viewing = null">{{ tx('إغلاق', 'Close') }}</button>
          <button type="button" class="loc-btn loc-btn-primary" @click="editFromView">{{ tx('تعديل', 'Edit') }}</button>
        </div>
      </div>
    </div>

    <div class="alert-toast" :class="[toast.type, { show: toast.show }]" role="status" data-testid="branches-toast">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import EditorPage from '../components/EditorPage.vue';
import { useEditorRoute } from '../composables/useEditorRoute';
import '../assets/locations.css';
import { computed, onMounted, ref, watch } from 'vue';
import BulkActionBar from '../components/BulkActionBar.vue';
import ColumnPicker from '../components/ColumnPicker.vue';
import BilingualField from '../components/BilingualField.vue';
import { useBulkSelection } from '../composables/useBulkSelection';
import { provideBilingualForm } from '../composables/useBilingualForm';
import { serverFieldErrors, useLocationPage } from '../composables/useLocationPage';
import locationService from '../application/locationService';
import {
  areasOfCity, branchFormFrom, emptyBranchForm, filterLocations, formatCoordinates, localizedDescription, localizedName,
  locationStats, mapLink, parsePin, sortByName, validateBranchForm,
} from '../domain/locations';

const bilingual = provideBilingualForm();
const { tx, locale, toast, notify, errorText, isPending, toggleRow, confirmDelete, fieldMessage } = useLocationPage();

const branches = ref([]);
const cities = ref([]);
const areas = ref([]);
const loading = ref(false);
const loadError = ref('');
const query = ref('');
const status = ref('');
const cityFilter = ref('');
const areaFilter = ref('');

const lang = computed(() => (locale.value === 'en' ? 'en' : 'ar'));
const nameOf = (item) => localizedName(item, lang.value);
const otherName = (item) => {
  const other = item?.translations?.[lang.value === 'en' ? 'ar' : 'en']?.name || '';
  return other && other !== nameOf(item) ? other : '';
};
const descriptionOf = (item) => localizedDescription(item, lang.value);
const cityById = computed(() => Object.fromEntries(cities.value.map((city) => [city.id, city])));
const areaById = computed(() => Object.fromEntries(areas.value.map((area) => [area.id, area])));
const cityName = (branch) => nameOf(cityById.value[branch.city_id] || branch.city);
const areaName = (branch) => nameOf(areaById.value[branch.area_id] || branch.area);

const sortedCities = computed(() => sortByName(cities.value, lang.value));
const filterAreas = computed(() => sortByName(areasOfCity(areas.value, cityFilter.value), lang.value));
watch(cityFilter, () => {
  if (areaFilter.value && !filterAreas.value.some((area) => area.id === Number(areaFilter.value))) areaFilter.value = '';
});

const visibleRows = computed(() => sortByName(filterLocations(branches.value, {
  query: query.value, status: status.value, cityId: cityFilter.value, areaId: areaFilter.value,
}), lang.value));
const stats = computed(() => locationStats(branches.value));
const pinnedCount = computed(() => branches.value.filter((branch) => mapLink(branch)).length);
const hasFilters = computed(() => Boolean(query.value || status.value || cityFilter.value || areaFilter.value));
const clearFilters = () => { query.value = ''; status.value = ''; cityFilter.value = ''; areaFilter.value = ''; };

const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const [branchList, cityList, areaList] = await Promise.all([
      locationService.listBranches(), locationService.listCities(), locationService.listAreas(),
    ]);
    branches.value = branchList;
    cities.value = cityList;
    areas.value = areaList;
  } catch (error) {
    loadError.value = errorText(error);
  } finally {
    loading.value = false;
  }
};
onMounted(load);

// ---- Form
const showForm = ref(false);
const editing = ref(null);
const form = ref(emptyBranchForm());
const errors = ref({});
const serverErrors = ref({});
const formError = ref('');
const saving = ref(false);
const mapPaste = ref('');

// Inactive cities / areas stay selectable (a branch can be prepared before opening the city), but an edited branch
// always sees its own city and area even if they are missing from the lists.
const formCities = computed(() => sortedCities.value);
const formAreas = computed(() => sortByName(areasOfCity(areas.value, form.value.city_id), lang.value));
// The preview link shows only for a complete, in-range pin.
const formMapLink = computed(() => {
  const pinErrors = validateBranchForm({ ...form.value, name_ar: 'x', name_en: 'x', city_id: 1, area_id: 1 });
  return pinErrors.lat || pinErrors.lang ? '' : mapLink(form.value);
});

const onCityChange = () => {
  // A new city empties the area unless it is one of that city's areas; a city with a single area picks it.
  if (!formAreas.value.some((area) => area.id === Number(form.value.area_id))) form.value.area_id = '';
  if (!form.value.area_id && formAreas.value.length === 1) form.value.area_id = formAreas.value[0].id;
};

const readPastedPin = () => {
  const pin = parsePin(mapPaste.value);
  if (pin) {
    form.value.lat = String(pin.lat);
    form.value.lang = String(pin.lang);
  }
};

const fieldError = (field) => fieldMessage(field, errors.value, serverErrors.value);

const resetFormState = () => { errors.value = {}; serverErrors.value = {}; formError.value = ''; mapPaste.value = ''; bilingual.reset(); };
const openCreate = () => {
  editing.value = null;
  form.value = emptyBranchForm();
  if (cityFilter.value) form.value.city_id = Number(cityFilter.value);
  if (areaFilter.value) form.value.area_id = Number(areaFilter.value);
  else if (cities.value.length === 1) { form.value.city_id = cities.value[0].id; onCityChange(); }
  resetFormState();
  showForm.value = true;
};
const openEdit = (branch) => { editing.value = branch; form.value = branchFormFrom(branch); resetFormState(); showForm.value = true; };
const closeForm = () => { if (!saving.value) showForm.value = false; };

// The form has its own address: /admin/branches/new and /admin/branches/:id/edit.
let loading$ = null;
const loadOnce = () => (areas.value.length ? null : (loading$ ||= load().finally(() => { loading$ = null; })));
useEditorRoute({
  base: '/admin/branches',
  isOpen: showForm,
  editId: () => editing.value?.id,
  openAdd: async () => { await loadOnce(); openCreate(); },
  openEdit,
  close: () => { showForm.value = false; },
  findItem: async (id) => {
    if (!branches.value.length) await load();
    return branches.value.find((branch) => String(branch.id) === id) || null;
  },
  notFound: () => notify(tx('الفرع غير موجود', 'Branch not found'), 'error'),
});

const submit = async () => {
  if (saving.value) return;
  serverErrors.value = {};
  formError.value = '';
  errors.value = validateBranchForm(form.value, areas.value);
  if (Object.keys(errors.value).length) {
    bilingual.reveal();
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await locationService.updateBranch(editing.value.id, form.value);
      notify(tx('تم تحديث الفرع', 'Branch updated'));
    } else {
      await locationService.createBranch(form.value);
      notify(tx('تمت إضافة الفرع', 'Branch added'));
    }
    showForm.value = false;
    await load();
  } catch (error) {
    serverErrors.value = serverFieldErrors(error);
    // Field problems are shown under each field; the banner only says to look at them.
    formError.value = Object.keys(serverErrors.value).length
      ? tx('راجع الحقول المظللة بالأحمر.', 'Check the fields marked in red.')
      : errorText(error, tx('تعذر حفظ الفرع', 'Could not save the branch'));
    if (Object.keys(serverErrors.value).length) bilingual.reveal();
  } finally {
    saving.value = false;
  }
};

// ---- Details / status / delete
const viewing = ref(null);
const openView = (branch) => { viewing.value = branch; };
const editFromView = () => { const branch = viewing.value; viewing.value = null; openEdit(branch); };

const toggle = (branch) => toggleRow(branch, locationService.toggleBranch);

const deletingId = ref(null);
const remove = async (branch) => {
  if (!(await confirmDelete(tx(`سيتم حذف الفرع «${nameOf(branch)}» نهائيًا.`, `“${nameOf(branch)}” will be deleted permanently.`)))) return;
  deletingId.value = branch.id;
  try {
    await locationService.deleteBranch(branch.id);
    branches.value = branches.value.filter((item) => item.id !== branch.id);
    bulk.deselect([branch.id]);
    notify(tx('تم حذف الفرع', 'Branch deleted'));
  } catch (error) {
    notify(errorText(error, tx('تعذر حذف الفرع', 'Could not delete the branch')), 'error');
  } finally {
    deletingId.value = null;
  }
};

const bulk = useBulkSelection(() => visibleRows.value);
const bulkActions = computed(() => [
  { key: 'activate', label: tx('تفعيل', 'Activate'), icon: 'check', applies: (b) => !b.is_active,
    each: async (b) => { b.is_active = await locationService.toggleBranch(b.id, false); }, done: load, success: (n) => tx(`تم تفعيل ${n} فرع`, `${n} branches activated`) },
  { key: 'deactivate', label: tx('إيقاف', 'Deactivate'), icon: 'ban', applies: (b) => b.is_active,
    each: async (b) => { b.is_active = await locationService.toggleBranch(b.id, true); }, done: load, success: (n) => tx(`تم إيقاف ${n} فرع`, `${n} branches deactivated`) },
  { key: 'delete', label: tx('حذف', 'Delete'), icon: 'trash', tone: 'danger',
    confirm: (rows) => tx(`سيتم حذف ${rows.length} فرع. الحذف نهائي.`, `Delete ${rows.length} branches? This cannot be undone.`),
    each: (b) => locationService.deleteBranch(b.id), done: load, success: (n) => tx(`تم حذف ${n} فرع`, `${n} branches deleted`) },
]);
</script>

<style scoped>
.loc-link-btn { background: none; border: none; padding: 0; font: inherit; font-weight: 700; color: var(--text-main); cursor: pointer; text-align: start; }
.loc-link-btn:hover { color: var(--primary); text-decoration: underline; }
</style>
