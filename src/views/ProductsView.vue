<template>
  <div class="products-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <h2 class="page-title">{{ tx('إدارة المنتجات', 'Product Management') }}</h2>
        <p class="page-subtitle">{{ tx('إضافة وتعديل وإدارة المنتجات', 'Add, edit and manage products') }}</p>
      </div>
      <button class="add-btn" @click="openAddModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ tx('إضافة منتج جديد', 'Add Product') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
        <div class="stat-card">
        <div class="stat-icon-wrapper main-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('إجمالي المنتجات', 'Total Products') }}</span>
          <span class="stat-value">{{ totalProducts }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper total-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('منتجات نشطة', 'Active Products') }}</span>
          <span class="stat-value">{{ activeProductsCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper empty-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('منتجات غير نشطة', 'Inactive Products') }}</span>
          <span class="stat-value">{{ inactiveProductsCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper active-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('إجمالي المبيعات', 'Total Sales') }}</span>
          <span class="stat-value">{{ totalSales }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('البحث عن منتج...', 'Search products...')" class="search-input" />
      </div>
      <div class="filter-select">
        <select v-model="statusFilter" class="form-select">
          <option value="">{{ tx('جميع الحالات', 'All statuses') }}</option>
          <option value="active">{{ tx('نشط', 'Active') }}</option>
          <option value="inactive">{{ tx('غير نشط', 'Inactive') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="filter-select">
        <select v-model="catFilter" class="form-select">
          <option value="">{{ tx('جميع الأقسام', 'All categories') }}</option>
          <option v-for="c in categoryFilterOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-name">{{ tx('المنتج', 'Product') }}</th>
            <th class="col-price">{{ tx('السعر', 'Price') }}</th>
            <th class="col-stock">{{ tx('المخزون', 'Stock') }}</th>
            <th class="col-sales">{{ tx('المبيعات', 'Sales') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="6">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredProducts.length === 0" class="state-row"><td colspan="6">{{ tx('لا توجد منتجات مطابقة', 'No matching products found') }}</td></tr>
          <template v-else>
            <tr v-for="prod in filteredProducts" :key="prod.id" class="data-row">
              <td class="col-name">
                <div class="prod-name-cell">
                  <div class="prod-image">
                    <img :src="productImage(prod)" :alt="localizedName(prod, prod.name)" @error="handleImageError" />
                    <span v-if="prod.images?.length > 1" class="multi-img-badge" :title="`${prod.images.length} ${tx('صور للمنتج', 'product images')}`">+{{ prod.images.length }}</span>
                  </div>
                  <div class="prod-details">
                    <span class="prod-title">{{ localizedName(prod, prod.name) }}</span>
                    <span class="prod-cat-badge">{{ productCategoryName(prod, categories) || tx('غير محدد', 'Uncategorized') }}</span>
                  </div>
                </div>
              </td>
              <td class="col-price">
                <div class="price-cell">
                  <span class="current-price">{{ formatPrice(prod.price) }} {{ cur }}</span>
                </div>
              </td>
              <td class="col-stock">
                <span :class="['stock-badge', prod.stock > 0 ? 'in-stock' : 'out-of-stock']">
                  {{ prod.stock }}
                </span>
              </td>
              <td class="col-sales">
                <span class="sales-count">{{ prod.sales }} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg></span>
              </td>
              <td class="col-status">
                <span class="status-badge" :class="prod.status === 'active' ? 'active' : 'inactive'">
                  {{ prod.status === 'active' ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn delete-btn" @click="confirmDelete(prod)" :title="tx('حذف', 'Delete')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                  <button class="action-btn edit-btn" @click="openEditModal(prod)" :title="tx('تعديل', 'Edit')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn duplicate-btn" @click="openDuplicateModal(prod)" :title="tx('نسخ المنتج', 'Duplicate')" data-testid="product-duplicate">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button class="action-btn view-btn" @click="openViewModal(prod)" :title="tx('عرض', 'View')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-container" v-if="totalProductsCount > 0">
      <div class="pagination-info">
        <span>{{ tx('إظهار', 'Showing') }} {{ totalProductsCount > 0 ? (currentPage - 1) * perPage + 1 : 0 }} - {{ Math.min(currentPage * perPage, totalProductsCount) }} {{ tx('من أصل', 'of') }} {{ totalProductsCount }} {{ tx('منتج', 'products') }}</span>
      </div>
      <div class="pagination-controls" v-if="totalPages > 1">
        <button class="pagination-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" :title="tx('السابق', 'Previous')" :aria-label="tx('السابق', 'Previous')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="pagination-pages">
          <button v-for="page in totalPages" :key="page" class="pagination-page-btn" :class="{ active: currentPage === page }" @click="goToPage(page)">
            {{ page }}
          </button>
        </div>
        <button class="pagination-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" :title="tx('التالي', 'Next')" :aria-label="tx('التالي', 'Next')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="closeModal">
      <div class="modal-content form-modal form-content">
        <button class="modal-close" @click="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header"><div class="modal-heading-row"><div class="header-icon-main"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><h3 class="modal-title-main">{{ isEdit ? tx('تعديل المنتج', 'Edit Product') : duplicateSource ? tx(`نسخ منتج: ${duplicateSource.name}`, `Duplicate: ${duplicateSource.name}`) : tx('إضافة منتج جديد', 'Add New Product') }}</h3></div><p class="modal-subtitle-main">{{ duplicateSource ? tx('بيانات وصور المنتج منسوخة؛ راجعها ثم احفظ لإضافتها كمنتج جديد.', 'The product data and images are copied; review them, then save to add a new product.') : tx('أدخل معلومات السلعة للجدول', 'Enter product information') }}</p></div>

        <div class="i18n-toggle" role="tablist" aria-label="Language" dir="ltr">
          <button type="button" class="i18n-btn" :class="{ active: activeLang === 'en' }" @click="activeLang = 'en'">English</button>
          <button type="button" class="i18n-btn" :class="{ active: activeLang === 'ar' }" @click="activeLang = 'ar'">العربية</button>
        </div>

        <!-- Tabs -->
        <div class="modal-tabs">
          <button class="tab-btn" :class="{ active: currentTab === 'info' }" @click.prevent="currentTab = 'info'">{{ tx('معلومات المنتج', 'Product Information') }}</button>
          <button class="tab-btn" :class="{ active: currentTab === 'attributes' }" @click.prevent="currentTab = 'attributes'">{{ tx('خصائص المنتج', 'Product Attributes') }}</button>
        </div>
        
        <form @submit.prevent="submitForm" class="prod-form">
          <div v-show="currentTab === 'info'" class="tab-pane">
            <!-- Images Upload -->
            <div class="form-group">
              <div class="image-label-row">
                <label class="form-label mb-0" style="text-align: right;">{{ tx('صور المنتج', 'Product Images') }} <span class="req">*</span></label>
                <span class="images-count-badge">
                  {{ form.existing_images.length + form.new_images.length }} / {{ maxImages }} {{ tx('صور', 'images') }}
                </span>
              </div>
              <div class="image-uploader">
                <!-- Dropzone -->
                <div class="upload-box" @click="triggerFileInput" v-if="(form.existing_images.length + form.new_images.length) < maxImages">
                  <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" multiple class="hidden-input" />
                  <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#660033" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <p>{{ tx('اضغط أو اسحب لرفع صور متعددة للمنتج', 'Click or drag to upload multiple product images') }}<br><span>(JPG, PNG, WebP | {{ tx('بحد أقصى', 'up to') }} {{ maxImages }} {{ tx('صورة', 'images') }})</span></p>
                </div>
                <div class="upload-box disabled" v-else>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  <p>{{ tx('تم بلوغ الحد الأقصى', 'Maximum reached') }} ({{ maxImages }} {{ tx('صورة', 'images') }})</p>
                </div>
                <!-- Images Preview -->
                <div class="preview-grid" v-if="imagePreviews.length > 0 || form.existing_images.length > 0 || duplicateLoading > 0 || duplicateFailed.length > 0">
                  <!-- Existing Images -->
                  <div class="preview-item" v-for="(img, idx) in form.existing_images" :key="'e'+idx">
                    <img :src="img" />
                    <span v-if="idx === 0" class="primary-tag-badge">{{ tx('الرئيسية', 'Primary') }}</span>
                    <button v-else type="button" class="set-primary-btn" @click.prevent="setPrimaryExistingImage(idx)" :title="tx('تعيين كصورة رئيسية للمنتج', 'Set as primary product image')">
                      ★ {{ tx('تعيين كرئيسية', 'Set primary') }}
                    </button>
                    <button type="button" class="remove-img-btn" @click.prevent="removeExistingImage(idx)" :title="tx('حذف الصورة', 'Delete image')">✕</button>
                  </div>
                  <!-- New Staged Images -->
                  <div class="preview-item new-preview-item" v-for="(file, idx) in imagePreviews" :key="'p'+idx">
                    <img :src="file.preview" />
                    <span v-if="form.existing_images.length === 0 && idx === 0" class="primary-tag-badge">{{ tx('الرئيسية', 'Primary') }}</span>
                    <button v-else type="button" class="set-primary-btn" @click.prevent="setPrimaryNewImage(idx)" :title="tx('تعيين كصورة رئيسية للمنتج', 'Set as primary product image')">
                      ★ {{ tx('تعيين كرئيسية', 'Set primary') }}
                    </button>
                    <button type="button" class="remove-img-btn" @click.prevent="removeNewImage(idx)" :title="tx('إلغاء الصورة', 'Remove image')">✕</button>
                    <ImageCropButton compact class="thumb-crop-btn" @crop="recropNewImage(idx)" />
                  </div>
                  <!-- Duplicate: images still downloading from the original product -->
                  <div class="preview-item copy-loading-item" v-for="n in duplicateLoading" :key="'l'+n" data-testid="duplicate-image-loading">
                    <span class="copy-spinner"></span>
                    <small>{{ tx('جاري نسخ الصورة…', 'Copying image…') }}</small>
                  </div>
                  <!-- Duplicate: images that could not be copied -->
                  <div class="preview-item copy-failed-item" v-for="(url, idx) in duplicateFailed" :key="'f'+idx" data-testid="duplicate-image-failed">
                    <img :src="url" />
                    <small>{{ tx('تعذر نسخ الصورة', 'Could not copy') }}</small>
                    <button type="button" class="retry-copy-btn" @click.prevent="retryDuplicateImage(idx)">{{ tx('إعادة المحاولة', 'Retry') }}</button>
                    <button type="button" class="remove-img-btn" @click.prevent="duplicateFailed.splice(idx, 1)" :title="tx('تجاهل الصورة', 'Skip image')">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Basic fields -->
            <div class="form-group" v-show="activeLang === 'ar'">
              <label class="form-label">{{ tx('اسم المنتج (عربي)', 'Product name (Arabic)') }} <span class="req">*</span></label>
              <input type="text" v-model="form.name_ar" class="form-control" placeholder="أدخل اسم المنتج بالعربي" />
            </div>

            <div class="form-group" v-show="activeLang === 'en'">
              <label class="form-label">{{ tx('اسم المنتج (English)', 'Product name (English)') }} <span class="req">*</span></label>
              <input type="text" v-model="form.name_en" class="form-control" placeholder="Product name in English (اسم المنتج بالإنجليزية)" />
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label class="form-label">{{ tx('القسم الرئيسي', 'Main category') }} <span class="req">*</span></label>
                <div class="select-wrapper">
                  <select v-model="form.category_id" class="form-control" required @change="updateSubcats">
                    <option value="" disabled selected>{{ tx('اختر القسم الرئيسي هنا', 'Select main category') }}</option>
                    <option v-for="c in categories" :key="c.id" :value="c.id">{{ categoryOptionLabel(c) }}</option>
                  </select>
                  <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div class="form-group half-width">
                <label class="form-label">{{ tx('القسم الفرعي', 'Subcategory') }}</label>
                <div class="select-wrapper">
                  <select v-model="form.subcategory_id" class="form-control" :disabled="!subCategories.length">
                    <option value="">{{ tx('لا يوجد', 'None') }}</option>
                    <option v-for="sc in subCategories" :key="sc.id" :value="sc.id">{{ categoryOptionLabel(sc) }}</option>
                  </select>
                  <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label class="form-label">{{ tx('السعر', 'Price') }} ({{ cur }}) <span class="req">*</span></label>
                <input type="number" step="0.01" min="0" v-model="form.price" class="form-control no-rtl-issue" placeholder="0.00" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label class="form-label">{{ tx('المخزون', 'Stock') }} <span class="req">*</span></label>
                <input type="number" min="0" v-model="form.quantity" class="form-control no-rtl-issue" placeholder="0" :required="!isEdit" :disabled="isEdit" data-testid="product-stock" />
                <router-link v-if="isEdit && editingId" :to="{ name: 'InventoryProduct', params: { id: editingId } }" class="stock-manage-link" data-testid="manage-stock-link">{{ tx('تعديل المخزون من «إدارة المخزون»', 'Change the stock in “Inventory”') }}</router-link>
              </div>
              <div class="form-group half-width">
                <label class="form-label">{{ tx('الحالة', 'Status') }}</label>
                <div class="select-wrapper">
                  <select v-model="form.is_active" class="form-control">
                    <option :value="true">{{ tx('نشط', 'Active') }}</option>
                    <option :value="false">{{ tx('غير نشط', 'Inactive') }}</option>
                  </select>
                  <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

            <!-- Basic fields -->

            <!-- Content sections: each one is a list of points (type + Enter) -->
            <div class="form-group points-group" data-testid="overview-text">
              <label class="form-label">{{ tabName('overview') }} <span class="req">*</span></label>
              <p class="points-hint">{{ tx(`نص قصير لا يتعدى سطرين، يظهر في تبويب «${tabName('overview')}».`, `A short text of up to two lines, shown in the “${tabName('overview')}” tab.`) }}</p>
              <div class="overview-box">
                <textarea
                  v-show="activeLang === 'ar'"
                  v-model="form.description_ar"
                  dir="rtl"
                  rows="2"
                  :maxlength="overviewMaxLength"
                  class="overview-textarea"
                  placeholder="اكتب نظرة عامة مختصرة عن المنتج في سطرين"
                  @keydown.enter.prevent
                ></textarea>
                <textarea
                  v-show="activeLang === 'en'"
                  v-model="form.description_en"
                  dir="ltr"
                  rows="2"
                  :maxlength="overviewMaxLength"
                  class="overview-textarea"
                  placeholder="Write a short product overview in up to two lines"
                  @keydown.enter.prevent
                ></textarea>
                <span class="overview-counter" dir="ltr">{{ (activeLang === 'ar' ? form.description_ar : form.description_en).length }} / {{ overviewMaxLength }}</span>
              </div>
            </div>

            <div class="form-group points-group" data-testid="points-features">
              <label class="form-label">{{ tabName('features') }}</label>
              <p class="points-hint">{{ tx('تظهر أسفل السعر في صفحة المنتج بعلامة صح، وفي تبويب خاص لو أضفته من إعدادات «تفاصيل المنتج».', 'Shown under the price on the product page with a check mark, and in its own tab if you add one in “Product details” settings.') }}</p>
              <PointListInput
                v-show="activeLang === 'ar'"
                v-model="form.features_ar"
                dir="rtl"
                label="المميزات"
                placeholder="اكتب نقطة ثم اضغط زر الإدخال"
                add-label="إضافة نقطة"
                remove-label="حذف النقطة"
                empty-label="لم تتم إضافة نقاط بعد"
                tip="اضغط زر الإدخال لإضافة نقطة جديدة"
              />
              <PointListInput
                v-show="activeLang === 'en'"
                v-model="form.features_en"
                dir="ltr"
                label="Features"
                placeholder="Type a point and press Enter"
                add-label="Add point"
                remove-label="Remove point"
                empty-label="No points added yet"
                tip="Press Enter to add a new point"
              />
            </div>

            <div class="form-group points-group" data-testid="points-tips">
              <label class="form-label">{{ tabName('installation') }}</label>
              <p class="points-hint">{{ tx(`تظهر في تبويب «${tabName('installation')}».`, `Shown in the “${tabName('installation')}” tab.`) }}</p>
              <PointListInput
                v-show="activeLang === 'ar'"
                v-model="form.tips_ar"
                dir="rtl"
                label="التركيب"
                placeholder="اكتب نقطة ثم اضغط زر الإدخال"
                add-label="إضافة نقطة"
                remove-label="حذف النقطة"
                empty-label="لم تتم إضافة نقاط بعد"
                tip="اضغط زر الإدخال لإضافة نقطة جديدة"
              />
              <PointListInput
                v-show="activeLang === 'en'"
                v-model="form.tips_en"
                dir="ltr"
                label="Installation"
                placeholder="Type a point and press Enter"
                add-label="Add point"
                remove-label="Remove point"
                empty-label="No points added yet"
                tip="Press Enter to add a new point"
              />
            </div>

            <div class="form-group points-group" data-testid="points-shipping_info">
              <label class="form-label">{{ tabName('shipping') }}</label>
              <p class="points-hint">{{ tx(`تظهر في تبويب «${tabName('shipping')}».`, `Shown in the “${tabName('shipping')}” tab.`) }}</p>
              <PointListInput
                v-show="activeLang === 'ar'"
                v-model="form.shipping_info_ar"
                dir="rtl"
                label="الشحن والإرجاع"
                placeholder="اكتب نقطة ثم اضغط زر الإدخال"
                add-label="إضافة نقطة"
                remove-label="حذف النقطة"
                empty-label="لم تتم إضافة نقاط بعد"
                tip="اضغط زر الإدخال لإضافة نقطة جديدة"
              />
              <PointListInput
                v-show="activeLang === 'en'"
                v-model="form.shipping_info_en"
                dir="ltr"
                label="Shipping & Returns"
                placeholder="Type a point and press Enter"
                add-label="Add point"
                remove-label="Remove point"
                empty-label="No points added yet"
                tip="Press Enter to add a new point"
              />
            </div>
          </div>

          <div v-show="currentTab === 'attributes'" class="tab-pane attributes-tab-pane">
            <!-- 1. Colors Management Section -->
            <div v-if="false" class="variant-section-card">
              <div class="variant-section-header">
                <div class="variant-icon-wrapper color-icon-bg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>
                </div>
                <div>
                  <h4 class="variant-section-title">ألوان المنتج (Colors & Finishes)</h4>
                  <p class="variant-section-desc">حدد درجات الألوان المتاحة للمنتج مع شكلها ولونها الواقعي (Hex)</p>
                </div>
              </div>

              <!-- Popular Quick Color Presets -->
              <div class="presets-block">
                <span class="presets-label">ألوان خصائص المنتجات من API (اضغط للإضافة):</span>
                <div class="color-presets-row" v-if="apiColorPresets.length > 0">
                  <button 
                    type="button" 
                    v-for="p in apiColorPresets" 
                    :key="p.label" 
                    class="color-preset-pill" 
                    :class="{ active: isColorSelected(p) }" 
                    @click.prevent="toggleColorPreset(p)"
                  >
                    <span class="preset-dot" :style="{ background: p.color }" :class="{ 'dot-white': isLightColor(p.color) }"></span>
                    <span class="preset-name">{{ p.label }}</span>
                    <span v-if="isColorSelected(p)" class="preset-check">✓</span>
                  </button>
                </div>
                <div v-else class="empty-variants-hint">لا توجد ألوان محملة من API خصائص المنتجات.</div>
              </div>

              <!-- Custom Color Adder -->
              <div class="custom-variant-box">
                <span class="presets-label">إضافة لون مخصص جديد:</span>
                <div class="color-custom-row">
                  <input 
                    type="text" 
                    v-model="customColorName" 
                    placeholder="اسم اللون (مثال: رمادي مطفي، كحلي، أسود ملكي)..." 
                    class="form-control custom-color-name"
                    @keydown.enter.prevent="addCustomColor"
                  />
                  <div class="color-picker-input-box">
                    <input type="color" v-model="customColorHex" class="native-color-picker" title="اختر اللون" />
                    <input type="text" v-model="customColorHex" class="form-control custom-color-hex" placeholder="#111827" />
                  </div>
                  <button type="button" class="btn-add-variant" @click.prevent="addCustomColor">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة اللون
                  </button>
                </div>
              </div>

              <!-- Selected Colors Display -->
              <div class="selected-items-block">
                <div class="selected-header-row">
                  <span class="presets-label">الألوان المختارة للمنتج ({{ form.colors.length }}):</span>
                </div>
                <div class="selected-colors-grid" v-if="form.colors.length > 0">
                  <div class="color-chip-card" v-for="(col, cIdx) in form.colors" :key="cIdx">
                    <div class="chip-swatch" :style="{ background: col.color }" :class="{ 'chip-light': isLightColor(col.color) }"></div>
                    <div class="chip-info">
                      <span class="chip-name">{{ col.label }}</span>
                      <span class="chip-hex">{{ col.color }}</span>
                    </div>
                    <button type="button" class="chip-del-btn" @click.prevent="removeColor(cIdx)" title="إزالة هذا اللون">✕</button>
                  </div>
                </div>
                <div v-else class="empty-variants-hint">
                  لم يتم تحديد ألوان لهذا المنتج. انقر على أحد الألوان المقترحة أعلاه أو أدخل لوناً مخصصاً.
                </div>
              </div>
            </div>

            <!-- 2. Sizes & Dimensions Management Section -->
            <div v-if="false" class="variant-section-card">
              <div class="variant-section-header">
                <div class="variant-icon-wrapper size-icon-bg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div>
                  <h4 class="variant-section-title">المقاسات والأحجام والسعات (Sizes & Dimensions)</h4>
                  <p class="variant-section-desc">حدد المقاسات، الأبعاد، أو السعة المتوفرة للمنتج (مثل: 60 سم، 90 سم، 8 لتر، إلخ)</p>
                </div>
              </div>

              <!-- Popular Quick Size Presets -->
              <div class="presets-block">
                <span class="presets-label">مقاسات وسعات شائعة (اضغط للإضافة):</span>
                <div class="size-presets-row">
                  <button 
                    type="button" 
                    v-for="s in sizePresets" 
                    :key="s" 
                    class="size-preset-pill" 
                    :class="{ active: isSizeSelected(s) }" 
                    @click.prevent="toggleSizePreset(s)"
                  >
                    <span>{{ s }}</span>
                    <span v-if="isSizeSelected(s)" class="preset-check">✓</span>
                  </button>
                </div>
              </div>

              <!-- Custom Size Adder -->
              <div class="custom-variant-box">
                <span class="presets-label">إضافة مقاس أو سعة مخصصة:</span>
                <div class="size-custom-row">
                  <input 
                    type="text" 
                    v-model="customSizeInput" 
                    placeholder="أدخل المقاس أو السعة (مثال: 75×50 سم، 15 لتر، 50 كغم)..." 
                    class="form-control custom-size-input"
                    @keydown.enter.prevent="addCustomSize"
                  />
                  <button type="button" class="btn-add-variant" @click.prevent="addCustomSize">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة المقاس
                  </button>
                </div>
              </div>

              <!-- Selected Sizes Display -->
              <div class="selected-items-block">
                <div class="selected-header-row">
                  <span class="presets-label">المقاسات المحددة للمنتج ({{ form.sizes.length }}):</span>
                </div>
                <div class="selected-sizes-grid" v-if="form.sizes.length > 0">
                  <div class="size-chip-card" v-for="(size, sIdx) in form.sizes" :key="sIdx">
                    <span class="size-chip-text">{{ size }}</span>
                    <button type="button" class="chip-del-btn" @click.prevent="removeSize(sIdx)" title="إزالة هذا المقاس">✕</button>
                  </div>
                </div>
                <div v-else class="empty-variants-hint">
                  لم يتم تحديد مقاسات لهذا المنتج. انقر على أحد المقاسات المقترحة أعلاه أو أضف مقاساً مخصصاً.
                </div>
              </div>
            </div>

            <div v-if="attributesLoading" class="attributes-state-card">
              {{ tx('جاري تحميل خصائص المنتجات من API...', 'Loading product attributes from API...') }}
            </div>
            <div v-else-if="attributesLoadError" class="attributes-state-card error">
              {{ tx('تعذر تحميل خصائص المنتجات. اضغط لإعادة المحاولة.', 'Unable to load product attributes. Retry to try again.') }}
              <button type="button" class="attributes-retry-btn" @click.prevent="fetchDependencies">{{ tx('إعادة المحاولة', 'Retry') }}</button>
            </div>

            <!-- Core attributes (marked «أساسية» on the attributes page): one value each, or «غير متوفر» -->
            <div class="variant-section-card core-attributes-section" v-else-if="coreAttributeRows.length > 0">
              <div class="core-attrs-header">
                <h4 class="variant-section-title">{{ tx('الخصائص الأساسية', 'Core attributes') }}</h4>
                <p class="variant-section-desc">{{ tx('اختر قيمة واحدة لكل خاصية، أو «غير متوفر» لو المنتج ما فيهوش الخاصية دي. القيم المختارة تظهر في المواصفات الفنية في صفحة المنتج.', 'Pick one value for each attribute, or «Not available» if the product does not have it. The chosen values show in the product\'s technical specifications.') }}</p>
              </div>
              <div class="core-attrs-list">
                <div v-for="row in coreAttributeRows" :key="row.attribute.id" class="core-attr-row" :class="{ 'is-missing': !coreRowDone(row.attribute) }" :data-core-attribute="row.attribute.id">
                  <div class="core-attr-title">
                    <span>{{ row.attribute.label || row.attribute.name }} <span class="req">*</span></span>
                    <span class="core-attr-count" :class="{ complete: coreRowDone(row.attribute) }">
                      {{ coreRowStatus(row.attribute) }}
                    </span>
                  </div>
                  <div class="core-attr-values">
                    <button
                      v-for="val in row.attribute.values"
                      :key="val.id"
                      type="button"
                      class="core-attr-chip"
                      :class="{ active: isApiAttributeSelected(row.attribute.name, val.label) }"
                      :aria-pressed="isApiAttributeSelected(row.attribute.name, val.label)"
                      @click="toggleApiAttribute(row.attribute.name, val.label)"
                    >
                      <span v-if="val.color" class="api-attribute-color-dot" :style="{ background: val.color }"></span>
                      <span class="val-text">{{ val.label }}</span>
                    </button>
                    <span v-if="!row.attribute.values || !row.attribute.values.length" class="text-muted-xs">{{ tx('لا توجد قيم مسجلة لهذه الخاصية.', 'No values are registered for this attribute.') }}</span>
                  </div>
                  <button
                    type="button"
                    class="core-attr-chip not-available-chip"
                    :class="{ active: isNotAvailable(row.attribute.name) }"
                    :aria-pressed="isNotAvailable(row.attribute.name)"
                    data-testid="core-not-available"
                    @click="setNotAvailable(row.attribute.name)"
                  >{{ tx('غير متوفر', 'Not available') }}</button>
                </div>
              </div>
            </div>

            <!-- Other product attributes -->
            <div class="variant-section-card api-attributes-section" v-if="otherAttributesList.length > 0 && !attributesLoading && !attributesLoadError">
              <div class="core-attrs-header">
                <h4 class="variant-section-title">{{ tx('مواصفات إضافية', 'Additional specifications') }}</h4>
                <p class="variant-section-desc">{{ tx('قيمة واحدة لكل مواصفة (اختيارية).', 'One value per specification (optional).') }}</p>
              </div>
              <div class="other-attrs-list">
                  <div v-for="attr in otherAttributesList" :key="attr.id" class="other-attr-row">
                    <label class="other-attr-label">{{ attr.label }} ({{ attr.name }})</label>
                    <div class="attr-values-list" v-if="attr.values && attr.values.length > 0">
                      <button
                        v-for="val in attr.values"
                        :key="val.id"
                        class="attr-val-checkbox"
                        type="button"
                        :aria-pressed="isApiAttributeSelected(attr.name, val.label)"
                        @click="toggleApiAttribute(attr.name, val.label)"
                      >
                        <span class="checkmark" :class="{ active: isApiAttributeSelected(attr.name, val.label) }"></span>
                        <span v-if="val.color" class="api-attribute-color-dot" :style="{ background: val.color }"></span>
                        <span class="val-text">{{ val.label }}</span>
                      </button>
                  </div>
                  <div v-else class="attr-no-vals">
                    <span class="text-muted-xs">{{ tx('لا توجد قيم مسجلة لهذه الخاصية.', 'No values are registered for this attribute.') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Full Technical Specifications (Key-Value) Section -->
            <div v-if="false" class="variant-section-card" style="background: rgba(255, 255, 255, 1);">
              <div class="variant-section-header">
                <div class="variant-icon-wrapper other-icon-bg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <div>
                  <h4 class="variant-section-title">المواصفات الفنية الكاملة (Full Technical Specifications)</h4>
                  <p class="variant-section-desc">تغذي جدول المواصفات الفنية المباشر في صفحة تفاصيل المنتج (كالارتفاع، العرض، السعة، الجهد، وغيرها)</p>
                </div>
              </div>

              <!-- Quick Presets -->
              <div class="presets-block">
                <span class="presets-label">مواصفات شائعة سريعة (اضغط لاختيار اسم الخاصية):</span>
                <div class="specs-presets-row">
                  <button 
                    type="button" 
                    v-for="preset in specPresets" 
                    :key="preset" 
                    class="spec-preset-pill"
                    @click.prevent="newSpecKey = preset"
                  >
                    {{ preset }}
                  </button>
                </div>
              </div>

              <!-- Input Row -->
              <div class="add-spec-row">
                <input 
                  type="text" 
                  v-model="newSpecKey" 
                  class="form-control" 
                  placeholder="اسم المواصفة (مثلاً: الارتفاع، السعة)" 
                />
                <input 
                  type="text" 
                  v-model="newSpecVal" 
                  class="form-control" 
                  placeholder="القيمة (مثلاً: 59.5 سم أو 65 لتر)" 
                  @keyup.enter.prevent="addCustomSpec"
                />
                <button type="button" class="btn-add-spec" @click.prevent="addCustomSpec">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  إضافة
                </button>
              </div>

              <!-- Specs Table -->
              <div class="specs-table-wrapper" v-if="form.specs && form.specs.length > 0">
                <table class="specs-admin-table">
                  <thead>
                    <tr>
                      <th style="width: 45%;">اسم المواصفة</th>
                      <th>القيمة</th>
                      <th style="width: 60px; text-align: center;">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(sp, idx) in form.specs" :key="idx">
                      <td class="font-bold">{{ sp.key }}</td>
                      <td>{{ sp.value }}</td>
                      <td style="text-align: center;">
                        <button type="button" class="chip-del-btn" @click.prevent="removeSpec(idx)" title="حذف المواصفة">✕</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-variants-hint">
                لم يتم إدخال مواصفات فنية إضافية بعد. يمكنك كتابة أو اختيار اسم المواصفة وقيمتها أعلاه لتظهر ديناميكياً بجدول المواصفات بالمتجر.
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? tx('جاري الحفظ...', 'Saving...') : (isEdit ? tx('تعديل', 'Update') : tx('إضافة المنتج', 'Add Product')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Modal Details -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false;">
      <div class="modal-content view-content no-padding-top">
        <button class="modal-close floating-close" @click="showViewModal = false;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="view-image-slider">
          <img :src="productImage(viewProduct, currentImageIdx)" class="view-main-image" @error="handleImageError" />
          <button v-if="viewProduct?.images?.length > 1" class="slider-btn prev-btn" @click.prevent="prevImage">&#10095;</button>
          <button v-if="viewProduct?.images?.length > 1" class="slider-btn next-btn" @click.prevent="nextImage">&#10094;</button>
          <div v-if="viewProduct?.images?.length > 1" class="image-indicator">{{currentImageIdx + 1}} / {{viewProduct.images.length}}</div>
        </div>
        <div class="view-thumbnails" v-if="viewProduct?.images?.length > 1">
          <img v-for="(img, idx) in viewProduct.images" :key="idx" :src="img" class="thumb-img" :class="{active: currentImageIdx === idx}" @click="currentImageIdx = idx" @error="handleImageError" />
        </div>

        <div class="view-body-wrapper">
          <div class="view-title-row">
            <div>
              <h3 class="view-title">{{ localizedName(viewProduct, viewProduct?.name) }}</h3>
              <p class="view-subtitle">{{ productCategoryName(viewProduct, categories) || tx('غير محدد', 'Uncategorized') }} <span v-if="viewProduct?.subcategory">/ {{ viewProduct?.subcategory }}</span></p>
            </div>
            <div class="view-status-badge" :class="viewProduct?.status === 'active' ? 'active' : 'inactive'">
              {{ viewProduct?.status === 'active' ? tx('نشط', 'Active') : tx('غير نشط', 'Inactive') }}
            </div>
          </div>

          <div class="view-stats-grid">
            <div class="v-stat-box">
              <span class="v-stat-label">{{ tx('السعر', 'Price') }}</span>
              <span class="v-stat-value green-text">{{ formatPrice(viewProduct?.price) }} <span style="font-size: 0.75rem">{{ cur }}</span></span>
            </div>
            <div class="v-stat-box">
              <span class="v-stat-label">{{ tx('المتبقي', 'Remaining') }}</span>
              <span class="v-stat-value px-badge">{{ viewProduct?.stock }}</span>
            </div>
            <div class="v-stat-box">
              <span class="v-stat-label">{{ tx('المبيعات', 'Sales') }}</span>
              <span class="v-stat-value">{{ viewProduct?.sales }} {{ tx('مرة', 'times') }}</span>
            </div>
          </div>

          <div class="view-sections">
            <div class="v-section" v-if="viewProduct?.description">
              <h4 class="v-section-title">{{ tx('نبذة عن المنتج', 'About the product') }}</h4>
              <div class="v-section-content" style="white-space: pre-wrap;">{{ toLines(viewProduct?.description).join('\n') }}</div>
            </div>
            <div class="v-section" v-if="viewProduct?.features">
              <h4 class="v-section-title">{{ tx('المميزات الرئيسية', 'Key features') }}</h4>
              <div class="v-section-content">
                <ul class="v-feature-list">
                  <li v-for="(feature, idx) in toLines(viewProduct.features)" :key="idx" v-show="feature.trim() !== ''">
                    {{ feature.replace(/^[-*•]\s*/, '').trim() }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="v-section" v-if="viewProduct?.tips">
              <h4 class="v-section-title">{{ tx('نصائح', 'Tips') }}</h4>
              <div class="v-section-content">
                <ul class="v-feature-list">
                  <li v-for="(tip, idx) in toLines(viewProduct.tips)" :key="idx" v-show="tip.trim() !== ''">
                    {{ tip.replace(/^[-*•]\s*/, '').trim() }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="v-section" v-if="viewProduct?.shipping_info">
              <h4 class="v-section-title">{{ tx('الشحن والضمان', 'Shipping and warranty') }}</h4>
              <div class="v-section-content" style="white-space: pre-wrap;">{{ toLines(viewProduct.shipping_info).join('\n') }}</div>
            </div>
            <div class="v-section" v-if="Object.keys(viewProduct?.attributes || {}).length > 0">
              <h4 class="v-section-title">{{ tx('خصائص المنتج', 'Product attributes') }}</h4>
              <div class="v-section-content">
                <div class="v-attr-row" v-for="(vals, key) in viewProduct.attributes" :key="key">
                  <span class="v-attr-key">{{ key }}:</span> 
                  <div class="v-attr-vals">
                    <span class="v-attr-chip" v-for="val in resolveAttributeValues(key, vals)" :key="val.label">
                      <span class="v-val-text">{{ val.label }}</span>
                      <span v-if="val.color" class="color-dot" :style="{background: val.color}"></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="view-footer-actions">
            <button class="btn-cancel" @click="showViewModal = false;">{{ tx('إغلاق', 'Close') }}</button>
            <button class="btn-outline-edit" @click="showViewModal = false; openDuplicateModal(viewProduct);" data-testid="view-duplicate">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {{ tx('نسخ المنتج', 'Duplicate') }}
            </button>
            <button class="btn-outline-edit" @click="showViewModal=false; openEditModal(viewProduct); ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>  
              {{ tx('تعديل المنتج', 'Edit product') }}
            </button>
          </div>
        </div>
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
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted, watch } from 'vue';
import PointListInput from '../components/PointListInput.vue';
import { useAdminText } from '../composables/useAdminText';
import adminCatalogService from '../application/adminCatalogService';
import { productCategoryName, toLines, toProductPayload } from '../domain/catalog/adminCatalog';
import { loadSavedCoreIds, resolveCoreIds, splitByCoreIds } from '../services/coreAttributes';
import { loadSavedProductTabs } from '../services/productTabs';
import { sourceTitle } from '../domain/productTabs';
import { dedupeColorOptions, isColorAttribute, normalizeProductAttributes } from '../utils/productAttributes';
import { isTestProduct, visibleCategories, visibleProducts } from '../utils/catalogVisibility';
import { safeObjectUrl } from '../utils/adminSecurity';
import ImageCropModal from '../components/ImageCropModal.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';

const { tx, locale } = useAdminText();
const { cur } = useCurrencyLabel();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();
const localizedName = (item, fallback = '') => {
  if (!item || typeof item !== 'object') return fallback || item || '';
  const language = localStorage.getItem('lang') === 'en' ? 'en' : 'ar';
  return item.name_i18n?.[language] || item.name_i18n?.ar || item.name_i18n?.en || item.name || fallback;
};

// States
const products = ref([]);
const categories = ref([]);
const categoryOptionLabel = (category) => (category.is_active === false || category.is_active === 0
  ? `${category.name} (${tx('غير نشط', 'Inactive')})`
  : category.name);
// Filter list: every main category followed by its sub-categories.
const categoryFilterOptions = computed(() => categories.value.flatMap(main => [
  { id: main.id, label: categoryOptionLabel(main) },
  ...(main.subchildren || []).map(sub => ({ id: sub.id, label: `— ${categoryOptionLabel(sub)}` })),
]));
const attributesList = ref([]);
const attributesLoading = ref(false);
const attributesLoadError = ref(false);
const loading = ref(false);

const searchQuery = ref('');
const statusFilter = ref('');
const catFilter = ref('');

// Pagination
const currentPage = ref(1);
const perPage = ref(50);
const totalProductsCount = ref(0);

const customInputs = ref({});
const customAttributes = ref({});

const maxImages = 4;
const overviewMaxLength = 200; // keeps the overview to roughly two lines on the product page

const presetColorMap = {
  'أسود': '#111827',
  'black': '#111827',
  'فضي': '#9ca3af',
  'فضي استانلس': '#9ca3af',
  'silver': '#9ca3af',
  'ستانلس': '#9ca3af',
  'inox': '#9ca3af',
  'أبيض': '#ffffff',
  'white': '#ffffff',
  'رمادي': '#4b5563',
  'رمادي داكن': '#4b5563',
  'gray': '#4b5563',
  'grey': '#4b5563',
  'ذهبي': '#d97706',
  'ذهبي شامبانيا': '#d97706',
  'gold': '#d97706',
  'أحمر': '#dc2626',
  'red': '#dc2626',
  'أزرق': '#2563eb',
  'أزرق كحلي': '#1e3a8a',
  'blue': '#2563eb',
  'بيج': '#d4b996',
  'beige': '#d4b996',
  'برتقالي': '#f97316',
  'orange': '#f97316',
  'بني': '#78350f',
  'brown': '#78350f'
};

const getPresetColorHex = (name) => {
  if (!name) return null;
  const trimmed = String(name).trim().toLowerCase();
  return presetColorMap[trimmed] || presetColorMap[String(name).trim()] || null;
};

const isLightColor = (hex) => {
  if (!hex) return false;
  const h = String(hex).trim().toLowerCase();
  if (h === '#ffffff' || h === '#fff' || h === 'white' || h === 'أبيض') return true;
  if (h.startsWith('#') && h.length >= 7) {
    const r = parseInt(h.substr(1, 2), 16) || 0;
    const g = parseInt(h.substr(3, 2), 16) || 0;
    const b = parseInt(h.substr(5, 2), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 190;
  }
  return false;
};

// Standard color choices are sourced from the product-attributes API.
const apiColorPresets = computed(() => {
  const colorAttribute = attributesList.value.find(attribute => isColorAttribute(attribute));
  return dedupeColorOptions((colorAttribute?.values || [])
    .map(value => ({
      label: value.label,
      color: value.color || getPresetColorHex(value.label) || '#111827',
    }))
    .filter(value => value.label));
});

const sizePresets = [
  '60 سم',
  '90 سم',
  '70 سم',
  '6 لتر',
  '8 لتر',
  '10 لتر',
  '12.5 كغ',
  'صغير (S)',
  'وسط (M)',
  'كبير (L)'
];

const customColorName = ref('');
const customColorHex = ref('#111827');
const customSizeInput = ref('');

// All rendered standard attributes displayed in the product form come from the API.
// The legacy custom sections are intentionally removed from the attributes tab.
const apiAttributesList = computed(() => attributesList.value);
// Core attributes are the ones marked «أساسية» on the attributes page (settings key core_attribute_ids);
// they come first and need one value each, or «غير متوفر». Every attribute takes a single value.
const savedCoreIds = ref(null);
// Field names follow the product page tab names set in Settings > Product details.
const savedProductTabs = ref(null);
const tabName = (source) => sourceTitle(savedProductTabs.value, source, locale.value === 'en' ? 'en' : 'ar');
const coreAndOtherAttributes = computed(() => {
  const { core, others } = splitByCoreIds(apiAttributesList.value, resolveCoreIds(savedCoreIds.value, apiAttributesList.value));
  return { core: core.map((attribute) => ({ attribute })), others };
});
const coreAttributeRows = computed(() => coreAndOtherAttributes.value.core);
const otherAttributesList = computed(() => coreAndOtherAttributes.value.others);
const selectedCount = (attributeName) => (
  Array.isArray(form.value.selectedAttributes[attributeName]) ? form.value.selectedAttributes[attributeName].length : 0
);
const isNotAvailable = (attributeName) => Boolean(form.value.notAvailable?.[attributeName]);
const setNotAvailable = (attributeName) => {
  const next = !isNotAvailable(attributeName);
  form.value.notAvailable = { ...(form.value.notAvailable || {}), [attributeName]: next };
  if (next) form.value.selectedAttributes = { ...form.value.selectedAttributes, [attributeName]: [] };
};
const coreRowDone = (attribute) => isNotAvailable(attribute.name) || selectedCount(attribute.name) === 1;
const coreRowStatus = (attribute) => {
  if (isNotAvailable(attribute.name)) return tx('غير متوفر', 'Not available');
  const count = selectedCount(attribute.name);
  if (count === 1) return form.value.selectedAttributes[attribute.name][0];
  if (count > 1) return tx('اختر قيمة واحدة فقط', 'Pick one value only');
  return tx('لم يتم الاختيار', 'Not chosen');
};

const isApiAttributeSelected = (attributeName, valueLabel) => (
  Array.isArray(form.value.selectedAttributes[attributeName]) &&
  form.value.selectedAttributes[attributeName].includes(valueLabel)
);

const toggleApiAttribute = (attributeName, valueLabel) => {
  const selected = Array.isArray(form.value.selectedAttributes[attributeName])
    ? form.value.selectedAttributes[attributeName]
    : [];
  // One value per attribute: picking another value replaces it; picking it again clears it.
  const checked = selected.length === 1 && selected[0] === valueLabel;
  const next = checked ? [] : [valueLabel];
  if (form.value.notAvailable?.[attributeName]) {
    form.value.notAvailable = { ...form.value.notAvailable, [attributeName]: false };
  }

  form.value.selectedAttributes = {
    ...form.value.selectedAttributes,
    [attributeName]: next,
  };
};

const toggleColorPreset = (preset) => {
  form.value.colors = dedupeColorOptions(form.value.colors);
  const idx = form.value.colors.findIndex(c => c.label === preset.label || (c.color && c.color.toLowerCase() === preset.color.toLowerCase()));
  if (idx > -1) {
    form.value.colors.splice(idx, 1);
  } else {
    form.value.colors.push({ label: preset.label, color: preset.color });
  }
};

const isColorSelected = (preset) => {
  return (form.value.colors || []).some(c => c.label === preset.label || (c.color && c.color.toLowerCase() === preset.color.toLowerCase()));
};

const addCustomColor = () => {
  const name = customColorName.value.trim();
  const hex = customColorHex.value.trim() || '#111827';
  if (!name) {
    triggerAlert('يرجى كتابة اسم اللون', 'error');
    return;
  }
  const exists = form.value.colors.some(c => c.label.toLowerCase() === name.toLowerCase());
  if (!exists) {
    form.value.colors.push({ label: name, color: hex });
    form.value.colors = dedupeColorOptions(form.value.colors);
    customColorName.value = '';
    customColorHex.value = '#111827';
  } else {
    triggerAlert('هذا اللون مضاف بالفعل للمنتج', 'error');
  }
};

const removeColor = (idx) => {
  form.value.colors.splice(idx, 1);
};

const toggleSizePreset = (size) => {
  const idx = form.value.sizes.indexOf(size);
  if (idx > -1) {
    form.value.sizes.splice(idx, 1);
  } else {
    form.value.sizes.push(size);
  }
};

const isSizeSelected = (size) => {
  return (form.value.sizes || []).includes(size);
};

const addCustomSize = () => {
  const s = customSizeInput.value.trim();
  if (!s) return;
  if (!form.value.sizes.includes(s)) {
    form.value.sizes.push(s);
    customSizeInput.value = '';
  } else {
    triggerAlert('هذا المقاس مضاف بالفعل للمنتج', 'error');
  }
};

const removeSize = (idx) => {
  form.value.sizes.splice(idx, 1);
};

const hasColorType = (attr) => {
  return isColorAttribute(attr);
};

// Specifications Management
const specPresets = [
  'الارتفاع', 'العرض', 'العمق', 'السعة', 'الجهد الكهربائي', 
  'نوع الطاقة', 'المؤقت الرقمي', 'وظائف الطهي', 'نظام الإشعال', 
  'صمام الأمان', 'بلد المنشأ', 'الضمان'
];
const newSpecKey = ref('');
const newSpecVal = ref('');

const addCustomSpec = () => {
  const k = newSpecKey.value.trim();
  const v = newSpecVal.value.trim();
  if (!k) {
    triggerAlert('يرجى تحديد أو كتابة اسم المواصفة', 'error');
    return;
  }
  if (!v) {
    triggerAlert('يرجى كتابة قيمة المواصفة', 'error');
    return;
  }
  if (!Array.isArray(form.value.specs)) {
    form.value.specs = [];
  }
  const existingIdx = form.value.specs.findIndex(s => s.key === k);
  if (existingIdx > -1) {
    form.value.specs[existingIdx].value = v;
  } else {
    form.value.specs.push({ key: k, value: v });
  }
  newSpecKey.value = '';
  newSpecVal.value = '';
};

const removeSpec = (idx) => {
  if (form.value.specs && form.value.specs.length > idx) {
    form.value.specs.splice(idx, 1);
  }
};

// Modals
const showFormModal = ref(false);
const showViewModal = ref(false);
const isEdit = ref(false);
// Duplicating: the product being copied, and the state of copying its images.
const duplicateSource = ref(null);
const duplicateLoading = ref(0);
const duplicateFailed = ref([]);
let duplicateRun = 0;
const editingId = ref(null);
const currentTab = ref('info');
const isSubmitting = ref(false);
const viewProduct = ref(null);
const currentImageIdx = ref(0);

const fileInput = ref(null);
const imagePreviews = ref([]); // new uploads
// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.
const formLang = () => (locale.value === 'en' ? 'en' : 'ar');
const activeLang = ref(formLang());

const form = ref({
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  price: '',
  discount: '',
  quantity: '',
  is_active: true,
  category_id: '',
  subcategory_id: '',
  features_ar: '',
  features_en: '',
  tips_ar: '',
  tips_en: '',
  shipping_info_ar: '',
  shipping_info_en: '',
  existing_images: [],
  new_images: [],
  colors: [], // Array of { label, color }
  sizes: [], // Array of strings e.g. ['60 سم', '90 سم']
  specs: [], // Array of { key, value }
  selectedAttributes: {} // structured as { attrName: [val1, val2] }
});
const subCategories = ref([]);

// Stats Computed
const overallStats = ref({
  total: 0,
  active: 0,
  inactive: 0,
  totalSales: 0,
  isLoaded: false
});

const totalProducts = computed(() => {
  if (overallStats.value.isLoaded && overallStats.value.total > 0) {
    return overallStats.value.total;
  }
  return totalProductsCount.value;
});

const activeProductsCount = computed(() => {
  if (overallStats.value.isLoaded) {
    return overallStats.value.active;
  }
  return products.value.filter(p => p.status === 'active' || p.is_active === true || p.is_active === 1).length;
});

const inactiveProductsCount = computed(() => {
  if (overallStats.value.isLoaded) {
    return overallStats.value.inactive;
  }
  return products.value.filter(p => p.status !== 'active' && !p.is_active && p.is_active !== 1).length;
});

const totalSales = computed(() => {
  if (overallStats.value.isLoaded) {
    return overallStats.value.totalSales;
  }
  return products.value.reduce((sum, p) => sum + Number(p.sales || 0), 0);
});

// Pagination Computed
const totalPages = computed(() => Math.ceil(totalProductsCount.value / perPage.value) || 1);

// Filtering
// A main category matches its own products and those of its sub-categories.
const filterCategoryIds = computed(() => {
  const main = categories.value.find(c => Number(c.id) === Number(catFilter.value));
  return new Set([Number(catFilter.value), ...((main?.subchildren || []).map(sub => Number(sub.id)))]);
});

const filteredProducts = computed(() => {
  const q = (searchQuery.value || '').toLowerCase();
  return products.value.filter(p => !isTestProduct(p)).filter(p => {
    const nameAr = (p.name_i18n?.ar || p.name || '').toString().toLowerCase();
    const nameEn = (p.name_i18n?.en || '').toString().toLowerCase();
    const sku = (p.sku || '').toString().toLowerCase();
    const matchQ = !q || nameAr.includes(q) || nameEn.includes(q) || sku.includes(q);
    const matchS = statusFilter.value ? (
      statusFilter.value === 'active' ? (p.status === 'active' || p.is_active === true || p.is_active === 1) :
      (p.status !== 'active' && !p.is_active && p.is_active !== 1)
    ) : true;
    const matchC = catFilter.value ? filterCategoryIds.value.has(Number(p.category_id)) : true;
    return matchQ && matchS && matchC;
  });
});

// Watch filters and reset page to 1
watch([catFilter, statusFilter, searchQuery], () => {
  currentPage.value = 1;
  fetchProducts();
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

// Utils
const formatPrice = (p) => Number(p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const productImage = (product, index = 0) => {
  const rawImage = Array.isArray(product?.images) ? product.images[index] : product?.images;
  const image = rawImage && typeof rawImage === 'object'
    ? (rawImage.image_url || rawImage.url || rawImage.image || rawImage.path)
    : rawImage;
  return image || '/brand/tijara-logo.png';
};
const handleImageError = (event) => {
  if (event?.target?.getAttribute('src') !== '/brand/tijara-logo.png') {
    event.target.src = '/brand/tijara-logo.png';
  }
};

// The dashboard API returns discount as an amount, while the product form
// edits it as a percentage. Normalize both shapes before rendering/submitting.
const normalizeDiscountPercent = (discount, price) => {
  const rawDiscount = Number(discount);
  const rawPrice = Number(price);
  if (!Number.isFinite(rawDiscount) || rawDiscount <= 0) return 0;
  if (rawDiscount > 100 && rawPrice > 0 && rawDiscount <= rawPrice) {
    return Number(((rawDiscount / rawPrice) * 100).toFixed(2));
  }
  return Math.min(rawDiscount, 100);
};


// Pagination
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchProducts();
};

// Fetch Data
const fetchProducts = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      // Admin must be able to manage records in either state. Public catalog
      // endpoints remain active-only; this flag is scoped to the admin API.
      include_inactive: 1,
      show_all: 1,
    };

    if (catFilter.value) {
      params.category_id = catFilter.value;
    }
    if (statusFilter.value) {
      params.status = statusFilter.value;
      if (statusFilter.value === 'active') params.is_active = 1;
      else if (statusFilter.value === 'inactive') params.is_active = 0;
    }
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    const mainCategory = catFilter.value
      ? categories.value.find(c => Number(c.id) === Number(catFilter.value))
      : null;
    const subIds = (mainCategory?.subchildren || []).map(sub => sub.id);
    if (subIds.length) {
      // The API filters by one exact category id, so a main category is the
      // union of itself and its sub-categories, paginated here.
      const { page: _page, per_page: _perPage, category_id: _categoryId, ...baseParams } = params;
      const lists = await Promise.all([mainCategory.id, ...subIds].map(id => (
        adminCatalogService.listAllProducts({ ...baseParams, category_id: id })
      )));
      const merged = [...new Map(lists.flat().map(product => [product.id, product])).values()]
        .filter(product => !isTestProduct(product))
        .sort((a, b) => Number(b.id) - Number(a.id));
      totalProductsCount.value = merged.length;
      const start = (currentPage.value - 1) * perPage.value;
      products.value = merged.slice(start, start + perPage.value);
    } else {
      const res = await adminCatalogService.listProducts(params);
      const apiProducts = res.data || res.items || [];
      products.value = visibleProducts(apiProducts);
      const apiTotal = Number(res.meta?.total ?? res.total ?? products.value.length);
      totalProductsCount.value = Math.max(0, apiTotal - apiProducts.filter(isTestProduct).length);
    }
  } catch {
    triggerAlert('فشل استيراد المنتجات', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const allList = await adminCatalogService.listAllProducts({ include_inactive: 1, show_all: 1 });
    const visibleList = visibleProducts(allList);
    const totalCount = visibleList.length;
    const activeCount = visibleList.filter(p => p.status === 'active').length;
    const inactiveCount = visibleList.filter(p => p.status !== 'active').length;
    const salesSum = visibleList.reduce((sum, p) => sum + Number(p.sales || p.sales_count || p.total_sold || 0), 0);
    overallStats.value = { total: totalCount, active: activeCount, inactive: inactiveCount, totalSales: salesSum, isLoaded: true };
    totalProductsCount.value = totalCount;
  } catch (err) {
    console.error('Failed to fetch overall product stats:', err);
  }
};

const fetchDependencies = async () => {
  attributesLoading.value = true;
  attributesLoadError.value = false;
  try {
    const [allCategories, rawAttributes, coreIds, productTabs] = await Promise.all([
      adminCatalogService.listCategories(),
      adminCatalogService.listAttributes(),
      loadSavedCoreIds().catch(() => savedCoreIds.value),
      loadSavedProductTabs().catch(() => savedProductTabs.value),
    ]);
    savedCoreIds.value = coreIds;
    savedProductTabs.value = productTabs;
    const visibleCategoryList = visibleCategories(allCategories);
    categories.value = visibleCategoryList.filter(c => !c.parent_id);
    const allC = visibleCategoryList;
    categories.value.forEach(c => {
      c.subchildren = allC.filter(sc => Number(sc.parent_id) === Number(c.id));
    });

    const normalizedAttributes = normalizeProductAttributes(rawAttributes).filter(a => a.is_active);
    if (!normalizedAttributes.length) {
      throw new Error('Product attributes API returned an empty list.');
    }
    attributesList.value = normalizedAttributes;
  } catch (err) {
    attributesLoadError.value = true;
    console.error('Failed to fetch dependencies', err);
  } finally {
    attributesLoading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
  fetchStats();
  fetchDependencies();
});

// Category -> sub dropdown update
const updateSubcats = () => {
  const cat = categories.value.find(c => c.id === form.value.category_id);
  subCategories.value = cat ? (cat.subchildren || []) : [];
  if (!subCategories.value.find(sc => sc.id === form.value.subcategory_id)) {
    form.value.subcategory_id = '';
  }
};

// Modals Setup
const openAddModal = () => {
  resetDuplicate();
  // Categories may have been added since the page loaded, so always re-read them.
  fetchDependencies();
  isEdit.value = false;
  editingId.value = null;
  currentTab.value = 'info';
  activeLang.value = formLang();
  imagePreviews.value = [];
  subCategories.value = [];
  customColorName.value = '';
  customColorHex.value = '#111827';
  customSizeInput.value = '';
  
  const selAttr = {};
  const custAttr = {};
  const cInputs = {};
  attributesList.value.forEach(a => { 
    selAttr[a.name] = []; 
    custAttr[a.name] = [];
    cInputs[a.name] = '';
  });

  customAttributes.value = custAttr;
  customInputs.value = cInputs;

  form.value = {
    name_ar: '', name_en: '', description_ar: '', description_en: '', price: '', discount: '', quantity: '', is_active: true,
    category_id: '', subcategory_id: '',
    features_ar: '', features_en: '',
    tips_ar: '', tips_en: '',
    shipping_info_ar: '', shipping_info_en: '',
    existing_images: [], new_images: [],
    colors: [],
    sizes: [],
    specs: [],
    selectedAttributes: selAttr,
    notAvailable: {},
  };
  showFormModal.value = true;
};

const openEditModal = (prod) => {
  resetDuplicate();
  if (!attributesList.value.length && !attributesLoading.value) fetchDependencies();
  isEdit.value = true;
  editingId.value = prod.id;
  currentTab.value = 'info';
  activeLang.value = formLang();
  imagePreviews.value = [];
  customColorName.value = '';
  customColorHex.value = '#111827';
  customSizeInput.value = '';
  
  // Resolve the API category object/ID into the form's parent + sub-category fields.
  const allCategories = categories.value.flatMap((category) => [category, ...(category.subchildren || [])]);
  const cat = allCategories.find(c => Number(c.id) === Number(prod.category_id))
    || allCategories.find(c => c.name === (typeof prod.category === 'object' ? prod.category.name : prod.category));
  const catId = cat?.parent_id ? cat.parent_id : (cat?.id || '');
  if (catId) {
    // A product saved in a sub-category lists all siblings under its main category.
    const mainCategory = categories.value.find(c => Number(c.id) === Number(catId));
    subCategories.value = mainCategory?.subchildren || [];
  }
  const subcatId = cat?.parent_id ? cat.id : (subCategories.value.find(sc => sc.name === prod.subcategory)?.id || '');

  const selAttr = {};
  const custAttr = {};
  const cInputs = {};
  
  // Normalize existing attributes
  const existingAttrs = prod.attributes || {};
  
  attributesList.value.forEach(a => { 
    const key = a.name;
    const rawValues = existingAttrs[key] || [];
    const values = Array.isArray(rawValues)
      ? rawValues.map(value => typeof value === 'object' ? (value.label || value.name || '') : value)
      : [];
    const predefinedLabels = a.values ? a.values.map(v => v.label) : [];
    
    selAttr[key] = values.filter(v => predefinedLabels.includes(v));
    custAttr[key] = values.filter(v => !predefinedLabels.includes(v));
    cInputs[key] = '';
  });

  customAttributes.value = custAttr;
  customInputs.value = cInputs;

  // Extract custom technical specifications
  const extractedSpecs = [];
  Object.keys(existingAttrs).forEach(k => {
    if (['color', 'اللون', 'size', 'المقاس', 'الحجم', 'images', 'image'].includes(k)) return;
    const v = existingAttrs[k];
    const strVal = Array.isArray(v) ? v.join(' / ') : String(v || '');
    if (strVal && strVal !== 'null' && strVal.trim()) {
      extractedSpecs.push({ key: k, value: strVal.trim() });
    }
  });

  // Extract colors
  const extractedColors = [];
  const rawColors = prod.color_options || 
                    existingAttrs.color || 
                    existingAttrs['اللون'] || 
                    prod.colors || [];

  if (Array.isArray(rawColors)) {
    rawColors.forEach(c => {
      if (typeof c === 'object' && c !== null) {
        extractedColors.push({
          label: c.label || c.name || '',
          color: c.color || c.hex || getPresetColorHex(c.label || c.name) || '#111827'
        });
      } else if (typeof c === 'string' && c.trim()) {
        if (c.includes('|')) {
          const [lbl, hex] = c.split('|');
          extractedColors.push({ label: lbl.trim(), color: hex.trim() || getPresetColorHex(lbl.trim()) || '#111827' });
        } else {
          extractedColors.push({
            label: c.trim(),
            color: getPresetColorHex(c.trim()) || '#111827'
          });
        }
      }
    });
  }

  // Extract sizes
  const extractedSizes = [];
  const rawSizes = prod.size_options || 
                   existingAttrs.size || 
                   existingAttrs['المقاس'] || 
                   existingAttrs['الحجم'] || 
                   prod.sizes || [];

  if (Array.isArray(rawSizes)) {
    rawSizes.forEach(s => {
      if (typeof s === 'string' && s.trim()) {
        extractedSizes.push(s.trim());
      } else if (typeof s === 'object' && s !== null && (s.label || s.name || s.size)) {
        extractedSizes.push(s.label || s.name || s.size);
      }
    });
  }

  form.value = {
    name_ar: (prod.name_i18n && typeof prod.name_i18n === 'object' ? (prod.name_i18n.ar ?? prod.name) : prod.name) || '',
    name_en: (prod.name_i18n && typeof prod.name_i18n === 'object' ? (prod.name_i18n.en ?? '') : ''),
    description_ar: (prod.description_i18n && typeof prod.description_i18n === 'object' ? (prod.description_i18n.ar ?? prod.description) : prod.description) || '',
    description_en: (prod.description_i18n && typeof prod.description_i18n === 'object' ? (prod.description_i18n.en ?? '') : ''),
    price: prod.price,
    // 0 means "no discount": show the field blank, the input rejects values below 1 and would block saving.
    discount: normalizeDiscountPercent(prod.discount, prod.price) || '',
    quantity: prod.stock,
    is_active: prod.status === 'active',
    category_id: catId,
    subcategory_id: subcatId,
    features_ar: (prod.features_i18n && typeof prod.features_i18n === 'object' ? (prod.features_i18n.ar ?? prod.features) : prod.features) || '',
    features_en: (prod.features_i18n && typeof prod.features_i18n === 'object' ? (prod.features_i18n.en ?? '') : ''),
    tips_ar: (prod.tips_i18n && typeof prod.tips_i18n === 'object' ? (prod.tips_i18n.ar ?? prod.tips) : prod.tips) || '',
    tips_en: (prod.tips_i18n && typeof prod.tips_i18n === 'object' ? (prod.tips_i18n.en ?? '') : ''),
    shipping_info_ar: (prod.shipping_info_i18n && typeof prod.shipping_info_i18n === 'object' ? (prod.shipping_info_i18n.ar ?? prod.shipping_info) : prod.shipping_info) || '',
    shipping_info_en: (prod.shipping_info_i18n && typeof prod.shipping_info_i18n === 'object' ? (prod.shipping_info_i18n.en ?? '') : ''),
    existing_images: [...(prod.images || [])],
    new_images: [],
    colors: dedupeColorOptions(extractedColors),
    sizes: extractedSizes,
    specs: extractedSpecs,
    selectedAttributes: selAttr,
    // A saved product without a value for a core attribute had it as «غير متوفر».
    notAvailable: Object.fromEntries(coreAttributeRows.value
      .filter(({ attribute }) => !(selAttr[attribute.name] || []).length && !(custAttr[attribute.name] || []).length)
      .map(({ attribute }) => [attribute.name, true])),
  };
  showFormModal.value = true;
};

const openViewModal = (prod) => {
  viewProduct.value = prod;
  currentImageIdx.value = 0;
  showViewModal.value = true;
};

const prevImage = () => {
  if (currentImageIdx.value > 0) currentImageIdx.value--;
  else currentImageIdx.value = (viewProduct.value?.images?.length || 1) - 1;
};
const nextImage = () => {
  const max = (viewProduct.value?.images?.length || 1) - 1;
  if (currentImageIdx.value < max) currentImageIdx.value++;
  else currentImageIdx.value = 0;
};

const resolveAttributeValues = (attrName, valIds) => {
  if (!Array.isArray(valIds)) return [];
  const isColor = hasColorType({ name: attrName, label: attrName });
  const attr = attributesList.value.find(a => a.name === attrName || a.label === attrName);

  return valIds.map(v => {
    if (typeof v === 'object' && v !== null) {
      const lbl = v.label || v.name || '';
      return {
        label: lbl,
        color: v.color || (isColor ? getPresetColorHex(lbl) : null)
      };
    }
    if (typeof v === 'string') {
      if (v.includes('|')) {
        const [lbl, hex] = v.split('|');
        return { label: lbl.trim(), color: hex.trim() };
      }
      const matched = attr?.values?.find(av => av.label === v);
      return {
        label: v.trim(),
        color: matched?.color || (isColor ? getPresetColorHex(v.trim()) : null)
      };
    }
    return { label: String(v), color: null };
  });
};

const closeModal = () => {
  showFormModal.value = false;
  resetDuplicate();
};

// ── Duplicate product ────────────────────────────────────────────────────────
// Opens the add form filled with the product's data. Its images are downloaded
// (through the same-origin /public/storage proxy, so the browser may read them)
// and staged as new files: saving uploads them again with the new product, so
// the copy keeps its own images even if the original is deleted.
function resetDuplicate() {
  duplicateRun += 1;
  duplicateSource.value = null;
  duplicateLoading.value = 0;
  duplicateFailed.value = [];
}

const sameOriginImageUrl = (url) => {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith('/public/storage/') || parsed.pathname.startsWith('/storage/')) return parsed.pathname + parsed.search;
    return parsed.href;
  } catch {
    return url;
  }
};

const imageUrlToFile = async (url, index) => {
  const response = await fetch(sameOriginImageUrl(url), { credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Not an image');
  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  return new File([blob], `product-copy-${index + 1}.${ext}`, { type: blob.type });
};

const stageCopiedImages = async (urls, run) => {
  duplicateLoading.value += urls.length;
  const results = await Promise.allSettled(urls.map((url, index) => imageUrlToFile(url, index)));
  if (run !== duplicateRun) return;
  duplicateLoading.value -= urls.length;
  // Keep the original order: the first image stays the primary one.
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && form.value.new_images.length < maxImages) {
      form.value.new_images.push(result.value);
      imagePreviews.value.push({ file: result.value, preview: safeObjectUrl(result.value) });
    } else if (result.status === 'rejected') {
      duplicateFailed.value.push(urls[index]);
    }
  });
};

const retryDuplicateImage = (idx) => {
  const [url] = duplicateFailed.value.splice(idx, 1);
  if (url) stageCopiedImages([url], duplicateRun);
};

const openDuplicateModal = (prod) => {
  openEditModal(prod);
  // Same data, but saved as a new product.
  isEdit.value = false;
  editingId.value = null;
  duplicateSource.value = { id: prod.id, name: form.value.name_ar || form.value.name_en || prod.name || '' };
  const copyName = (name, suffix) => (String(name || '').trim() ? `${String(name).trim()} ${suffix}` : '');
  form.value.name_ar = copyName(form.value.name_ar, '(نسخة)');
  form.value.name_en = copyName(form.value.name_en, '(Copy)');
  // A copy stays hidden from the website until it is reviewed and activated.
  form.value.is_active = false;
  form.value.quantity = Number.isInteger(Number(form.value.quantity)) && Number(form.value.quantity) >= 0 ? form.value.quantity : 0;
  const urls = (form.value.existing_images || []).filter(Boolean).slice(0, maxImages);
  form.value.existing_images = [];
  form.value.new_images = [];
  if (urls.length) stageCopiedImages(urls, duplicateRun);
};

// Images Uploader
const triggerFileInput = () => {
  fileInput.value.click();
};

const productCropOptions = (position, total) => ({
  defaultRatio: '1:1',
  fileName: 'product',
  title: total > 1
    ? tx(`قص وضبط صورة المنتج (${position} من ${total})`, `Crop & resize product image (${position} of ${total})`)
    : tx('قص وضبط صورة المنتج (Crop & Resize)', 'Crop & resize product image'),
});

// Picked images open the crop modal one after another, in the order picked.
const handleFileChange = async (e) => {
  const rawFiles = Array.from(e.target.files || []);
  e.target.value = null;
  if (!rawFiles.length) return;

  const room = maxImages - form.value.existing_images.length - form.value.new_images.length;
  if (rawFiles.length > room) {
    triggerAlert(`يُسمح بـ ${maxImages} صورة كحد أقصى للمنتج الواحد`, 'error');
  }
  const filesToAdd = rawFiles.slice(0, Math.max(0, room));

  for (const [index, picked] of filesToAdd.entries()) {
    const { file, error } = await prepareImage(picked, productCropOptions(index + 1, filesToAdd.length));
    if (error) {
      triggerAlert(error, 'error');
      continue;
    }
    form.value.new_images.push(file);
    imagePreviews.value.push({ file, preview: safeObjectUrl(file) });
  }
};

const recropNewImage = async (idx) => {
  const current = imagePreviews.value[idx];
  if (!current) return;
  const { file, error } = await recropImage(current.file, productCropOptions(1, 1));
  if (error) triggerAlert(error, 'error');
  if (!file || imagePreviews.value[idx] !== current) return;
  form.value.new_images.splice(idx, 1, file);
  imagePreviews.value.splice(idx, 1, { file, preview: safeObjectUrl(file, current.preview) });
};

const removeExistingImage = (idx) => {
  form.value.existing_images.splice(idx, 1);
};
const removeNewImage = (idx) => {
  const removed = imagePreviews.value.splice(idx, 1)[0];
  if (removed?.preview) safeObjectUrl(null, removed.preview);
  form.value.new_images.splice(idx, 1);
};

const setPrimaryExistingImage = (idx) => {
  if (idx > 0 && idx < form.value.existing_images.length) {
    const item = form.value.existing_images.splice(idx, 1)[0];
    form.value.existing_images.unshift(item);
  }
};

const setPrimaryNewImage = (idx) => {
  if (idx >= 0 && idx < form.value.new_images.length) {
    const file = form.value.new_images.splice(idx, 1)[0];
    const preview = imagePreviews.value.splice(idx, 1)[0];
    // If existing images exist, unshift to new_images
    form.value.new_images.unshift(file);
    imagePreviews.value.unshift(preview);
  }
};

// Form Submission
const validateProductForm = (f, { isEdit = false } = {}) => {
  if (!f.category_id && !f.subcategory_id) return 'القسم الرئيسي مطلوب';
  if (f.price === '' || f.price == null || !(Number(f.price) >= 0)) return 'السعر يجب أن يكون رقماً صحيحاً (0 أو أكبر)';
  // The stock is entered once, when the product is added; it is locked (and not sent) when editing.
  if (!isEdit && (f.quantity === '' || f.quantity == null || !Number.isInteger(Number(f.quantity)) || Number(f.quantity) < 0)) return 'المخزون يجب أن يكون عدداً صحيحاً (0 أو أكبر)';
  return '';
};

const submitForm = async () => {
  if (!String(form.value.name_ar || '').trim()) {
    activeLang.value = 'ar';
    triggerAlert('اسم المنتج بالعربي مطلوب', 'error');
    return;
  }
  if (!String(form.value.name_en || '').trim()) {
    activeLang.value = 'en';
    triggerAlert('اسم المنتج بالإنجليزية مطلوب', 'error');
    return;
  }
  const productError = validateProductForm(form.value, { isEdit: isEdit.value });
  if (productError) {
    currentTab.value = 'info';
    triggerAlert(productError, 'error');
    return;
  }

  const attrName = (attribute) => attribute.label || attribute.name;
  const missingCore = coreAttributeRows.value.find(({ attribute }) => !coreRowDone(attribute));
  if (missingCore) {
    currentTab.value = 'attributes';
    triggerAlert(selectedCount(missingCore.attribute.name) > 1
      ? `اختر قيمة واحدة فقط لـ «${attrName(missingCore.attribute)}»`
      : `اختر قيمة لـ «${attrName(missingCore.attribute)}» أو «غير متوفر»`, 'error');
    return;
  }
  const multiValued = otherAttributesList.value.find((attribute) => selectedCount(attribute.name) > 1);
  if (multiValued) {
    currentTab.value = 'attributes';
    triggerAlert(`اختر قيمة واحدة فقط لـ «${attrName(multiValued)}»`, 'error');
    return;
  }

  if (duplicateSource.value) {
    if (duplicateLoading.value > 0) {
      triggerAlert('انتظر حتى ينتهي نسخ صور المنتج', 'error');
      return;
    }
    if (!form.value.new_images.length) {
      currentTab.value = 'info';
      triggerAlert('أضف صورة واحدة على الأقل للمنتج المنسوخ', 'error');
      return;
    }
  }

  isSubmitting.value = true;
  
  // Merge attributes
  const finalAttributes = {};
  const normalizedColors = dedupeColorOptions(form.value.colors || []);
  const colorAttribute = attributesList.value.find(attribute => isColorAttribute(attribute));
  const canonicalColorKey = colorAttribute?.name || 'color';
  const selectedColorValues = Object.entries(form.value.selectedAttributes || {})
    .filter(([key]) => isColorAttribute({ name: key, label: key }))
    .flatMap(([, values]) => Array.isArray(values) ? values : []);
  const selectedColors = selectedColorValues.map(value => {
    const raw = value && typeof value === 'object'
      ? (value.label || value.name || value.value || '')
      : String(value || '');
    const [label, inlineColor] = raw.split('|', 2);
    const matched = colorAttribute?.values?.find(item => item.label === label.trim());
    return {
      label: label.trim(),
      color: inlineColor?.trim() || matched?.color || getPresetColorHex(label.trim()) || '#111827',
    };
  });
  const payloadColors = dedupeColorOptions(normalizedColors.length > 0 ? normalizedColors : selectedColors);

  // 1. Color Options
  if (payloadColors.length > 0) {
    finalAttributes[canonicalColorKey] = payloadColors.map(c => `${c.label}|${c.color}`);
  }

  // 2. Size Options
  if (form.value.sizes && form.value.sizes.length > 0) {
    finalAttributes['size'] = [...form.value.sizes];
    finalAttributes['المقاس'] = [...form.value.sizes];
  }

  // 3. Other attributes
  Object.keys(form.value.selectedAttributes).forEach(key => {
    if (isColorAttribute({ name: key, label: key }) || ['size', 'المقاس', 'الحجم'].includes(key)) return;
    const combined = [
      ...(form.value.selectedAttributes[key] || []),
      ...(customAttributes.value[key] || [])
    ];
    if (combined.length > 0) {
      finalAttributes[key] = Array.from(new Set(combined));
    }
  });
  const payload = toProductPayload(form.value);
  if (isEdit.value) delete payload.number;
  payload.attributes = JSON.stringify(finalAttributes);
  payload.color_options = JSON.stringify(payloadColors);
  payload.size_options = JSON.stringify(form.value.sizes || []);
  payload.option_ids = attributesList.value.flatMap((attribute) => (
    (form.value.selectedAttributes[attribute.name] || [])
      .map((label) => attribute.values.find((value) => value.label === label)?.id)
      .filter(Boolean)
  ));

  try {
    if (isEdit.value) {
      await adminCatalogService.updateProduct(editingId.value, payload, form.value.new_images);
      triggerAlert('تم تحديث المنتج بنجاح');
    } else {
      await adminCatalogService.createProduct(payload, form.value.new_images);
      triggerAlert(duplicateSource.value ? 'تم نسخ المنتج وإضافته كمنتج جديد (غير نشط)' : 'تم إضافة المنتج بنجاح');
    }
    closeModal();
    fetchProducts();
    fetchStats();
  } catch (error) {
    const msg = apiErrorMessage(error, 'حدث خطأ يرجى تعبئة الحقول المطلوبة');
    triggerAlert(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const getDeleteErrorMessage = (error) => {
  const message = String(error?.response?.data?.message || '').trim();
  if (/order_items|foreign key constraint|cannot delete|طلبات|مرتبط/i.test(message)) {
    return 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات سابقة. عطّل المنتج من التعديل بدل حذفه نهائياً.';
  }
  return apiErrorMessage(error, 'فشل عملية الحذف');
};

const confirmDelete = async (prod) => {
  if (confirm(`تأكيد حذف المنتج "${prod.name_i18n?.ar || prod.name}"؟`)) {
    try {
      await adminCatalogService.deleteProduct(prod.id);
      triggerAlert('تم الحذف بنجاح');
      fetchProducts();
      fetchStats();
    } catch (error) {
      triggerAlert(getDeleteErrorMessage(error), 'error');
    }
  }
};

</script>

<style scoped>
.points-hint { margin: 0 0 0.5rem; font-size: 0.78rem; color: #9ca3af; }
.points-group { margin-bottom: 1.25rem; }
.overview-box { position: relative; }
.overview-textarea { width: 100%; box-sizing: border-box; resize: none; padding: 0.8rem 1rem 1.9rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; font: 400 0.9rem/1.6 'IBM Plex Sans Arabic', sans-serif; color: #1f2937; outline: none; transition: 0.2s; }
.overview-textarea:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(102, 0, 51, 0.08); }
.overview-counter { position: absolute; inset-inline-end: 0.9rem; bottom: 0.5rem; font-size: 0.72rem; color: #9ca3af; pointer-events: none; }
.products-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 2rem;
}

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin-bottom: 0.2rem; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; }
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
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.25rem; display: flex; align-items: center; justify-content: flex-end; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); flex-direction: row-reverse;
}
.stat-info { display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
.stat-label { font-size: 0.75rem; font-weight: 700; color: #6b7280; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin-top: 0.2rem; }
.stat-icon-wrapper { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.active-icon { background: #f3f4f6; color: #660033; }
.empty-icon { background: #fee2e2; color: #dc2626; }
.total-icon { background: #ecfdf5; color: #059669; }
.main-icon { background: #fefce8; color: #ca8a04; }

/* Filters */
.filters-row { display: flex; gap: 1rem; align-items: center; }
.search-box { flex: 1; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 0.7rem 2.8rem 0.7rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; transition: border-color 0.2s; }
.search-input:focus { border-color: #660033; }
.filter-select { position: relative; display: flex; align-items: center; min-width: 150px; }
.form-select { width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #374151; appearance: none; outline: none; cursor: pointer; }
.filter-select .select-icon { position: absolute; left: 1rem; color: #9ca3af; pointer-events: none; }

/* Table */
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.data-table th { background: #f9fafb; font-size: 0.75rem; font-weight: 700; color: #6b7280; white-space: nowrap; }
.data-table td { font-size: 0.85rem; color: #374151; }
.data-table tr:last-child td { border-bottom: none; }
.data-row:hover td { background: #f3f4f6; }
.state-row td { text-align: center; color: #6b7280; padding: 2.5rem; }

/* Columns */
.col-name { text-align: right; width: 35%; }
.col-price { text-align: center; width: 15%; }
.col-stock { text-align: center; width: 10%; }
.col-sales { text-align: center; width: 15%; }
.col-status { text-align: center; width: 10%; }
.col-actions { text-align: left; width: 15%; padding-left: 1.5rem !important; }
.data-table th.col-actions, .data-table th.col-status, .data-table th.col-stock, .data-table th.col-price, .data-table th.col-sales { text-align: center; }
.data-table th.col-actions { text-align: right; }

.prod-name-cell { display: flex; align-items: center; gap: 0.85rem; }
.prod-image { width: 40px; height: 40px; border-radius: 6px; overflow: hidden; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #e5e7eb; }
.prod-image img { width: 100%; height: 100%; object-fit: cover; }
.prod-details { display: flex; flex-direction: column; align-items: flex-start; }
.prod-title { font-weight: 700; color: #111827; font-size: 0.85rem; line-height: 1.3; margin-bottom: 0.2rem; }
.prod-cat-badge { background: #f3f4f6; color: #660033; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.65rem; font-weight: 600; }

.price-cell { display: flex; flex-direction: column; align-items: center; }
.current-price { font-weight: 800; color: #059669; }
.old-price { font-size: 0.7rem; color: #9ca3af; text-decoration: line-through; }

.stock-manage-link { font-size: 0.75rem; font-weight: 700; color: #660033; margin-top: 0.3rem; display: inline-block; }
.form-control:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
.stock-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 700; font-size: 0.75rem; }
.in-stock { color: #374151; }
.out-of-stock { color: #dc2626; background: #fee2e2; }

.sales-count { font-weight: 700; color: #374151; display: inline-flex; align-items: center; gap: 0.2rem; }
.sales-count svg { color: #10b981; }

.status-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.inactive { background: #fef2f2; color: #dc2626; }

.actions-group { display: flex; align-items: center; justify-content: flex-start; gap: 0.4rem; }
.action-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.2s; }
.action-btn:hover { background: #f3f4f6; }
.delete-btn:hover { color: #dc2626; background: #fef2f2; }
.edit-btn:hover { color: #2563eb; background: #eff6ff; }
.view-btn:hover { color: #059669; background: #ecfdf5; }


/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-content { background: #fff; border-radius: 12px; width: 100%; max-width: 600px; padding: 2rem; position: relative; max-height: 90vh; overflow-y: auto; }
.form-content { max-width: 700px; }
.modal-close { position: absolute; top: 1.2rem; left: 1.2rem; background: none; border: none; color: #9ca3af; cursor: pointer; transition: color 0.2s; }
.modal-close:hover { color: #111827; }
.modal-title { font-size: 1.2rem; font-weight: 800; color: #111827; text-align: center; margin-bottom: 0.2rem; }
.modal-subtitle { font-size: 0.8rem; color: #6b7280; text-align: center; margin-bottom: 1.5rem; }

.i18n-toggle { display: inline-flex; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; margin: 0.75rem auto 1.25rem; }
.i18n-btn { border: none; background: transparent; padding: 0.4rem 0.9rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; color: #6b7280; min-width: 96px; }
.i18n-btn.active { background: #660033; color: #fff; }

/* Tabs */
.modal-tabs { display: flex; gap: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem; justify-content: center; }
.tab-btn { background: none; border: none; color: #6b7280; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; padding: 0.6rem 1rem; cursor: pointer; position: relative; }
.tab-btn.active { color: #660033; }
.tab-btn.active::after { content:''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #660033; }
.tab-pane { animation: fadeIn 0.3s; }
.attributes-tab-pane { display: flex; flex-direction: column; }
.attributes-tab-pane > .variant-section-card { order: 1; }
.attributes-tab-pane > .api-attributes-section { order: 0; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Form Fields */
.form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
.half-width { flex: 1; }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #374151; margin-bottom: 0.4rem; text-align: right; }
.req { color: #dc2626; }
.form-control { width: 100%; padding: 0.65rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #1f2937; outline: none; transition: border-color 0.2s; text-align: right; }
.no-rtl-issue { direction: ltr; text-align: right; }
.form-control:focus { border-color: #660033; }

.select-wrapper { position: relative; display: flex; align-items: center; }
.select-wrapper .form-control { appearance: none; padding-left: 2rem; cursor: pointer; }
.select-wrapper .select-icon { position: absolute; left: 0.8rem; color: #9ca3af; pointer-events: none; }

/* Fake Toolbar */
.rich-textarea-mock { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.rich-textarea-mock:focus-within { border-color: #660033; }
.rt-toolbar { padding: 0.4rem 0.8rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; gap: 0.5rem; }
.rt-icon { font-weight: 700; font-size: 0.8rem; color: #6b7280; cursor: pointer; padding: 0.1rem 0.3rem; border-radius: 3px; }
.rt-icon:hover { background: #e5e7eb; }
.rt-body { border: none !important; border-radius: 0 !important; resize: vertical; min-height: 80px; }
.rt-body:focus { outline: none; box-shadow: none; border: none; }

/* Image Uploader */
.image-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.action-btn.duplicate-btn { color: #0f766e; }
.action-btn.duplicate-btn:hover { background: #ecfdf5; }
.copy-loading-item, .copy-failed-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #f9fafb; border: 1px dashed #d1d5db; text-align: center; padding: 6px; }
.copy-loading-item small, .copy-failed-item small { font-size: 0.7rem; color: #6b7280; }
.copy-failed-item { border-color: #fca5a5; background: #fef2f2; }
.copy-failed-item img { opacity: 0.35; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.copy-failed-item small, .copy-failed-item .retry-copy-btn { position: relative; z-index: 1; }
.copy-failed-item small { color: #b91c1c; font-weight: 700; }
.retry-copy-btn { border: none; background: #660033; color: #fff; border-radius: 6px; font-size: 0.7rem; padding: 3px 8px; cursor: pointer; font-family: inherit; }
.copy-spinner { width: 22px; height: 22px; border: 3px solid #e5e7eb; border-top-color: #660033; border-radius: 50%; animation: copy-spin 0.8s linear infinite; }
@keyframes copy-spin { to { transform: rotate(360deg); } }
.images-count-badge { font-size: 0.75rem; font-weight: 700; color: #660033; background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 12px; }
.image-uploader { display: flex; flex-direction: column; gap: 0.8rem; }
.upload-box {
  border: 1.5px dashed #d1d5db; border-radius: 10px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa;
}
.upload-box:hover { border-color: #660033; background: #f3f4f6; }
.hidden-input { display: none; }
.upload-box p { font-size: 0.85rem; font-weight: 600; color: #374151; margin: 0.5rem 0 0; }
.upload-box span { font-size: 0.75rem; color: #9ca3af; }
.preview-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
.preview-item { width: 90px; height: 90px; border-radius: 8px; border: 1.5px solid #e5e7eb; position: relative; overflow: hidden; background: #f9fafb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.primary-tag-badge {
  position: absolute; bottom: 0; left: 0; right: 0; background: #660033; color: #fff; font-size: 0.65rem; font-weight: 700; text-align: center; padding: 2px 0; letter-spacing: 0.5px;
}
.set-primary-btn {
  position: absolute; bottom: 0; left: 0; right: 0; background: rgba(17, 24, 39, 0.85); color: #fff; font-size: 0.6rem; font-weight: 700; border: none; padding: 3px 0; cursor: pointer; transition: background 0.2s; text-align: center;
}
.set-primary-btn:hover { background: #660033; }
.thumb-crop-btn { position: absolute; top: 3px; right: 3px; z-index: 2; }
.remove-img-btn {
  position: absolute; top: 3px; left: 3px; background: rgba(0, 0, 0, 0.6); color: #fff; width: 20px; height: 20px; border-radius: 50%; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: background 0.2s; z-index: 2;
}
.remove-img-btn:hover { background: #dc2626; }

.multi-img-badge {
  position: absolute; bottom: 2px; right: 2px; background: rgba(17, 24, 39, 0.85); color: #fff; font-size: 0.6rem; font-weight: 800; padding: 1px 4px; border-radius: 4px; line-height: 1.2;
}

/* Variant & Attribute Management Cards */
.variant-section-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.variant-section-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.2rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.8rem; }
.variant-icon-wrapper { width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.color-icon-bg { background: #f3f4f6; color: #660033; }
.size-icon-bg { background: #eff6ff; color: #2563eb; }
.other-icon-bg { background: #f3f4f6; color: #660033; }
.variant-section-title { font-size: 0.95rem; font-weight: 800; color: #111827; margin: 0 0 0.2rem 0; }
.variant-section-desc { font-size: 0.75rem; color: #6b7280; margin: 0; }

.presets-block { margin-bottom: 1rem; }
.presets-label { display: block; font-size: 0.78rem; font-weight: 700; color: #4b5563; margin-bottom: 0.5rem; text-align: right; }
.color-presets-row, .size-presets-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.color-preset-pill {
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 20px; background: #fff; font-size: 0.8rem; font-weight: 700; color: #374151; cursor: pointer; transition: all 0.2s; font-family: 'IBM Plex Sans Arabic', sans-serif;
}
.color-preset-pill:hover { border-color: #660033; color: #660033; background: #f3f4f6; }
.color-preset-pill.active { border-color: #660033; background: #f3f4f6; color: #660033; box-shadow: 0 0 0 1px #660033; }
.preset-dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; border: 1px solid rgba(0,0,0,0.15); flex-shrink: 0; }
.dot-white { border: 1px solid #d1d5db; }
.preset-check { font-size: 0.75rem; font-weight: 800; color: #660033; margin-right: 0.2rem; }

.custom-variant-box { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 0.9rem; margin-bottom: 1rem; }
.color-custom-row, .size-custom-row { display: flex; gap: 0.6rem; align-items: center; }
.custom-color-name, .custom-size-input { flex: 1; }
.color-picker-input-box { display: flex; align-items: center; gap: 0.4rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.25rem 0.5rem; height: 38px; }
.native-color-picker { width: 28px; height: 28px; border: none; background: none; cursor: pointer; padding: 0; border-radius: 4px; }
.custom-color-hex { width: 80px; border: none; font-family: monospace; font-size: 0.8rem; font-weight: 700; padding: 0; }
.custom-color-hex:focus { border: none; box-shadow: none; }
.btn-add-variant {
  display: inline-flex; align-items: center; gap: 0.4rem; background: #660033; color: #fff; border: 1px solid #660033; padding: 0.55rem 1.1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.2s; font-family: 'IBM Plex Sans Arabic', sans-serif;
}
.btn-add-variant:hover { background: #4d0026; border-color: #4d0026; }

.selected-items-block { border-top: 1px dashed #e5e7eb; padding-top: 0.8rem; margin-top: 0.5rem; }
.selected-colors-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.color-chip-card {
  display: inline-flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.35rem 0.6rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.chip-swatch { width: 18px; height: 18px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); flex-shrink: 0; }
.chip-light { border: 1px solid #cbd5e1; }
.chip-info { display: flex; flex-direction: column; align-items: flex-start; }
.chip-name { font-size: 0.8rem; font-weight: 700; color: #1f2937; line-height: 1.2; }
.chip-hex { font-size: 0.65rem; color: #9ca3af; font-family: monospace; }
.chip-del-btn { background: none; border: none; color: #9ca3af; font-size: 0.75rem; cursor: pointer; padding: 0 0 0 0.3rem; line-height: 1; transition: color 0.15s; }
.chip-del-btn:hover { color: #dc2626; }

.size-preset-pill {
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 0.8rem; font-weight: 700; color: #374151; cursor: pointer; transition: all 0.2s; font-family: 'IBM Plex Sans Arabic', sans-serif;
}
.size-preset-pill:active { border-color: #660033; background: #f3f4f6; color: #660033; box-shadow: 0 0 0 1px #660033; }

/* Technical Specs Admin Styles */
.specs-presets-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.8rem; }
.spec-preset-pill {
  display: inline-flex; align-items: center; padding: 0.35rem 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.8rem; font-weight: 700; color: #374151; cursor: pointer; transition: all 0.2s; font-family: 'IBM Plex Sans Arabic', sans-serif;
}
.spec-preset-pill:hover { border-color: #660033; color: #660033; background: #f9fafb; }

.add-spec-row { display: flex; gap: 0.6rem; align-items: center; margin-bottom: 1rem; }
.btn-add-spec {
  display: inline-flex; align-items: center; gap: 0.4rem; background: #660033; color: #fff; border: 1px solid #660033; padding: 0.55rem 1.1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.2s; font-family: 'IBM Plex Sans Arabic', sans-serif;
}
.btn-add-spec:hover { background: #4d0026; border-color: #4d0026; }

.specs-table-wrapper { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 0.5rem; margin-bottom: 1rem; }
.specs-admin-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: right; }
.specs-admin-table th { background: #f9fafb; padding: 0.55rem 0.8rem; font-weight: 700; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
.specs-admin-table td { padding: 0.55rem 0.8rem; border-bottom: 1px solid #f3f4f6; color: #1f2937; }
.specs-admin-table tr:last-child td { border-bottom: none; }

.selected-sizes-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.size-chip-card {
  display: inline-flex; align-items: center; gap: 0.5rem; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.35rem 0.65rem;
}
.size-chip-text { font-size: 0.8rem; font-weight: 700; color: #1f2937; }

.empty-variants-hint {
  font-size: 0.78rem; color: #9ca3af; font-style: italic; background: #f9fafb; padding: 0.6rem 0.8rem; border-radius: 6px; border: 1px dashed #e5e7eb;
}
.attributes-state-card {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem; min-height: 120px; padding: 1rem; border: 1px dashed #d1d5db; border-radius: 10px; background: #f9fafb; color: #6b7280; font-size: 0.85rem; font-weight: 700;
}
.attributes-state-card.error { flex-direction: column; color: #b91c1c; background: #fff7f7; border-color: #fecaca; }
.attributes-retry-btn { background: #660033; color: #fff; border: 0; border-radius: 6px; padding: 0.45rem 0.9rem; cursor: pointer; font-family: inherit; font-weight: 700; }

.other-attrs-list { display: flex; flex-direction: column; gap: 0.8rem; }
.other-attr-row { background: #f9fafb; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #f3f4f6; }
.other-attr-label { font-size: 0.8rem; font-weight: 800; color: #374151; display: block; margin-bottom: 0.4rem; }
.text-muted-xs { font-size: 0.75rem; color: #9ca3af; }
.attr-values-list { display: flex; flex-wrap: wrap; gap: 0.8rem; }
.attr-val-checkbox { display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; position: relative; border: 0; padding: 0; background: transparent; font-family: inherit; }
.checkmark { width: 16px; height: 16px; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block; position: relative; background: #fff; transition: all 0.2s; }
.checkmark.active { background: #660033; border-color: #660033; }
.api-attribute-color-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(17, 24, 39, 0.15); flex: 0 0 auto; }
.checkmark.active::after { content: ''; position: absolute; display: block; left: 4px; top: 1px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.val-text { font-size: 0.85rem; font-weight: 600; color: #374151; }
.color-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; border: 1px solid rgba(0, 0, 0, 0.1); }


.form-actions { margin-top: 2rem; display: flex; justify-content: center; }
.btn-submit { background: #660033; color: #fff; border: 1px solid #660033; padding: 0.65rem 2.5rem; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; width: fit-content; }
.btn-submit:hover:not(:disabled) { background: #4d0026; border-color: #4d0026; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* View Details Modal */
.view-content { max-width: 500px; }
.no-padding-top { padding-top: 0 !important; overflow-x: hidden; overflow-y: auto; }
.floating-close { top: 1rem; left: 1rem; background: rgba(0, 0, 0, 0.4); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 10; border: none; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.floating-close:hover { background: rgba(0, 0, 0, 0.6); color: white; }

.view-image-slider { position: relative; width: calc(100% + 4rem); margin: 0 -2rem 1rem -2rem; height: 350px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.view-main-image { width: 100%; height: 100%; object-fit: cover; }
.view-main-image-placeholder { color: #9ca3af; font-size: 0.9rem; font-weight: 600; }
.slider-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0, 0, 0, 0.5); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; z-index: 2; font-size: 1rem; }
.slider-btn:hover { background: rgba(0, 0, 0, 0.8); }
.prev-btn { left: 1rem; }
.next-btn { right: 1rem; }
.image-indicator { position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.6); color: white; padding: 0.25rem 0.7rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px; backdrop-filter: blur(4px); }

.view-thumbnails { display: flex; gap: 0.6rem; justify-content: center; margin-bottom: 1.5rem; }
.thumb-img { width: 45px; height: 45px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 2px solid transparent; opacity: 0.5; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.thumb-img.active { border-color: #660033; opacity: 1; transform: scale(1.05); }
.thumb-img:hover { opacity: 1; }

.view-body-wrapper { padding: 0 0 0.5rem 0; }
.view-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; gap: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 1.25rem; }
.view-title { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0 0 0.4rem 0; line-height: 1.3; }
.view-subtitle { font-size: 0.85rem; font-weight: 700; color: #660033; margin: 0; }
.view-status-badge { padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; display: inline-block; }
.view-status-badge.active { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.view-status-badge.inactive { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.view-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1.5rem; }
.v-stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.8rem 0.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); text-align: center; }
.v-stat-label { font-size: 0.7rem; color: #6b7280; font-weight: 700; margin-bottom: 0.4rem; }
.v-stat-value { font-size: 1rem; font-weight: 800; color: #1f2937; }
.green-text { color: #059669; font-size: 1.1rem; }
.px-badge { background: #f3f4f6; color: #660033; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.85rem; }

.view-sections { display: flex; flex-direction: column; gap: 0.6rem; border-top: 1px solid #f3f4f6; margin-bottom: 1.5rem; padding-top: 1.2rem;}
.v-section { background: #f9fafb; padding: 1.25rem; border-radius: 8px; border: 1px solid #f3f4f6; }
.v-section-title { font-size: 0.85rem; font-weight: 800; color: #111827; margin: 0 0 0.8rem 0; }
.v-section-content { font-size: 0.85rem; color: #4b5563; line-height: 1.7; font-weight: 500; }
.v-feature-list { list-style: none; padding: 0; margin: 0; }
.v-feature-list li { position: relative; padding-left: 1.2rem; margin-bottom: 0.4rem; font-size: 0.85rem; color: #4b5563; }
.v-feature-list li::before { content: '•'; position: absolute; left: 0; color: #660033; font-weight: 700; }

.v-attr-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.6rem; }
.v-attr-key { font-weight: 700; color: #374151; font-size: 0.85rem; }
.v-attr-vals { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.v-attr-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.6rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.8rem; font-weight: 600; color: #374151; }
.v-val-text { color: #374151; }

/* Pagination */
.pagination-container { display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; padding: 0.75rem 1rem; background: #fff; border-radius: 10px; border: 1px solid #e5e7eb; }
.pagination-info { font-size: 0.85rem; color: #6b7280; font-weight: 600; }
.pagination-controls { display: flex; align-items: center; gap: 0.4rem; direction: ltr; }
.pagination-btn { width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pagination-btn:hover:not(:disabled) { background: #660033; color: #fff; border-color: #660033; }
.pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination-pages { display: flex; gap: 0.3rem; }
.pagination-page-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.pagination-page-btn:hover { background: #f3f4f6; }
.pagination-page-btn.active { background: #660033; color: #fff; border-color: #660033; }


.v-attr-row { display: flex; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.8rem; }
.v-attr-row:last-child { margin-bottom: 0; }
.v-attr-key { font-weight: 700; color: #111827; min-width: 80px; font-size: 0.8rem; padding-top: 0.2rem; }
.v-attr-vals { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.v-attr-chip { background: #fff; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #374151; display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid #e5e7eb; }

/* Custom Attribute Helpers */
.flex-row-center { display: flex; align-items: center; }
.gap-2 { gap: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mb-2 { margin-bottom: 0.5rem; }
.custom-chips-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.custom-val-chip { background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
.custom-val-chip button { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 0.7rem; padding: 0; line-height: 1; }
.custom-val-chip button:hover { color: #dc2626; }

.view-footer-actions { display: flex; gap: 1rem; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 1.5rem; }
.view-footer-actions button { flex: 1; padding: 0.75rem; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; }
.btn-cancel:hover { background: #e5e7eb; color: #111827; }
.btn-outline-edit { background: #fff; border: 1px solid #660033; color: #660033; }
.btn-outline-edit:hover { background: #f3f4f6; }

/* Alert */
.alert-icon { flex-shrink: 0; }
.field-hint { display: block; margin-top: 4px; font-size: 0.7rem; color: #6b7280; }

/* ===== Unified form-modal design (matches "إنشاء عرض جديد") ===== */
.modal-overlay:has(.form-modal) { z-index: 1000; backdrop-filter: blur(4px); }
.modal-content.form-modal { max-width: 650px; padding: 0; border-radius: 20px; box-shadow: 0 25px 70px rgba(0,0,0,0.25); max-height: 95vh; overflow-y: auto; }
.modal-content.form-modal.form-content { max-width: 700px; }
.form-modal .modal-close { top: 1.5rem; left: 1.5rem; background: #f3f4f6; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; color: #9ca3af; font-size: 1.2rem; line-height: 1; }
.form-modal .form-header { text-align: center; padding: 2rem 2rem 1.5rem 2rem; position: relative; }
.form-modal .modal-heading-row { display: flex; align-items: center; justify-content: center; gap: 0.65rem; direction: inherit; }
.form-modal .header-icon-main { width: 38px; height: 38px; background: #f3f4f6; color: #660033; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.form-modal .modal-title-main { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0; }
.form-modal .modal-subtitle-main { font-size: 0.85rem; color: #9ca3af; margin-top: 0.4rem; }
.form-modal .cat-form, .form-modal .prod-form, .form-modal .value-form { padding: 0 2.5rem 2.5rem 2.5rem; }
.form-modal .i18n-toggle { display: flex; width: fit-content; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; margin: 0 auto 1.1rem; }
.form-modal .i18n-btn { padding: 0.4rem 0.9rem; font-weight: 800; font-size: 0.85rem; min-width: 96px; font-family: 'IBM Plex Sans Arabic', sans-serif; }
.form-modal .modal-tabs { margin: 0 2.5rem 1.5rem; }
.form-modal .form-group { margin-bottom: 1.5rem; }
.form-modal .form-label { font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem; }
.form-modal .form-control { padding: 0.8rem 1rem; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; transition: 0.2s; }
.form-modal .form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(0,0,0,0.08); }
.form-modal .image-upload-box, .form-modal .upload-box { border: 2px dashed #e5e7eb; border-radius: 12px; background: #f9fafb; }
.form-modal .image-upload-box:hover, .form-modal .upload-box:hover { border-color: #660033; background: #fff; }
.form-modal .form-actions { margin-top: 2rem; display: flex; gap: 1rem; justify-content: stretch; align-items: stretch; }
.form-modal .btn-cancel { flex: 1; width: auto; padding: 0.85rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.form-modal .btn-submit { flex: 2; width: auto; min-width: 0; padding: 0.85rem; border-radius: 10px; border: none; background: #660033; color: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.form-modal .btn-submit:hover:not(:disabled) { background: #4d0026; }
.form-modal .btn-submit:disabled { opacity: 0.6; }
@media (max-width: 600px) { .form-modal .cat-form, .form-modal .prod-form, .form-modal .value-form { padding: 0 1.25rem 1.5rem; } .form-modal .modal-tabs { margin: 0 1.25rem 1.5rem; } }

/* Core attributes (color, capacity, size) */
.attributes-tab-pane > .core-attributes-section { order: -1; border-color: #660033; }
.core-attrs-header { margin-bottom: 0.75rem; }
.core-attr-row.is-missing { border-color: #fecaca; }
.not-available-chip { margin-top: 8px; border-style: dashed !important; color: #6b7280; }
.not-available-chip.active { background: #6b7280 !important; border-color: #6b7280 !important; color: #fff !important; }
.core-attrs-list { display: flex; flex-direction: column; gap: 0.9rem; }
.core-attr-row { background: #f9fafb; padding: 0.85rem 1rem; border-radius: 10px; border: 1px solid #e5e7eb; }
.core-attr-title { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-weight: 700; margin-bottom: 0.6rem; }
.core-attr-count { font-size: 0.8rem; font-weight: 600; color: #b45309; background: #fef3c7; border-radius: 999px; padding: 0.1rem 0.6rem; }
.core-attr-count.complete { color: #047857; background: #d1fae5; }
.core-attr-values { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.core-attr-chip { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.4rem 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font: inherit; cursor: pointer; }
.core-attr-chip.active { border-color: #660033; background: #660033; color: #fff; }
.core-attr-chip .api-attribute-color-dot { border: 1px solid #d1d5db; }
.core-attr-chip.active .val-text { color: #fff; }
</style>
