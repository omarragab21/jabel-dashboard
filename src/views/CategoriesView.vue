
<template>
  <div class="categories-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <h2 class="page-title">{{ tx('أقسام المنتجات', 'Product Categories') }}</h2>
        <p class="page-subtitle">{{ tx('إدارة الأقسام الرئيسية والفرعية للمنتجات', 'Manage main and sub-product categories') }}</p>
      </div>
      <button class="add-btn" @click="openAddModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة قسم رئيسي', 'Add Main Category') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon-wrapper active-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('الأقسام النشطة', 'Active Categories') }}</span>
          <span class="stat-value">{{ activeCategoriesCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper total-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('إجمالي المنتجات', 'Total Products') }}</span>
          <span class="stat-value">{{ totalProductsCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper sub-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('الأقسام الفرعية', 'Subcategories') }}</span>
          <span class="stat-value">{{ subCategoriesCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper main-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('الأقسام الرئيسية', 'Main Categories') }}</span>
          <span class="stat-value">{{ mainCategoriesCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن اسم...', 'Search by name...')" class="search-input" />
      </div>
      <div class="filter-select">
        <select v-model="statusFilter" class="form-select">
          <option value="">{{ tx('جميع الحالات', 'All statuses') }}</option>
          <option value="1">{{ tx('نشط', 'Active') }}</option>
          <option value="0">{{ tx('غير نشط', 'Inactive') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="select-icon">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-name">{{ tx('القسم', 'Category') }}</th>
            <th class="col-products">{{ tx('المنتجات', 'Products') }}</th>
            <th class="col-parent">{{ tx('الأقسام الفرعية', 'Sub-categories') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row">
            <td colspan="5">{{ tx('جاري التحميل...', 'Loading...') }}</td>
          </tr>
          <tr v-else-if="visibleRows.length === 0" class="state-row">
            <td colspan="5">{{ tx('لا توجد أقسام مطابقة للبحث', 'No matching categories found') }}</td>
          </tr>
          <template v-else>
            <tr v-for="cat in visibleRows" :key="cat.id" class="data-row" :class="{ 'is-sub': isSubRow(cat) }">
              <td class="col-name">
                <div class="cat-name-cell">
                  <!-- Fixed slot at the start: the arrow of a main category with sub-categories, or the "child of" mark. -->
                  <span class="name-lead">
                    <svg v-if="cat.parent_id" class="sub-indicator" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                      <polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                    </svg>
                    <button v-else-if="childCount(cat)" type="button" class="expand-btn" :class="{ open: isExpanded(cat) }" data-testid="category-toggle"
                      :aria-expanded="isExpanded(cat)" :aria-label="isExpanded(cat) ? tx('إخفاء الأقسام الفرعية', 'Hide sub-categories') : tx('عرض الأقسام الفرعية', 'Show sub-categories')"
                      @click.stop="toggleExpanded(cat)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </span>
                  <div class="cat-image" v-if="hasImage(cat.image)">
                    <img :src="cat.image" :alt="cat.name_i18n?.ar || cat.name" @error="markImageBroken(cat.image)" />
                  </div>
                  <div class="cat-icon-placeholder" v-else>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <span>{{ localizedName(cat.name_i18n, cat.name) }}</span>
                </div>
              </td>
              <td class="col-products">
                <span class="products-count">{{ categoryProductCount(cat) }} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1.73 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
              </td>
              <td class="col-parent">
                <button v-if="!cat.parent_id && childCount(cat)" type="button" class="children-badge" :class="{ open: isExpanded(cat) }" @click.stop="toggleExpanded(cat)">{{ childCountLabel(childCount(cat)) }}</button>
                <!-- A sub-category listed on its own (its main category is filtered out) still names its parent. -->
                <span v-else-if="cat.parent_id && !isSubRow(cat) && parentOf(cat)" class="parent-badge">{{ localizedName(parentOf(cat).name_i18n, parentOf(cat).name) }}</span>
                <span v-else class="dash-mark">—</span>
              </td>
              <td class="col-status">
                <span class="status-badge" :class="cat.is_active ? 'active' : 'inactive'">
                  {{ cat.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn delete-btn" @click="confirmDelete(cat)" :title="tx('حذف', 'Delete')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                  <button class="action-btn edit-btn" @click="openEditModal(cat)" :title="tx('تعديل', 'Edit')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn view-btn" @click="openViewModal(cat)" :title="tx('عرض', 'View')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button class="action-btn add-sub-btn" v-if="!cat.parent_id" @click="openAddSubModal(cat)" :title="tx('إضافة قسم فرعي', 'Add subcategory')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Add / edit dialog (main category, sub-category, edit) -->
    <div class="cm-overlay" v-if="showFormModal" @click.self="closeModal" @keydown.esc="closeModal">
      <div class="cm-dialog" role="dialog" aria-modal="true" aria-labelledby="cm-form-title" data-testid="category-form-dialog">
        <header class="cm-header">
          <div class="cm-heading">
            <div class="cm-heading-row"><span v-if="!isEdit" class="cm-header-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span><span v-else class="cm-header-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span><h3 id="cm-form-title" class="cm-title">{{ formTitle }}</h3></div>
            <p class="cm-subtitle">{{ formSubtitle }}</p>
          </div>
          <button type="button" class="cm-close" @click="closeModal" :aria-label="tx('إغلاق', 'Close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <form @submit.prevent="submitForm()" class="cm-form" novalidate>
          <div class="cm-parent" v-if="form.parent_id" data-testid="category-parent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>
            <span>{{ tx('القسم الرئيسي:', 'Main category:') }} {{ formParentName }}</span>
          </div>

          <!-- Language -->
          <div class="cm-lang" role="tablist" :aria-label="tx('اللغة', 'Language')">
            <div class="cm-lang-switch" dir="ltr">
              <button type="button" role="tab" class="cm-lang-btn" :class="{ active: activeLang === 'en', missing: !nameFilled('en') }" :aria-selected="activeLang === 'en'" @click="activeLang = 'en'">English</button>
              <button type="button" role="tab" class="cm-lang-btn" :class="{ active: activeLang === 'ar', missing: !nameFilled('ar') }" :aria-selected="activeLang === 'ar'" @click="activeLang = 'ar'">العربية</button>
            </div>
          </div>

          <!-- Image -->
          <div class="cm-field">
            <label class="cm-label">{{ isSubForm ? tx('صورة القسم الفرعي', 'Sub-category image') : tx('صورة القسم', 'Category image') }} <span class="cm-req">*</span></label>
            <div class="cm-upload" :class="{ filled: hasImage(imagePreview) }" role="button" tabindex="0" @click="triggerFileInput" @keydown.enter.prevent="triggerFileInput" @keydown.space.prevent="triggerFileInput" data-testid="category-image-box">
              <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="cm-file" data-testid="category-image-input" />
              <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
              <template v-if="hasImage(imagePreview)">
                <img :src="imagePreview" class="cm-preview" alt="" @error="markImageBroken(imagePreview)" />
                <div class="cm-preview-actions">
                  <span class="cm-change">{{ tx('تغيير الصورة', 'Change image') }}</span>
                  <ImageCropButton @crop="recropCurrentImage" />
                </div>
              </template>
              <template v-else>
                <span class="cm-upload-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/></svg>
                </span>
                <span class="cm-upload-text">{{ isSubForm ? tx('اضغط لرفع صورة القسم الفرعي', 'Click to upload the sub-category image') : tx('اضغط لرفع صورة القسم', 'Click to upload the category image') }}</span>
                <span class="cm-upload-hint">PNG, JPG, WEBP</span>
              </template>
            </div>
          </div>

          <p class="cm-image-error" v-if="imageError" role="alert" data-testid="category-image-error">{{ imageError }}</p>


          <!-- Name -->
          <div class="cm-field" v-show="activeLang === 'ar'">
            <label class="cm-label" for="cm-name-ar">{{ isSubForm ? tx('اسم القسم الفرعي', 'Sub-category name') : tx('اسم القسم', 'Category name') }} <span class="cm-req">*</span></label>
            <input id="cm-name-ar" type="text" v-model="form.name_ar" class="cm-input" :placeholder="isSubForm ? 'مثال: هواتف ذكية' : 'مثال: إلكترونيات'" data-testid="category-name-ar" />
          </div>
          <div class="cm-field" v-show="activeLang === 'en'">
            <label class="cm-label" for="cm-name-en">{{ isSubForm ? tx('اسم القسم الفرعي', 'Sub-category name') : tx('اسم القسم', 'Category name') }} (English) <span class="cm-req">*</span></label>
            <input id="cm-name-en" type="text" v-model="form.name_en" class="cm-input" dir="ltr" :placeholder="isSubForm ? 'e.g. Smartphones' : 'e.g. Electronics'" data-testid="category-name-en" />
          </div>

          <!-- Description -->
          <div class="cm-field" v-show="activeLang === 'ar'">
            <label class="cm-label" for="cm-desc-ar">{{ tx('الوصف', 'Description') }}</label>
            <textarea id="cm-desc-ar" v-model="form.description_ar" class="cm-textarea" placeholder="وصف القسم (اختياري)" rows="3"></textarea>
          </div>
          <div class="cm-field" v-show="activeLang === 'en'">
            <label class="cm-label" for="cm-desc-en">{{ tx('الوصف', 'Description') }} (English)</label>
            <textarea id="cm-desc-en" v-model="form.description_en" class="cm-textarea" dir="ltr" placeholder="Category description (optional)" rows="3"></textarea>
          </div>

          <!-- Status -->
          <div class="cm-field">
            <label class="cm-label" for="cm-status">{{ tx('الحالة', 'Status') }}</label>
            <div class="cm-select">
              <select id="cm-status" v-model="form.is_active" class="cm-input">
                <option :value="true">{{ tx('نشط', 'Active') }}</option>
                <option :value="false">{{ tx('غير نشط', 'Inactive') }}</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <p class="cm-missing" v-if="missingFields.length" data-testid="category-missing">{{ tx('مطلوب:', 'Required:') }} {{ missingFields.join('، ') }}</p>

          <footer class="cm-footer" :class="{ 'is-edit': isEdit }">
            <button type="button" class="cm-btn cm-btn-cancel" @click="closeModal">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="cm-btn cm-btn-primary" :disabled="isSubmitting || !canSubmit" data-testid="category-submit">
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : submitLabel }}
            </button>
          </footer>
        </form>
      </div>
    </div>

    <!-- View dialog -->
    <div class="cm-overlay" v-if="showViewModal && viewCategory" @click.self="closeView" @keydown.esc="closeView">
      <div class="cm-dialog" role="dialog" aria-modal="true" aria-labelledby="cm-view-title" data-testid="category-view-dialog">
        <header class="cm-header">
          <div class="cm-heading">
            <div class="cm-heading-row"><span class="cm-header-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><h3 id="cm-view-title" class="cm-title">{{ tx('تفاصيل القسم', 'Category details') }}</h3></div>
            <p class="cm-subtitle">{{ tx('معلومات كاملة عن القسم', 'Complete category information') }}</p>
          </div>
          <button type="button" class="cm-close" @click="closeView" :aria-label="tx('إغلاق', 'Close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <div class="cm-view">
          <div class="cm-view-hero">
            <div class="cm-view-img">
              <img v-if="hasImage(viewCategory.image)" :src="viewCategory.image" :alt="viewCategory.name" @error="markImageBroken(viewCategory.image)" />
              <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <h4 class="cm-view-name">{{ localizedName(viewCategory.name_i18n, viewCategory.name) }}</h4>
          </div>

          <div class="cm-view-block" v-if="parentOf(viewCategory)">
            <span class="cm-view-label">{{ tx('القسم الرئيسي', 'Main category') }}</span>
            <span class="cm-view-value">{{ localizedName(parentOf(viewCategory).name_i18n, parentOf(viewCategory).name) }}</span>
          </div>
          <div class="cm-view-block">
            <span class="cm-view-label">{{ tx('الوصف', 'Description') }}</span>
            <span class="cm-view-value">{{ viewCategory.description || tx('لا يوجد وصف', 'No description') }}</span>
          </div>
          <div class="cm-view-pair">
            <div class="cm-view-block">
              <span class="cm-view-label">{{ tx('عدد المنتجات', 'Products') }}</span>
              <span class="cm-view-value">{{ categoryProductCount(viewCategory) }} {{ tx('منتج', 'products') }}</span>
            </div>
            <div class="cm-view-block">
              <span class="cm-view-label">{{ tx('الحالة', 'Status') }}</span>
              <span class="status-badge" :class="viewCategory.is_active ? 'active' : 'inactive'">{{ viewCategory.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}</span>
            </div>
          </div>

          <div class="cm-view-block" v-if="viewChildren.length">
            <span class="cm-view-label">{{ tx('الأقسام الفرعية', 'Sub-categories') }}</span>
            <ul class="cm-children">
              <li v-for="child in viewChildren" :key="child.id" class="cm-child">
                <div class="cm-child-img">
                  <img v-if="hasImage(child.image)" :src="child.image" alt="" @error="markImageBroken(child.image)" />
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div class="cm-child-text">
                  <span class="cm-child-name">{{ localizedName(child.name_i18n, child.name) }}</span>
                  <span class="cm-child-count">{{ categoryProductCount(child) }} {{ tx('منتج', 'products') }}</span>
                </div>
                <span class="status-badge" :class="child.is_active ? 'active' : 'inactive'">{{ child.is_active ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}</span>
              </li>
            </ul>
          </div>

          <footer class="cm-footer is-edit">
            <button type="button" class="cm-btn cm-btn-primary" @click="closeView">{{ tx('إغلاق', 'Close') }}</button>
          </footer>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div class="cm-overlay" v-if="deleteTarget" @click.self="closeDelete" @keydown.esc="closeDelete">
      <div class="cm-dialog cm-dialog-sm" role="alertdialog" aria-modal="true" aria-labelledby="cm-delete-title" data-testid="category-delete-dialog">
        <header class="cm-header">
          <div class="cm-heading">
            <div class="cm-heading-row"><span class="cm-header-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span><h3 id="cm-delete-title" class="cm-title">{{ tx('تأكيد الحذف', 'Confirm deletion') }}</h3></div>
          </div>
        </header>
        <div class="cm-delete-body">
          <p>{{ tx('هل أنت متأكد من حذف القسم', 'Are you sure you want to delete the category') }} "{{ localizedName(deleteTarget.name_i18n, deleteTarget.name) }}"؟</p>
          <p class="cm-delete-warning" v-if="deleteChildrenCount">{{ tx(`تحذير: هذا القسم يحتوي على ${deleteChildrenCount} قسم فرعي، وستتحول إلى أقسام رئيسية بعد حذفه.`, `Warning: this category has ${deleteChildrenCount} sub-categories; they become main categories once it is deleted.`) }}</p>
          <p>{{ tx('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.') }}</p>
        </div>
        <footer class="cm-footer is-edit">
          <button type="button" class="cm-btn cm-btn-cancel" @click="closeDelete">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="button" class="cm-btn cm-btn-danger" :disabled="isDeleting" @click="runDelete" data-testid="category-delete-confirm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            {{ isDeleting ? tx('جاري الحذف...', 'Deleting...') : tx('حذف القسم', 'Delete category') }}
          </button>
        </footer>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" :class="[alertType, { show: showAlert }]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <path v-if="alertType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline v-if="alertType === 'success'" points="22 4 12 14.01 9 11.01"/>
        <circle v-if="alertType === 'error'" cx="12" cy="12" r="10"/><line v-if="alertType === 'error'" x1="12" y1="8" x2="12" y2="12"/><line v-if="alertType === 'error'" x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import adminCatalogService from '../application/adminCatalogService';
import { categoryMatchesSearch, toCategoryPayload } from '../domain/catalog/adminCatalog';
import { visibleCategories, visibleProducts } from '../utils/catalogVisibility';
import { safeObjectUrl } from '../utils/adminSecurity';
import ImageCropModal from '../components/ImageCropModal.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';

const { locale, tx } = useAdminText();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();
const localizedName = (i18nValue, fallback = '') => locale.value === 'en'
  ? (i18nValue?.en || i18nValue?.ar || fallback)
  : (i18nValue?.ar || i18nValue?.en || fallback);

// State
const categories = ref([]);
const allProducts = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

// Computed Stats
const activeCategoriesCount = computed(() => categories.value.filter(c => c.is_active).length);
const mainCategoriesCount = computed(() => categories.value.filter(c => !c.parent_id).length);
const subCategoriesCount = computed(() => categories.value.filter(c => c.parent_id).length);
const productCounts = computed(() => allProducts.value.reduce((counts, product) => {
  const id = product.subcategory_id ?? product.category_id ?? product.category?.id;
  if (id !== undefined && id !== null && id !== '') counts[Number(id)] = (counts[Number(id)] || 0) + 1;
  return counts;
}, {}));
const categoryProductCount = (category) => {
  if (allProducts.value.length) {
    const descendantIds = categories.value
      .filter(child => Number(child.parent_id) === Number(category.id))
      .map(child => Number(child.id));
    return [Number(category.id), ...descendantIds]
      .reduce((sum, id) => sum + (productCounts.value[id] || 0), 0);
  }
  return Number(category.products_count || 0);
};
const totalProductsCount = computed(() => allProducts.value.length || categories.value.reduce((sum, c) => sum + Number(c.products_count || 0), 0));

// The API returns a flat list; resolve each sub-category's parent from it.
const parentOf = (category) => {
  if (category.parent) return category.parent;
  if (!category.parent_id) return null;
  return categories.value.find(item => Number(item.id) === Number(category.parent_id)) || null;
};

// Filtered categories: every main category is followed by its own sub-categories.
const filteredCategories = computed(() => {
  const matches = categories.value.filter(cat => {
    const matchSearch = categoryMatchesSearch(cat, searchQuery.value);
    const matchStatus = statusFilter.value === '' ? true : (cat.is_active.toString() === statusFilter.value);
    return matchSearch && matchStatus;
  });
  const bySort = (a, b) => (a.sort_order || 0) - (b.sort_order || 0) || Number(a.id) - Number(b.id);
  const parentIds = new Set(categories.value.filter(cat => !cat.parent_id).map(cat => Number(cat.id)));
  const isSub = (cat) => cat.parent_id && parentIds.has(Number(cat.parent_id));
  const mains = matches.filter(cat => !isSub(cat)).sort(bySort);
  const subs = matches.filter(isSub);
  return mains.flatMap(main => [
    main,
    ...subs.filter(sub => Number(sub.parent_id) === Number(main.id)).sort(bySort),
  ]).concat(
    // A sub-category whose main category was filtered out is still listed.
    subs.filter(sub => !mains.some(main => Number(main.id) === Number(sub.parent_id))).sort(bySort),
  );
});


// A main category with sub-categories opens and closes them from its arrow. While a search or a status
// filter is active every match is listed, so a hidden sub-category never swallows a result.
const expandedIds = ref({});
const isFiltering = computed(() => Boolean(String(searchQuery.value).trim()) || statusFilter.value !== '');
const childCount = (category) => categories.value.filter(child => Number(child.parent_id) === Number(category.id)).length;
const isExpanded = (category) => isFiltering.value || Boolean(expandedIds.value[category.id]);
const toggleExpanded = (category) => {
  expandedIds.value = { ...expandedIds.value, [category.id]: !expandedIds.value[category.id] };
};
const childCountLabel = (count) => {
  if (locale.value === 'en') return `${count} ${count === 1 ? 'sub-category' : 'sub-categories'}`;
  if (count === 1) return 'قسم واحد';
  if (count === 2) return 'قسمان';
  return `${count} ${count <= 10 ? 'أقسام' : 'قسمًا'}`;
};
// A row is a sub-row when its main category is in the table too (it is then indented under it).
const mainIds = computed(() => new Set(categories.value.filter(cat => !cat.parent_id).map(cat => Number(cat.id))));
const isSubRow = (category) => Boolean(category.parent_id) && mainIds.value.has(Number(category.parent_id));
const visibleRows = computed(() => filteredCategories.value.filter(
  cat => !isSubRow(cat) || isFiltering.value || Boolean(expandedIds.value[cat.parent_id]),
));

// Modals
const showFormModal = ref(false);
const showViewModal = ref(false);
const isEdit = ref(false);
const editingId = ref(null);
const viewCategory = ref(null);
const fileInput = ref(null);
const isSubmitting = ref(false);
// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.
const formLang = () => (locale.value === 'en' ? 'en' : 'ar');
const activeLang = ref(formLang());
const editingName = ref('');
const CATEGORY_HAS_PRODUCTS = 'لا يمكن حذف هذا القسم لأنه مرتبط بمنتجات. انقل المنتجات إلى قسم آخر أو احذفها أولًا.';
const deleteTarget = ref(null);
const isDeleting = ref(false);
const imageError = ref('');

const form = ref({
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  parent_id: '',
  is_active: true,
  sort_order: 1,
  image: null
});
const imagePreview = ref(null);

// Some categories point to image files that no longer exist on the server
// (404). Show the placeholder for those instead of a broken image.
const brokenImages = ref({});
const hasImage = (url) => Boolean(url) && !brokenImages.value[url];
const markImageBroken = (url) => {
  if (url) brokenImages.value = { ...brokenImages.value, [url]: true };
};

const getBaseForm = () => ({
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  parent_id: '',
  is_active: true,
  sort_order: 1,
  image: null
});

// Alerts
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

const triggerAlert = (msg, type = 'success') => {
  alertMessage.value = localizeMessage(msg);
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => { showAlert.value = false; }, 3000);
};

// Fetch data
const fetchCategories = async () => {
  loading.value = true;
  try {
    const [categoryList, productList] = await Promise.all([
      adminCatalogService.listCategories({ include_inactive: 1, show_all: 1 }),
      adminCatalogService.listAllProducts({ include_inactive: 1, show_all: 1 }),
    ]);
    categories.value = visibleCategories(categoryList);
    allProducts.value = visibleProducts(productList);
  } catch {
    triggerAlert('فشل جلب الأقسام', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});

// Dialog texts and state: the same form serves a main category, a sub-category and an edit.
const isSubForm = computed(() => Boolean(form.value.parent_id));
const formParent = computed(() => categories.value.find(item => Number(item.id) === Number(form.value.parent_id)) || null);
const formParentName = computed(() => formParent.value ? localizedName(formParent.value.name_i18n, formParent.value.name) : '');
const formTitle = computed(() => {
  if (isEdit.value) return tx('تعديل القسم', 'Edit category');
  return isSubForm.value ? tx('إضافة قسم فرعي', 'Add sub-category') : tx('إضافة قسم رئيسي جديد', 'Add new main category');
});
const formSubtitle = computed(() => {
  if (isEdit.value) return tx(`تعديل معلومات القسم "${editingName.value}"`, `Edit the information of "${editingName.value}"`);
  return isSubForm.value
    ? tx(`إضافة قسم فرعي ضمن "${formParentName.value}"`, `Add a sub-category under "${formParentName.value}"`)
    : tx('أدخل معلومات القسم الرئيسي الجديد', 'Enter the new main category information');
});
const submitLabel = computed(() => {
  if (isEdit.value) return tx('حفظ التغييرات', 'Save changes');
  return isSubForm.value ? tx('إضافة القسم الفرعي', 'Add sub-category') : tx('إضافة القسم', 'Add category');
});
const nameFilled = (lang) => Boolean(String(lang === 'ar' ? form.value.name_ar : form.value.name_en).trim());
const missingFields = computed(() => {
  const missing = [];
  if (!isEdit.value && !hasImage(imagePreview.value)) missing.push(isSubForm.value ? tx('صورة القسم الفرعي', 'sub-category image') : tx('صورة القسم', 'category image'));
  if (!nameFilled('ar')) missing.push(tx('الاسم بالعربية', 'Arabic name'));
  if (!nameFilled('en')) missing.push(tx('الاسم بالإنجليزية', 'English name'));
  return missing;
});
const canSubmit = computed(() => missingFields.value.length === 0);
const viewChildren = computed(() => (viewCategory.value
  ? categories.value.filter(child => Number(child.parent_id) === Number(viewCategory.value.id))
  : []));

const openAddModal = () => {
  imageError.value = '';
  isEdit.value = false;
  editingId.value = null;
  form.value = getBaseForm();
  imagePreview.value = null;
  activeLang.value = formLang();
  showFormModal.value = true;
};

const openAddSubModal = (parentCat) => {
  openAddModal();
  form.value.parent_id = parentCat.id;
};

const openEditModal = (cat) => {
  imageError.value = '';
  isEdit.value = true;
  editingId.value = cat.id;
  editingName.value = localizedName(cat.name_i18n, cat.name);
  const nameObj = cat.name_i18n && typeof cat.name_i18n === 'object' ? cat.name_i18n : null;
  const descObj = cat.description_i18n && typeof cat.description_i18n === 'object' ? cat.description_i18n : null;
  form.value = {
    name_ar: nameObj?.ar ?? cat.name ?? '',
    name_en: nameObj?.en ?? '',
    description_ar: descObj?.ar ?? cat.description ?? '',
    description_en: descObj?.en ?? '',
    parent_id: cat.parent_id || '',
    is_active: cat.is_active,
    sort_order: cat.sort_order ?? 0,
    image: null
  };
  imagePreview.value = cat.image || null;
  activeLang.value = formLang();
  showFormModal.value = true;
};

const openViewModal = (cat) => {
  viewCategory.value = cat;
  showViewModal.value = true;
};

const closeView = () => {
  showViewModal.value = false;
  viewCategory.value = null;
};

const closeModal = () => {
  showFormModal.value = false;
  imageError.value = '';
  form.value = getBaseForm();
  imagePreview.value = null;
  activeLang.value = formLang();
};

// Image Upload
const triggerFileInput = () => {
  fileInput.value.click();
};

const cropOptions = () => ({ defaultRatio: '2:3', fileName: 'category', outputType: 'image/jpeg', title: tx('قص وضبط أبعاد صورة القسم (Crop & Resize)', 'Crop & resize category image') });

// Every picked image goes through the crop modal before it is staged for upload.
const handleFileChange = async (e) => {
  const picked = e.target.files?.[0];
  e.target.value = '';
  if (!picked) return;
  const { file, error } = await prepareImage(picked, cropOptions());
  if (error) {
    imageError.value = error;
    triggerAlert(error, 'error');
    return;
  }
  imageError.value = '';
  form.value.image = file;
  imagePreview.value = safeObjectUrl(file, imagePreview.value);
};

const recropCurrentImage = async () => {
  const { file, error } = await recropImage(form.value.image || imagePreview.value, cropOptions());
  if (error) { imageError.value = error; triggerAlert(error, 'error'); }
  if (!file) return;
  imageError.value = '';
  form.value.image = file;
  imagePreview.value = safeObjectUrl(file, imagePreview.value);
};

// Submit form
const submitForm = async () => {
  if (isSubmitting.value) return;
  if (!String(form.value.name_ar || '').trim()) {
    activeLang.value = 'ar';
    triggerAlert('اسم القسم بالعربي مطلوب', 'error');
    return;
  }
  if (!String(form.value.name_en || '').trim()) {
    activeLang.value = 'en';
    triggerAlert('اسم القسم بالإنجليزية مطلوب', 'error');
    return;
  }

  isSubmitting.value = true;
  
  try {
    const payload = toCategoryPayload(form.value);
    if (isEdit.value) {
      await adminCatalogService.updateCategory(editingId.value, payload, form.value.image);
      triggerAlert('تم تحديث القسم بنجاح');
    } else {
      await adminCatalogService.createCategory(payload, form.value.image);
      triggerAlert('تم إضافة القسم بنجاح');
    }
    if (form.value.parent_id) expandedIds.value = { ...expandedIds.value, [form.value.parent_id]: true };
    closeModal();
    fetchCategories();
  } catch (error) {
    if (error.response?.status === 404) {
      // The row on screen is stale: the category (or the main category of a new sub-category) was deleted meanwhile.
      closeModal();
      fetchCategories();
      triggerAlert('هذا القسم (أو قسمه الرئيسي) لم يعد موجودًا، ربما تم حذفه. تم تحديث القائمة.', 'error');
      return;
    }
    const msg = apiErrorMessage(error, 'حدث خطأ أثناء الحفظ');
    triggerAlert(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Delete
const deleteChildrenCount = computed(() => (deleteTarget.value
  ? categories.value.filter(child => Number(child.parent_id) === Number(deleteTarget.value.id)).length
  : 0));
const confirmDelete = (cat) => { deleteTarget.value = cat; };
const closeDelete = () => { if (!isDeleting.value) deleteTarget.value = null; };
const runDelete = async () => {
  if (!deleteTarget.value || isDeleting.value) return;
  // A category that still has products cannot be deleted: say so before calling the API,
  // so the message always matches what really happened (nothing was deleted).
  const linkedProducts = allProducts.value.length ? (productCounts.value[Number(deleteTarget.value.id)] || 0) : 0;
  if (linkedProducts > 0) {
    deleteTarget.value = null;
    triggerAlert(CATEGORY_HAS_PRODUCTS, 'error');
    return;
  }
  isDeleting.value = true;
  try {
    await adminCatalogService.deleteCategory(deleteTarget.value.id);
    deleteTarget.value = null;
    triggerAlert('تم الحذف بنجاح');
    fetchCategories();
  } catch (error) {
    deleteTarget.value = null;
    if (error.response?.status === 404) {
      fetchCategories();
      triggerAlert('هذا القسم لم يعد موجودًا، تم تحديث القائمة.', 'error');
      return;
    }
    const rawMessage = String(error.response?.data?.message || '');
    // The backend reports a category that still owns products with a technical (English / PHP) message.
    const linked = /product/i.test(rawMessage) && !/[\u0600-\u06FF]/.test(rawMessage);
    triggerAlert(linked ? CATEGORY_HAS_PRODUCTS : apiErrorMessage(error, 'تعذر حذف القسم. حاول مرة أخرى.'), 'error');
    fetchCategories();
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.categories-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  direction: inherit;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  padding-bottom: 2rem;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.2rem;
}
.page-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
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

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-end; /* RTL: right align text, icon right */
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  flex-direction: row-reverse;
}
.stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}
.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  margin-top: 0.2rem;
}
.stat-icon-wrapper {
  width: 46px; height: 46px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.active-icon { background: #f3f4f6; color: #660033; }
.total-icon { background: #ecfdf5; color: #059669; }
.sub-icon { background: #f3f4f6; color: #4b5563; }
.main-icon { background: #fefce8; color: #ca8a04; }

/* Filters */
.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  right: 1rem;
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 0.7rem 2.8rem 0.7rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-size: 0.85rem;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: #660033; }

.filter-select {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 160px;
}
.form-select {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-size: 0.85rem;
  color: #374151;
  appearance: none;
  outline: none;
  cursor: pointer;
}
.filter-select .select-icon {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  pointer-events: none;
}

/* Table */
.table-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 1rem;
  text-align: right;
  border-bottom: 1px solid #f3f4f6;
}
.data-table th {
  background: #f9fafb;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  white-space: nowrap;
}
.data-table td {
  font-size: 0.85rem;
  color: #374151;
  vertical-align: middle;
}
.data-row:hover td { background: #f3f4f6; }
.state-row td { text-align: center; color: #6b7280; padding: 2rem; }

/* Columns alignment based on Figma */
.col-name { text-align: right; width: 45%; }
.col-products { text-align: center; width: 15%; }
.col-parent { text-align: center; width: 15%; }
.col-status { text-align: center; width: 10%; }
.col-actions { text-align: left; width: 15%; padding-left: 1.5rem !important; }
.data-table th.col-actions, .data-table th.col-status, .data-table th.col-parent { text-align: center; }
.data-table th.col-actions { text-align: left; }
.data-table th.col-name { text-align: right; }

.cat-name-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  font-weight: 600;
  color: #111827;
  flex-direction: row; /* Image left then text */
}
.cat-image, .cat-icon-placeholder {
  width: 32px; height: 32px;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
}
.cat-image img { width: 100%; height: 100%; object-fit: cover; }
.cat-icon-placeholder svg { color: #9ca3af; }

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
}
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.inactive { background: #f3f4f6; color: #4b5563; }

.expand-btn {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 24px; height: 24px; padding: 0; border: none; border-radius: 6px;
  background: transparent; color: #6b7280; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.expand-btn:hover { background: #e5e7eb; color: #111827; }
.expand-btn svg { transition: transform 0.2s; }
.expand-btn.open svg { transform: rotate(180deg); }
.expand-btn:focus-visible, .children-badge:focus-visible { outline: 2px solid #660033; outline-offset: 2px; }
.children-badge {
  padding: 0.2rem 0.7rem; border: none; border-radius: 20px;
  background: #fdf3f8; color: #660033; font-family: inherit; font-size: 0.7rem; font-weight: 700; cursor: pointer;
}
.children-badge:hover, .children-badge.open { background: #f7e1ec; }
.name-lead { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 24px; }
.data-row.is-sub .cat-name-cell { padding-inline-start: 1.5rem; font-weight: 500; }
.data-row.is-sub td { background: #fcfcfd; }

.parent-badge {
  background: #f3f4f6; color: #660033;
  padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;
}
.dash-mark { color: #9ca3af; }

.products-count {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #6b7280;
  font-weight: 600;
}

.actions-group {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* actions on the left side of RTL table */
  gap: 0.4rem;
}
.action-btn {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}
.action-btn:hover { background: #f3f4f6; }
.delete-btn:hover { color: #dc2626; background: #fef2f2; }
.edit-btn:hover { color: #2563eb; background: #eff6ff; }
.view-btn:hover { color: #059669; background: #ecfdf5; }
.add-sub-btn:hover { color: #660033; background: #f3f4f6; }

/* Alert */
.alert-icon { flex-shrink: 0; }

/* ===== Dialogs (Figma: أقسام المنتجات) ===== */
.cm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
  direction: inherit;
}
.cm-dialog {
  box-sizing: border-box;
  display: flex; flex-direction: column; gap: 0;
  position: relative; overflow-y: auto;
  width: 100%; max-width: 700px; max-height: 95vh;
  padding: 0;
  background: #fff;
  border: none;
  border-radius: 20px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
  color: rgba(47, 43, 61, 0.9);
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  text-align: right;
}
.cm-dialog-sm { max-width: 460px; }
.cm-dialog-sm .cm-delete-body { padding: 0 2rem; }
.cm-dialog-sm .cm-footer { padding: 1.5rem 2rem 2rem; margin-top: 0; }
.cm-header { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2rem 2rem 1.5rem; flex-shrink: 0; }
.cm-heading-row { display: flex; align-items: center; justify-content: center; gap: 0.65rem; }
.cm-header-icon { width: 38px; height: 38px; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: #f3f4f6; color: #660033; }
.cm-heading { min-width: 0; }
.cm-title { margin: 0; font-size: 1.3rem; line-height: 1.5; font-weight: 800; color: #111827; }
.cm-subtitle { margin: 0.4rem 0 0; font-size: 0.85rem; color: #9ca3af; }
.cm-close {
  flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  position: absolute; top: 1.5rem; left: 1.5rem; z-index: 10;
  width: 34px; height: 34px; padding: 0; border: none; border-radius: 50%;
  background: #f3f4f6; color: #9ca3af; cursor: pointer;
}
.cm-close:hover { background: #e5e7eb; color: #111827; }

.cm-form, .cm-view { display: flex; flex-direction: column; gap: 1.5rem; padding: 0 2.5rem 2.5rem; }
.cm-field { display: flex; flex-direction: column; gap: 0.75rem; }
.cm-label { font-size: 0.85rem; font-weight: 700; color: #374151; }
.cm-req { color: #dc2626; margin-inline-start: 2px; }

.cm-input, .cm-textarea {
  box-sizing: border-box; width: 100%;
  background: #f9fafb; color: #1f2937;
  border: 1px solid #e5e7eb; border-radius: 10px;
  font-family: inherit; font-size: 14px; outline: none; text-align: start;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.cm-input { height: 48px; padding: 0.8rem 1rem; }
.cm-textarea { min-height: 96px; padding: 0.8rem 1rem; resize: vertical; }
.cm-input::placeholder, .cm-textarea::placeholder { color: rgba(47, 43, 61, 0.45); }
.cm-input:focus, .cm-textarea:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08); }
.cm-select { position: relative; display: flex; align-items: center; }
.cm-select .cm-input { appearance: none; padding-inline-end: 12px; padding-inline-start: 34px; cursor: pointer; }
.cm-select svg { position: absolute; inset-inline-start: 12px; color: rgba(47, 43, 61, 0.55); pointer-events: none; }

.cm-parent {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border: 1px solid #f0cfe0; border-radius: 6px;
  background: #fdf3f8; color: #660033; font-size: 14px; font-weight: 500;
}
.cm-parent svg { flex-shrink: 0; }

.cm-upload {
  position: relative; box-sizing: border-box; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  height: 160px; padding: 16px;
  border: 2px dashed #e5e7eb; border-radius: 12px;
  background: #f9fafb; cursor: pointer; text-align: center;
  transition: border-color 0.15s, background 0.15s;
}
.cm-upload:hover, .cm-upload:focus-visible { border-color: #660033; background: #fff; outline: none; }
.cm-upload.filled { padding: 0; border-style: solid; border-color: rgba(47, 43, 61, 0.22); background: #f8f7fa; }
.cm-file { display: none; }
.cm-upload-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(47, 43, 61, 0.08); color: rgba(47, 43, 61, 0.75);
}
.cm-upload-text { font-size: 14px; font-weight: 500; color: rgba(47, 43, 61, 0.9); }
.cm-upload-hint { font-size: 12px; color: rgba(47, 43, 61, 0.55); }
.cm-preview { width: 100%; height: 100%; object-fit: contain; }
.cm-preview-actions {
  position: absolute; inset-inline: 0; bottom: 0;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 10px; background: linear-gradient(to top, rgba(15, 12, 24, 0.55), transparent);
}
.cm-change { padding: 4px 10px; border-radius: 6px; background: rgba(255, 255, 255, 0.92); font-size: 12px; font-weight: 600; color: rgba(47, 43, 61, 0.9); }

.cm-lang { display: flex; align-items: center; justify-content: center; }
.cm-lang-icon { color: rgba(47, 43, 61, 0.55); }
.cm-lang-switch { display: inline-flex; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
.cm-lang-btn {
  position: relative; min-width: 96px; padding: 0.4rem 0.9rem; border: none;
  background: transparent; color: #6b7280;
  font-family: inherit; font-size: 0.85rem; font-weight: 800; cursor: pointer;
}
.cm-lang-btn.active { background: #660033; color: #fff; }
.cm-lang-btn.missing::after {
  content: ''; position: absolute; top: 5px; inset-inline-end: 5px;
  width: 5px; height: 5px; border-radius: 50%; background: #dc2626;
}
.cm-image-error { margin: -8px 0 0; padding: 8px 12px; border-radius: 6px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 13px; }
.cm-missing { margin: 0; font-size: 12px; color: rgba(47, 43, 61, 0.6); }

.cm-footer { display: flex; align-items: stretch; gap: 1rem; margin-top: 0.5rem; flex-shrink: 0; }
.cm-footer .cm-btn { flex: 1; }
.cm-footer .cm-btn-primary, .cm-footer .cm-btn-danger { flex: 2; }
.cm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 0.85rem; border-radius: 10px;
  font-family: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: background 0.15s, opacity 0.15s;
}
.cm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cm-btn-cancel { background: #fff; border: 1px solid #e5e7eb; color: #6b7280; }
.cm-btn-cancel:hover { background: #f9fafb; }
.cm-btn-primary { background: #660033; border: none; color: #fff; }
.cm-btn-primary:hover:not(:disabled) { background: #4d0026; }
.cm-btn-danger { background: #ef4444; border: none; color: #fff; }
.cm-btn-danger:hover:not(:disabled) { background: #dc2626; }
.cm-btn:focus-visible, .cm-lang-btn:focus-visible, .cm-close:focus-visible { outline: 2px solid #660033; outline-offset: 2px; }

/* View */
.cm-view-hero { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0; }
.cm-view-img {
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  width: 96px; height: 96px; border-radius: 8px; background: #f8f7fa; border: 1px solid rgba(47, 43, 61, 0.12);
}
.cm-view-img img { width: 100%; height: 100%; object-fit: cover; }
.cm-view-name { margin: 0; font-size: 20px; font-weight: 600; color: rgba(47, 43, 61, 0.9); text-align: center; }
.cm-view-block { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.cm-view-label { font-size: 13px; color: rgba(47, 43, 61, 0.6); }
.cm-view-value { font-size: 15px; font-weight: 500; color: rgba(47, 43, 61, 0.9); }
.cm-view-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.cm-children { display: flex; flex-direction: column; gap: 8px; width: 100%; margin: 4px 0 0; padding: 0; list-style: none; }
.cm-child { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; background: #f8f7fa; }
.cm-child-img {
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
  width: 40px; height: 40px; border-radius: 6px; background: #fff; border: 1px solid rgba(47, 43, 61, 0.12);
}
.cm-child-img img { width: 100%; height: 100%; object-fit: cover; }
.cm-child-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.cm-child-name { font-size: 14px; font-weight: 500; color: rgba(47, 43, 61, 0.9); }
.cm-child-count { font-size: 12px; color: rgba(47, 43, 61, 0.55); }

/* Delete */
.cm-delete-body { display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 22px; color: rgba(47, 43, 61, 0.75); }
.cm-delete-body p { margin: 0; }
.cm-delete-warning { color: #ef4444; }

@media (max-width: 600px) {
  .cm-form, .cm-view { padding: 0 1.25rem 1.5rem; }
  .cm-header { padding: 1.5rem 3.5rem 1rem; }
  .cm-footer { flex-wrap: wrap; }
  .cm-view-pair { grid-template-columns: 1fr; }
}
</style>
