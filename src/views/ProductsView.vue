<template>
  <div class="products-page">
    <!-- The list stays mounted (filters, page and selection are kept) while the add / edit page is open. -->
    <div v-show="!showFormModal" class="products-list-view">
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
      <ColumnPicker table-key="products" class="toolbar-columns" />
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
      <table class="data-table" data-col-key="products" :data-bulk-table="bulk.tableId">
        <thead>
          <tr>
            <th class="bulk-col"><input type="checkbox" class="bulk-check" :checked="bulk.allSelected" :indeterminate="bulk.someSelected" :aria-label="tx('تحديد الكل', 'Select all')" data-testid="bulk-all" @change="bulk.toggleAll()" /></th>
            <th class="col-name">{{ tx('المنتج', 'Product') }}</th>
            <th class="col-price">{{ tx('السعر', 'Price') }}</th>
            <th class="col-stock">{{ tx('المخزون', 'Stock') }}</th>
            <th class="col-sales">{{ tx('المبيعات', 'Sales') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="7">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredProducts.length === 0" class="state-row"><td colspan="7">{{ tx('لا توجد منتجات مطابقة', 'No matching products found') }}</td></tr>
          <template v-else>
            <tr v-for="prod in filteredProducts" :key="prod.id" class="data-row" :class="{ 'is-selected': bulk.isSelected(prod.id) }" :data-bulk-id="prod.id">
              <td class="bulk-col" @click.stop><input type="checkbox" class="bulk-check" :checked="bulk.isSelected(prod.id)" :aria-label="tx('تحديد', 'Select')" data-testid="bulk-row" @click="bulk.toggle(prod.id, $event)" /></td>
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
    <BulkActionBar :bulk="bulk" :actions="bulkActions" file-name="products" />

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

    </div><!-- /products-list-view -->

    <!-- Add / edit product: a page of its own inside the dashboard (the side menu stays), not a dialog -->
    <section v-if="showFormModal" class="editor-page" data-testid="product-editor">
      <header class="editor-top">
        <button type="button" class="editor-back" data-testid="editor-back" @click="closeModal">
          <svg class="editor-back-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
          {{ tx('المنتجات', 'Products') }}
        </button>
        <div class="editor-titles">
          <h3 class="editor-title">{{ isEdit ? tx('تعديل المنتج', 'Edit Product') : duplicateSource ? tx(`نسخ منتج: ${duplicateSource.name}`, `Duplicate: ${duplicateSource.name}`) : tx('إضافة منتج جديد', 'Add New Product') }}</h3>
          <p class="editor-sub">{{ duplicateSource ? tx('بيانات وصور المنتج منسوخة؛ راجعها ثم احفظ لإضافتها كمنتج جديد.', 'The product data and images are copied; review them, then save to add a new product.') : isEdit ? tx('عدّل بيانات المنتج وخصائصه ومتغيراته', 'Edit the product, its attributes and its variants') : tx('أدخل بيانات المنتج، ثم حدد خصائصه وقيمها لتتولد المتغيرات تلقائيًا', 'Enter the product, then pick its attributes and values: the variants are generated for you') }}</p>
        </div>
      </header>

      <div class="editor-body">
      <div class="editor-main form-modal">
        <!-- Stepper: 1 basic information, 2 attributes & variants (with price and stock), 3 images -->
        <ol class="stepper" role="tablist" data-testid="editor-tabs">
          <template v-for="(tab, index) in EDITOR_TABS" :key="tab.key">
            <li class="step" :class="{ active: currentTab === tab.key, done: index < stepIndex }">
              <button
                type="button"
                role="tab"
                class="step-btn"
                :aria-selected="currentTab === tab.key"
                :aria-current="currentTab === tab.key ? 'step' : undefined"
                :data-testid="`tab-${tab.key}`"
                @click.prevent="goStep(tab.key)"
              >
                <span class="step-dot">{{ index < stepIndex ? '✓' : index + 1 }}</span>
                <span class="step-text">
                  <small>{{ tx('الخطوة', 'Step') }} {{ index + 1 }}</small>
                  <b>{{ tx(tab.label[0], tab.label[1]) }}</b>
                </span>
                <span v-if="tab.key === 'variants' && variantState.rows.length" class="tab-count" data-testid="tab-variants-count">{{ variantState.rows.length }}</span>
              </button>
            </li>
            <li v-if="index < EDITOR_TABS.length - 1" class="step-line" :class="{ done: index < stepIndex }" aria-hidden="true"></li>
          </template>
        </ol>

        <form id="product-form" v-show="currentTab !== 'variants'" @submit.prevent="submitForm" class="prod-form" novalidate>
          <div v-show="currentTab === 'basic'" class="tab-pane" data-testid="pane-basic">
            <!-- Basic fields -->
            <BilingualField class="form-group" required :ar="form.name_ar" :en="form.name_en" testid="product-name">
              <template #label="{ lang }">
                <label class="form-label" :for="`product-name-${lang}`">{{ tx('اسم المنتج', 'Product name') }} <span class="req">*</span></label>
              </template>
              <template #default="{ lang }">
                <input v-show="lang === 'ar'" id="product-name-ar" type="text" v-model="form.name_ar" class="form-control" dir="rtl" placeholder="أدخل اسم المنتج بالعربي" data-testid="product-name-ar" />
                <input v-show="lang === 'en'" id="product-name-en" type="text" v-model="form.name_en" class="form-control" dir="ltr" placeholder="Product name in English" data-testid="product-name-en" />
              </template>
            </BilingualField>

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

            <!-- Featured: the product joins the website's «featured products» lists -->
            <div class="form-group featured-box">
              <label class="featured-check">
                <input type="checkbox" v-model="form.is_featured" data-testid="product-featured" />
                <span>{{ tx('منتج مميز', 'Featured product') }}</span>
              </label>
              <small class="featured-hint">{{ tx('يظهر المنتج في قوائم «المنتجات المميزة» بالموقع.', 'The product shows in the website’s “Featured products” lists.') }}</small>
            </div>

            <!-- Basic fields -->

            <!-- Content sections: each one is a list of points (type + Enter) -->
            <BilingualField class="form-group points-group" data-testid="overview-text" required :ar="form.description_ar" :en="form.description_en" testid="product-overview">
              <template #label>
              <label class="form-label">{{ tabName('overview') }} <span class="req">*</span></label>
              </template>
              <template #default="{ lang }">
              <p class="points-hint">{{ tx(`نص قصير لا يتعدى سطرين، يظهر في تبويب «${tabName('overview')}».`, `A short text of up to two lines, shown in the “${tabName('overview')}” tab.`) }}</p>
              <div class="overview-box">
                <textarea
                  v-show="lang === 'ar'"
                  v-model="form.description_ar"
                  dir="rtl"
                  rows="2"
                  :maxlength="overviewMaxLength"
                  class="overview-textarea"
                  placeholder="اكتب نظرة عامة مختصرة عن المنتج في سطرين"
                  @keydown.enter.prevent
                ></textarea>
                <textarea
                  v-show="lang === 'en'"
                  v-model="form.description_en"
                  dir="ltr"
                  rows="2"
                  :maxlength="overviewMaxLength"
                  class="overview-textarea"
                  placeholder="Write a short product overview in up to two lines"
                  @keydown.enter.prevent
                ></textarea>
                <span class="overview-counter" dir="ltr">{{ String((lang === 'ar' ? form.description_ar : form.description_en) || '').length }} / {{ overviewMaxLength }}</span>
              </div>
              </template>
            </BilingualField>

            <BilingualField class="form-group points-group" data-testid="points-features" :ar="form.features_ar" :en="form.features_en" testid="product-features">
              <template #label>
              <label class="form-label">{{ tabName('features') }}</label>
              </template>
              <template #default="{ lang }">
              <p class="points-hint">{{ tx('تظهر أسفل السعر في صفحة المنتج بعلامة صح، وفي تبويب خاص لو أضفته من إعدادات «تفاصيل المنتج».', 'Shown under the price on the product page with a check mark, and in its own tab if you add one in “Product details” settings.') }}</p>
              <PointListInput
                v-show="lang === 'ar'"
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
                v-show="lang === 'en'"
                v-model="form.features_en"
                dir="ltr"
                label="Features"
                placeholder="Type a point and press Enter"
                add-label="Add point"
                remove-label="Remove point"
                empty-label="No points added yet"
                tip="Press Enter to add a new point"
              />
              </template>
            </BilingualField>

            <BilingualField class="form-group points-group" data-testid="points-tips" :ar="form.tips_ar" :en="form.tips_en" testid="product-tips">
              <template #label>
              <label class="form-label">{{ tabName('installation') }}</label>
              </template>
              <template #default="{ lang }">
              <p class="points-hint">{{ tx(`تظهر في تبويب «${tabName('installation')}».`, `Shown in the “${tabName('installation')}” tab.`) }}</p>
              <PointListInput
                v-show="lang === 'ar'"
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
                v-show="lang === 'en'"
                v-model="form.tips_en"
                dir="ltr"
                label="Installation"
                placeholder="Type a point and press Enter"
                add-label="Add point"
                remove-label="Remove point"
                empty-label="No points added yet"
                tip="Press Enter to add a new point"
              />
              </template>
            </BilingualField>

            <BilingualField class="form-group points-group" data-testid="points-shipping_info" :ar="form.shipping_info_ar" :en="form.shipping_info_en" testid="product-shipping-info">
              <template #label>
              <label class="form-label">{{ tabName('shipping') }}</label>
              </template>
              <template #default="{ lang }">
              <p class="points-hint">{{ tx(`تظهر في تبويب «${tabName('shipping')}».`, `Shown in the “${tabName('shipping')}” tab.`) }}</p>
              <PointListInput
                v-show="lang === 'ar'"
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
                v-show="lang === 'en'"
                v-model="form.shipping_info_en"
                dir="ltr"
                label="Shipping & Returns"
                placeholder="Type a point and press Enter"
                add-label="Add point"
                remove-label="Remove point"
                empty-label="No points added yet"
                tip="Press Enter to add a new point"
              />
              </template>
            </BilingualField>
                    </div>

          <div v-show="currentTab === 'images'" class="tab-pane" data-testid="pane-images">
            <!-- Images Upload -->
            <div class="form-group">
              <div class="image-label-row">
                <label class="form-label mb-0" style="text-align: right;">{{ tx('صور المنتج', 'Product Images') }} <span class="req">*</span></label>
                <span class="images-count-badge">
                  {{ form.existing_images.length + form.new_images.length }} / {{ maxImages }} {{ tx('صور', 'images') }}
                </span>
              </div>
              <div class="image-uploader" :class="{ 'is-missing': imageMissing && form.existing_images.length + form.new_images.length === 0 }" data-testid="product-image-uploader">
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

          </div>
        </form>

        <!-- Outside the product form (a form cannot hold another form): the builder adds attribute values with its own form.
             Same builder for a new product and for editing one (then it starts with the product's saved variants). -->
        <div v-show="currentTab === 'variants'" class="tab-pane build-pane" data-testid="build-pane">
          <!-- A product without variants is one product: its price and stock are the default variant's own fields. -->
          <div v-if="!hasVariants && !attributesLoading && !variantsLoading" class="default-variant-card" data-testid="default-variant-card">
            <h4 class="variant-section-title">{{ tx('السعر والمخزون (المتغير الافتراضي)', 'Price & stock (default variant)') }}</h4>
            <p class="points-hint">{{ tx('هذا المنتج بلا متغيرات، لذا تُدخَل بياناته هنا. إذا فعّلت خاصية أدناه وحددت قيمها، تحصل كل تركيبة على سعرها ومخزونها.', 'This product has no variants, so its price and stock are set here. Turn on an attribute below and every combination gets its own price and stock.') }}</p>
            <div class="form-row">
              <div class="form-group half-width">
                <label class="form-label">{{ tx('السعر', 'Price') }} ({{ cur }}) <span class="req">*</span></label>
                <input type="number" step="0.01" min="0" v-model="form.price" class="form-control no-rtl-issue" placeholder="0.00" data-testid="product-price" />
              </div>
              <div class="form-group half-width">
                <label class="form-label">{{ tx('المخزون', 'Stock') }} <span class="req">*</span></label>
                <input type="number" min="0" v-model="form.quantity" class="form-control no-rtl-issue" placeholder="0" :disabled="isEdit" data-testid="product-stock" />
                <router-link v-if="isEdit && editingId" :to="{ name: 'InventoryProduct', params: { id: editingId } }" class="stock-manage-link" data-testid="manage-stock-link">{{ tx('تعديل المخزون من «إدارة المخزون»', 'Change the stock in “Inventory”') }}</router-link>
              </div>
            </div>
          </div>
          <div v-if="attributesLoading || variantsLoading" class="attributes-state-card">{{ tx('جاري تحميل الخصائص والمتغيرات...', 'Loading attributes and variants...') }}</div>
          <div v-else-if="attributesLoadError" class="attributes-state-card error">
            {{ tx('تعذر تحميل الخصائص.', 'Unable to load the attributes.') }}
            <button type="button" class="attributes-retry-btn" @click.prevent="fetchDependencies">{{ tx('إعادة المحاولة', 'Retry') }}</button>
          </div>
          <div v-else-if="variantsLoadError" class="attributes-state-card error">
            {{ tx('تعذر تحميل متغيرات المنتج.', 'Unable to load the product variants.') }}
            <button type="button" class="attributes-retry-btn" @click.prevent="loadEditVariants(editingId)">{{ tx('إعادة المحاولة', 'Retry') }}</button>
          </div>
          <ProductVariantBuilder
            v-else
            v-model="variantState"
            :attributes="apiAttributesList"
            :currency="cur"
            :main-images="mainImagePreviews"
            :main-active="form.is_active !== false"
            :problem="variantProblem"
            :editing="isEdit"
            :locked-id="isEdit ? editingId : null"
            @notify="triggerAlert"
            @reload-attributes="reloadAttributes"
          />
        </div>

        <div class="editor-footer">
          <button type="button" class="btn-cancel" data-testid="editor-cancel" @click="closeModal">{{ tx('إلغاء', 'Cancel') }}</button>
          <button v-if="stepIndex > 0" type="button" class="btn-back" data-testid="editor-prev" @click="prevStep">{{ tx('السابق', 'Back') }}</button>
          <button v-if="!isLastStep" type="button" class="btn-next" :class="{ primary: !isEdit }" data-testid="editor-next" @click="nextStep">
            {{ tx('التالي', 'Next') }}
          </button>
          <button v-if="isLastStep || isEdit" type="button" class="btn-submit" :disabled="isSubmitting || variantsLoading" data-testid="editor-save" @click="submitForm">
            {{ isSubmitting ? (saveProgress || tx('جاري الحفظ...', 'Saving...')) : (isEdit ? tx('حفظ التعديلات', 'Save changes') : tx('إضافة المنتج', 'Add Product')) }}
          </button>
        </div>
      </div>
      </div><!-- /editor-body -->
    </section>

    <!-- Bulk "change category": pick the target category for the ticked products -->
    <div class="modal-overlay" v-if="bulkCategoryPicker.open" @click.self="closeBulkCategoryPicker(null)" data-testid="bulk-category-dialog">
      <div class="modal-content bulk-category-box" role="dialog" aria-modal="true">
        <h3 class="bulk-category-title">{{ tx('نقل المنتجات المحددة إلى قسم', 'Move selected products to a category') }}</h3>
        <select v-model="bulkCategoryPicker.value" class="form-select" data-testid="bulk-category-select">
          <option value="">{{ tx('اختر القسم', 'Choose a category') }}</option>
          <option v-for="c in categoryFilterOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>
        <div class="bulk-category-footer">
          <button type="button" class="btn-cancel bulk-category-btn" @click="closeBulkCategoryPicker(null)">{{ tx('إلغاء', 'Cancel') }}</button>
          <button type="button" class="add-btn bulk-category-btn" :disabled="!bulkCategoryPicker.value" data-testid="bulk-category-confirm" @click="closeBulkCategoryPicker(bulkCategoryPicker.value)">{{ tx('نقل', 'Move') }}</button>
        </div>
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

          <!-- Variants of the product: list, add, edit and delete them here (/v1/dashboard/products/{id}/variants) -->
          <section v-if="viewProduct?.id" class="v-section view-variants" data-testid="view-variants">
            <h4 class="v-section-title">{{ tx('إدارة المتغيرات', 'Manage variants') }}</h4>
            <div v-if="attributesLoading" class="attributes-state-card">{{ tx('جاري تحميل الخصائص...', 'Loading attributes...') }}</div>
            <ProductVariantsPanel
              v-else
              :product-id="viewProduct.id"
              :attributes="apiAttributesList"
              :currency="cur"
              @changed="fetchProducts"
              @notify="triggerAlert"
            />
          </section>

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
import BulkActionBar from '../components/BulkActionBar.vue';
import { useBulkSelection } from '../composables/useBulkSelection';
import ColumnPicker from '../components/ColumnPicker.vue';
import { localizeMessage } from '../utils/uiMessages';
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { apiErrorMessage } from '../utils/apiMessage';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PointListInput from '../components/PointListInput.vue';
import BilingualField from '../components/BilingualField.vue';
import { provideBilingualForm } from '../composables/useBilingualForm';
import { hasText } from '../utils/bilingualText';
import { useAdminText } from '../composables/useAdminText';
import adminCatalogService from '../application/adminCatalogService';
import { PRODUCT_IMAGE_PLACEHOLDER, productCategoryName, toLines, toProductPayload, validateProductImages } from '../domain/catalog/adminCatalog';
import { loadSavedProductTabs } from '../services/productTabs';
import { sourceTitle } from '../domain/productTabs';
import { dedupeColorOptions, isColorAttribute, normalizeProductAttributes } from '../utils/productAttributes';
import { useDialog } from '../composables/useDialog';
import { isTestProduct, visibleCategories, visibleProducts } from '../utils/catalogVisibility';
import { safeObjectUrl } from '../utils/adminSecurity';
import ImageCropModal from '../components/ImageCropModal.vue';
import ProductVariantBuilder from '../components/ProductVariantBuilder.vue';
import ProductVariantsPanel from '../components/ProductVariantsPanel.vue';
import {
  planEditChanges, rowLabel, stateFromVariants, validateVariantRows, variantRequests,
} from '../domain/catalog/variantMatrix';
import { normalizeHexColor } from '../constants/colors';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';

const { tx, locale } = useAdminText();
const dialog = useDialog();
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

const customColorName = ref('');
const customColorHex = ref('#111827');
const customSizeInput = ref('');
const hasColorType = (attr) => isColorAttribute(attr);

// All rendered standard attributes displayed in the product form come from the API.
// The legacy custom sections are intentionally removed from the attributes tab.
const apiAttributesList = computed(() => attributesList.value);
// Field names follow the product page tab names set in Settings > Product details.
const savedProductTabs = ref(null);
const tabName = (source) => sourceTitle(savedProductTabs.value, source, locale.value === 'en' ? 'en' : 'ar');
// Modals
const showFormModal = ref(false);
// Set when a save was refused for lack of an image; the uploader turns red until one is added.
const imageMissing = ref(false);
const showViewModal = ref(false);
const isEdit = ref(false);
// Duplicating: the product being copied, and the state of copying its images.
const duplicateSource = ref(null);
const duplicateLoading = ref(0);
const duplicateFailed = ref([]);
let duplicateRun = 0;
const editingId = ref(null);
// The editor's tabs (المعلومات الأساسية / الخصائص والمتغيرات / الصور). Price and stock live in the variants tab (the
// default variant's own fields, or one row per variant). The variants builder sits outside the product form (a form
// cannot hold another form).
const EDITOR_TABS = [
  { key: 'basic', label: ['المعلومات الأساسية', 'Basic information'] },
  { key: 'variants', label: ['الخصائص والمتغيرات', 'Attributes & variants'] },
  { key: 'images', label: ['الصور', 'Images'] },
];
const currentTab = ref('basic');
const stepIndex = computed(() => Math.max(0, EDITOR_TABS.findIndex((tab) => tab.key === currentTab.value)));
const isLastStep = computed(() => stepIndex.value === EDITOR_TABS.length - 1);

// The first problem of one step, or null. Adding a product walks the steps in order: a step must be
// complete before the next opens. (Editing: the steps open freely and Save checks everything.)
const stepProblem = (key) => {
  if (key === 'basic') {
    if (!hasText(form.value.name_ar)) return { message: tx('اسم المنتج بالعربي مطلوب', 'Arabic product name is required'), reveal: true };
    if (!hasText(form.value.name_en)) return { message: tx('اسم المنتج بالإنجليزية مطلوب', 'English product name is required'), reveal: true };
    if (!form.value.category_id && !form.value.subcategory_id) return { message: tx('القسم الرئيسي مطلوب', 'Main category is required') };
    return null;
  }
  if (key === 'variants') {
    const rows = variantState.value.rows;
    if (rows.length) {
      const bad = validateVariantRows(rows);
      if (bad) {
        variantProblem.value = { key: bad.key, field: bad.field };
        return { message: bad.code === 'price'
          ? tx('اكتب سعرًا صحيحًا (0 أو أكبر) لكل متغير', 'Enter a valid price (0 or more) for every variant')
          : tx('اكتب مخزونًا صحيحًا (عدد 0 أو أكبر) لكل متغير', 'Enter a valid stock (a whole number, 0 or more) for every variant') };
      }
      return null;
    }
    const price = form.value.price;
    if (price === '' || price == null || !(Number(price) >= 0)) return { message: tx('السعر يجب أن يكون رقماً صحيحاً (0 أو أكبر)', 'Price must be a valid number (0 or more)') };
    const qty = form.value.quantity;
    if (!isEdit.value && (qty === '' || qty == null || !Number.isInteger(Number(qty)) || Number(qty) < 0)) return { message: tx('المخزون يجب أن يكون عدداً صحيحاً (0 أو أكبر)', 'Stock must be a whole number (0 or more)') };
    return null;
  }
  return null;
};

const goStep = (key) => {
  const target = EDITOR_TABS.findIndex((tab) => tab.key === key);
  if (target < 0 || target === stepIndex.value) return;
  if (target > stepIndex.value && !isEdit.value) {
    for (let index = stepIndex.value; index < target; index += 1) {
      const problem = stepProblem(EDITOR_TABS[index].key);
      if (problem) {
        currentTab.value = EDITOR_TABS[index].key;
        if (problem.reveal) bilingual.reveal();
        triggerAlert(problem.message, 'error');
        return;
      }
    }
  }
  currentTab.value = key;
  nextTick(() => document.querySelector('[data-testid="product-editor"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
};
const nextStep = () => { if (!isLastStep.value) goStep(EDITOR_TABS[stepIndex.value + 1].key); };
const prevStep = () => { if (stepIndex.value > 0) goStep(EDITOR_TABS[stepIndex.value - 1].key); };
const isSubmitting = ref(false);
const saveProgress = ref(''); // "Saving variants (3/12)..." while the variants of a new product are added
const viewProduct = ref(null);
const currentImageIdx = ref(0);

const fileInput = ref(null);
const imagePreviews = ref([]); // new uploads

// ── Variants of the product ──────────────────────────────────────────────────
// The admin ticks the values of the attributes the variants differ by (Colour 1·2·3, Size S·M) and every
// combination becomes a row with its own price, stock and pictures (ProductVariantBuilder). Adding: the main row is
// sent with the product, the others are added to it right after. Editing: the rows start as the product's saved
// variants, and saving updates, creates and deletes variants to match.
const newVariantState = () => ({ groups: [], rows: [], excluded: [], defaults: { price: '', number: '' }, archive: [] });
const variantState = ref(newVariantState());
// { key, field } of the row that failed validation, so the builder can scroll to it.
const variantProblem = ref(null);
const variantsLoading = ref(false);
const variantsLoadError = ref(false);
// Ids of the saved variants when the edit page opened: the ones missing at save time are deleted.
const originalVariantIds = ref([]);
// Price and stock live on the variants (not in the info tab) when the product has variants. When editing, the
// variant saved with the product itself (its own id) must be one of the rows.
const hasVariants = computed(() => {
  const rows = variantState.value.rows;
  if (!rows.length) return false;
  return !isEdit.value || rows.some((row) => String(row.id) === String(editingId.value));
});
const mainImagePreviews = computed(() => [...(form.value.existing_images || []), ...imagePreviews.value.map((file) => file.preview)].filter(Boolean));
// The main variant follows the product's status; the other rows have their own switch.
watch(showFormModal, (open) => {
  if (!open) return;
  imageMissing.value = false;
  variantProblem.value = null;
  // Editing loads the product's own variants (loadEditVariants); everything else starts empty.
  if (!isEdit.value) { variantState.value = newVariantState(); variantsLoading.value = false; variantsLoadError.value = false; }
  // The page opens in place of the list: bring it into view.
  nextTick(() => document.querySelector('.editor-page')?.scrollIntoView({ block: 'start' }));
});
// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.
// Attribute and option names follow the dashboard language (the API labels are Arabic-first).
const attrTitle = (attribute = {}) => (locale.value === 'en'
  ? (attribute.translations?.en?.name || attribute.name_en || attribute.name || attribute.label)
  : (attribute.label || attribute.name));
const valTitle = (value = {}) => (locale.value === 'en'
  ? (value.name_en || value.translations?.en?.name || value.label)
  : (value.name_ar || value.label));

// Each Arabic / English field has its own language switch (BilingualField); this resets or reveals them all.
const bilingual = provideBilingualForm();

const form = ref({
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  price: '',
  discount: '',
  quantity: '',
  is_active: true,
  is_featured: false,
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
  return image || PRODUCT_IMAGE_PLACEHOLDER;
};
const handleImageError = (event) => {
  if (event?.target?.getAttribute('src') !== PRODUCT_IMAGE_PLACEHOLDER) {
    event.target.src = PRODUCT_IMAGE_PLACEHOLDER;
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
    const [allCategories, rawAttributes, productTabs] = await Promise.all([
      adminCatalogService.listCategories(),
      adminCatalogService.listAttributes(),
      loadSavedProductTabs().catch(() => savedProductTabs.value),
    ]);
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

// Only the attributes (e.g. after a value was added in the variant builder): the rest of the form stays as it is.
const reloadAttributes = async () => {
  try {
    const normalized = normalizeProductAttributes(await adminCatalogService.listAttributes()).filter((attribute) => attribute.is_active);
    if (normalized.length) attributesList.value = normalized;
  } catch (err) {
    console.error('Failed to reload attributes', err);
  }
};

onMounted(() => {
  fetchProducts();
  fetchStats();
  // A direct link to /admin/products/new or /admin/products/:id/edit opens the editor once the categories are in.
  Promise.resolve(fetchDependencies()).finally(() => openEditorFromRoute());
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
  currentTab.value = 'basic';
  bilingual.reset();
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
    name_ar: '', name_en: '', description_ar: '', description_en: '', price: '', discount: '', quantity: '', is_active: true, is_featured: false,
    category_id: '', subcategory_id: '',
    features_ar: '', features_en: '',
    tips_ar: '', tips_en: '',
    shipping_info_ar: '', shipping_info_en: '',
    existing_images: [], new_images: [],
    colors: [],
    sizes: [],
    specs: [],
    selectedAttributes: selAttr,
  };
  showFormModal.value = true;
};

// The product's saved variants become the rows of the builder (same screen as adding, filled with the data).
let variantLoadRun = 0;
const loadEditVariants = async (productId) => {
  const run = ++variantLoadRun;
  variantsLoading.value = true;
  variantsLoadError.value = false;
  variantState.value = newVariantState();
  originalVariantIds.value = [];
  try {
    const variants = await adminCatalogService.listVariants(productId);
    // The attributes may still be loading: the saved options are matched against them.
    for (let waited = 0; attributesLoading.value && waited < 80; waited += 1) await new Promise((resolve) => setTimeout(resolve, 100));
    if (run !== variantLoadRun) return;
    const index = new Map();
    attributesList.value.forEach((attribute) => (attribute.values || []).forEach((value) => index.set(String(value.id), {
      attributeId: attribute.id,
      attributeName: attrTitle(attribute),
      label: valTitle(value),
      color: attribute.type === 'color' ? (value.hex || normalizeHexColor(value.color)) : null,
    })));
    variantState.value = { ...newVariantState(), ...stateFromVariants(variants, index, attributesList.value.map((attribute) => attribute.id)) };
    originalVariantIds.value = variants.map((variant) => variant.id);
  } catch (error) {
    if (run === variantLoadRun) variantsLoadError.value = true;
    console.error('Failed to load the product variants', error);
  } finally {
    if (run === variantLoadRun) variantsLoading.value = false;
  }
};

const openEditModal = (prod, { duplicate = false } = {}) => {
  resetDuplicate();
  if (!attributesList.value.length && !attributesLoading.value) fetchDependencies();
  isEdit.value = true;
  editingId.value = prod.id;
  currentTab.value = 'basic';
  bilingual.reset();
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
    // The product comes back in the admin's UI language while the option labels are Arabic-first,
    // so also match the saved options by id (language independent).
    const savedIds = new Set(Object.values(existingAttrs).flatMap(list => (Array.isArray(list) ? list : []))
      .map(value => (value && typeof value === 'object' ? value.id : null)).filter(id => id != null).map(String));
    const byId = (a.values || []).filter(v => v.id != null && savedIds.has(String(v.id))).map(v => v.label);

    selAttr[key] = Array.from(new Set([...values.filter(v => predefinedLabels.includes(v)), ...byId]));
    custAttr[key] = values.filter(v => !predefinedLabels.includes(v) && !byId.length);
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
    is_featured: [true, 1, '1', 'true'].includes(prod.is_featured),
    category_id: catId,
    subcategory_id: subcatId,
    features_ar: (prod.features_i18n && typeof prod.features_i18n === 'object' ? (prod.features_i18n.ar ?? prod.features) : prod.features) || '',
    features_en: (prod.features_i18n && typeof prod.features_i18n === 'object' ? (prod.features_i18n.en ?? '') : ''),
    tips_ar: (prod.tips_i18n && typeof prod.tips_i18n === 'object' ? (prod.tips_i18n.ar ?? prod.tips) : prod.tips) || '',
    tips_en: (prod.tips_i18n && typeof prod.tips_i18n === 'object' ? (prod.tips_i18n.en ?? '') : ''),
    shipping_info_ar: (prod.shipping_info_i18n && typeof prod.shipping_info_i18n === 'object' ? (prod.shipping_info_i18n.ar ?? prod.shipping_info) : prod.shipping_info) || '',
    shipping_info_en: (prod.shipping_info_i18n && typeof prod.shipping_info_i18n === 'object' ? (prod.shipping_info_i18n.en ?? '') : ''),
    existing_images: [...(prod.images || [])],
    image_ids: { ...(prod.image_ids || {}) },
    deleted_image_ids: [],
    new_images: [],
    colors: dedupeColorOptions(extractedColors),
    sizes: extractedSizes,
    specs: extractedSpecs,
    selectedAttributes: selAttr,
  };
  showFormModal.value = true;
  // A copy starts without variants (only the main product is copied); an edit loads the saved ones.
  if (duplicate) { variantLoadRun += 1; variantState.value = newVariantState(); variantsLoading.value = false; } else loadEditVariants(prod.id);
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
  openEditModal(prod, { duplicate: true });
  // Same data, but saved as a new product.
  isEdit.value = false;
  editingId.value = null;
  duplicateSource.value = { id: prod.id, name: form.value.name_ar || form.value.name_en || prod.name || '' };
  const copyName = (name, suffix) => (String(name || '').trim() ? `${String(name).trim()} ${suffix}` : '');
  form.value.name_ar = copyName(form.value.name_ar, '(نسخة)');
  form.value.name_en = copyName(form.value.name_en, '(Copy)');
  // A copy stays hidden from the website until it is reviewed and activated.
  form.value.is_active = false;
  form.value.is_featured = false;
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
    triggerAlert(tx(`يُسمح بـ ${maxImages} صورة كحد أقصى للمنتج الواحد`, `A product can have at most ${maxImages} images`), 'error');
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
  const [removedUrl] = form.value.existing_images.splice(idx, 1);
  const removedId = form.value.image_ids?.[removedUrl];
  if (removedId != null) form.value.deleted_image_ids = [...(form.value.deleted_image_ids || []), removedId];
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
// Returns { message, tab } for the first problem (the tab that holds the field), or null.
const validateProductForm = (f, { isEdit = false } = {}) => {
  if (!f.category_id && !f.subcategory_id) return { message: tx('القسم الرئيسي مطلوب', 'Main category is required'), tab: 'basic' };
  if (f.price === '' || f.price == null || !(Number(f.price) >= 0)) return { message: tx('السعر يجب أن يكون رقماً صحيحاً (0 أو أكبر)', 'Price must be a valid number (0 or more)'), tab: 'variants' };
  // The stock is entered once, when the product is added; it is locked (and not sent) when editing.
  if (!isEdit && (f.quantity === '' || f.quantity == null || !Number.isInteger(Number(f.quantity)) || Number(f.quantity) < 0)) return { message: tx('المخزون يجب أن يكون عدداً صحيحاً (0 أو أكبر)', 'Stock must be a whole number (0 or more)'), tab: 'variants' };
  return null;
};

const submitForm = async () => {
  if (!hasText(form.value.name_ar)) {
    currentTab.value = 'basic';
    bilingual.reveal();
    triggerAlert(tx('اسم المنتج بالعربي مطلوب', 'Arabic product name is required'), 'error');
    return;
  }
  if (!hasText(form.value.name_en)) {
    currentTab.value = 'basic';
    bilingual.reveal();
    triggerAlert(tx('اسم المنتج بالإنجليزية مطلوب', 'English product name is required'), 'error');
    return;
  }
  const variantRows = variantState.value.rows;
  if (variantRows.length) {
    const badRow = validateVariantRows(variantRows);
    if (badRow) {
      currentTab.value = 'variants';
      variantProblem.value = { key: badRow.key, field: badRow.field };
      triggerAlert(badRow.code === 'price'
        ? tx('اكتب سعرًا صحيحًا (0 أو أكبر) لكل متغير', 'Enter a valid price (0 or more) for every variant')
        : tx('اكتب مخزونًا صحيحًا (عدد 0 أو أكبر) لكل متغير', 'Enter a valid stock (a whole number, 0 or more) for every variant'), 'error');
      return;
    }
  }
  // With variants the product itself carries the price (and stock when new) of its own variant: the main one when
  // adding, the one saved with the product when editing.
  const anchorRow = hasVariants.value
    ? (isEdit.value ? variantRows.find((row) => String(row.id) === String(editingId.value)) : (variantRows.find((row) => row.is_main) || variantRows[0]))
    : null;
  if (anchorRow) {
    form.value.price = anchorRow.price;
    form.value.quantity = anchorRow.number;
  }
  const productError = validateProductForm(form.value, { isEdit: isEdit.value });
  if (productError) {
    currentTab.value = productError.tab;
    triggerAlert(productError.message, 'error');
    return;
  }

  if (duplicateSource.value) {
    if (duplicateLoading.value > 0) {
      triggerAlert('انتظر حتى ينتهي نسخ صور المنتج', 'error');
      return;
    }
  }

  // Every product needs at least one image: on add, on duplicate, and on edit (removing the last one is refused).
  const imageError = validateProductImages(form.value);
  if (imageError) {
    currentTab.value = 'images';
    imageMissing.value = true;
    triggerAlert(imageError, 'error');
    await nextTick();
    document.querySelector('.image-uploader')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const payload = toProductPayload(form.value);
  if (isEdit.value) delete payload.number;
  if (isEdit.value && form.value.deleted_image_ids?.length) payload.deleted_images = form.value.deleted_image_ids;

  // What the variants need. Adding: the main row goes into the product request, the others are added to the product
  // right after. Editing: the variant saved with the product goes with the product; the others are updated, created
  // or deleted one by one.
  const variantPlan = !isEdit.value && hasVariants.value ? variantRequests(variantRows, []) : null;
  const editPlan = isEdit.value && variantRows.length
    ? planEditChanges(variantRows, { originalIds: originalVariantIds.value, anchorId: editingId.value })
    : null;
  if (variantPlan) {
    payload.option_ids = variantPlan.main.option_ids;
    payload.price = variantPlan.main.price;
    payload.number = variantPlan.main.number;
  }
  if (isEdit.value && anchorRow) {
    payload.option_ids = anchorRow.optionIds;
    payload.price = Number(anchorRow.price);
  }

  // Variants that are no longer in the list are deleted for good: ask first.
  if (editPlan?.deletes.length) {
    const names = editPlan.deletes.map((id) => {
      const gone = (variantState.value.archive || []).find((row) => String(row.id) === String(id));
      return gone ? rowLabel(gone) || `#${id}` : `#${id}`;
    });
    const ok = await dialog.confirm(
      tx(`سيتم حذف ${names.length} متغير نهائيًا: ${names.join('، ')}.`, `${names.length} variants will be deleted permanently: ${names.join(', ')}.`),
      { type: 'error', title: tx('حذف المتغيرات؟', 'Delete the variants?'), confirmText: tx('حذف وحفظ', 'Delete and save') },
    );
    if (!ok) return;
  }

  isSubmitting.value = true;

  try {
    if (isEdit.value) {
      await adminCatalogService.updateProduct(editingId.value, payload, form.value.new_images);
      const failed = [];
      const steps = editPlan
        ? [
          ...editPlan.updates.map((item) => ({ label: item.label, run: () => adminCatalogService.updateVariant(editingId.value, item.id, item.payload, item.files) })),
          ...editPlan.creates.map((item) => ({ label: item.label, run: () => adminCatalogService.createVariant(editingId.value, item.payload, item.files) })),
          ...editPlan.deletes.map((id) => ({ label: `#${id}`, run: () => adminCatalogService.deleteVariant(editingId.value, id) })),
          ...(editPlan.newMainId ? [{ label: tx('المتغير الأساسي', 'main variant'), run: () => adminCatalogService.updateVariant(editingId.value, editPlan.newMainId, { is_main: true }) }] : []),
        ]
        : [];
      for (const [index, step] of steps.entries()) {
        saveProgress.value = tx(`جاري حفظ المتغيرات (${index + 1}/${steps.length})...`, `Saving variants (${index + 1}/${steps.length})...`);
        try {
          await step.run();
        } catch (stepError) {
          failed.push(step.label);
          console.error('Variant step failed', step.label, stepError);
        }
      }
      if (failed.length) {
        triggerAlert(tx(
          `تم تحديث المنتج لكن تعذر حفظ ${failed.length} من تغييرات المتغيرات: ${failed.join('، ')}. افتح المنتج وراجع المتغيرات.`,
          `The product was updated but ${failed.length} variant changes could not be saved: ${failed.join(', ')}. Open the product and check its variants.`,
        ), 'error');
      } else {
        triggerAlert(tx('تم تحديث المنتج بنجاح', 'Product updated successfully'));
      }
    } else {
      const created = await adminCatalogService.createProduct(payload, form.value.new_images);
      const extras = variantPlan?.others || [];
      if (extras.length && !created?.id) throw new Error('The API did not return the new product id.');
      const failed = [];
      for (const [index, extra] of extras.entries()) {
        saveProgress.value = tx(`جاري حفظ المتغيرات (${index + 1}/${extras.length})...`, `Saving variants (${index + 1}/${extras.length})...`);
        try {
          await adminCatalogService.createVariant(created.id, extra.payload, extra.files);
        } catch (variantError) {
          failed.push({ label: extra.label, message: apiErrorMessage(variantError, '') });
        }
      }
      if (failed.length) {
        triggerAlert(tx(
          `تمت إضافة المنتج لكن تعذر حفظ ${failed.length} من المتغيرات: ${failed.map((item) => item.label).join('، ')}. أضفها من تبويب «المتغيرات» عند تعديل المنتج.`,
          `The product was added but ${failed.length} variants could not be saved: ${failed.map((item) => item.label).join(', ')}. Add them from the “Variants” tab when you edit the product.`,
        ), 'error');
      } else if (extras.length) {
        triggerAlert(tx(`تم إضافة المنتج و${extras.length + 1} متغير`, `Product added with ${extras.length + 1} variants`));
      } else {
        triggerAlert(duplicateSource.value ? tx('تم نسخ المنتج وإضافته كمنتج جديد (غير نشط)', 'Product copied and added as a new inactive product') : tx('تم إضافة المنتج بنجاح', 'Product added successfully'));
      }
    }
    closeModal();
    fetchProducts();
    fetchStats();
  } catch (error) {
    const msg = apiErrorMessage(error, 'حدث خطأ يرجى تعبئة الحقول المطلوبة');
    triggerAlert(msg, 'error');
  } finally {
    isSubmitting.value = false;
    saveProgress.value = '';
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
  const name = locale.value === 'en' ? (prod.name_i18n?.en || prod.name) : (prod.name_i18n?.ar || prod.name);
  const ok = await dialog.confirm(
    tx(`سيتم حذف المنتج «${name}» نهائيًا.`, `The product "${name}" will be deleted permanently.`),
    { type: 'error', title: tx('حذف المنتج؟', 'Delete this product?'), confirmText: tx('حذف المنتج', 'Delete product') },
  );
  if (ok) {
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

// Bulk actions on the ticked rows (checkbox column + BulkActionBar). Each one is a single request to
// POST /v1/dashboard/products/actions with { action, target_ids, inputs }.
const bulk = useBulkSelection(() => filteredProducts.value);
const isActiveProduct = (p) => p.status === 'active';
const isFeaturedProduct = (p) => [true, 1, '1', 'true'].includes(p.is_featured);
const bulkCategoryPicker = ref({ open: false, value: '' });
let bulkCategoryResolve = null;
const closeBulkCategoryPicker = (value) => {
  bulkCategoryPicker.value.open = false;
  const resolve = bulkCategoryResolve;
  bulkCategoryResolve = null;
  if (resolve) resolve(value);
};
const askBulkCategory = () => new Promise((resolve) => {
  bulkCategoryResolve = resolve;
  bulkCategoryPicker.value = { open: true, value: '' };
});
const refreshAfterBulk = () => { fetchProducts(); fetchStats(); };
const bulkProducts = (action) => (rows, inputs) => adminCatalogService.bulkProductAction(action, rows.map((p) => p.id), inputs);
const bulkActions = computed(() => [
  { key: 'activate', label: tx('تفعيل', 'Activate'), icon: 'check', applies: (p) => !isActiveProduct(p),
    all: bulkProducts('activate'), done: refreshAfterBulk, success: (n) => tx(`تم تفعيل ${n} منتج`, `${n} products activated`) },
  { key: 'deactivate', label: tx('إيقاف', 'Deactivate'), icon: 'ban', applies: isActiveProduct,
    all: bulkProducts('deactivate'), done: refreshAfterBulk, success: (n) => tx(`تم إيقاف ${n} منتج`, `${n} products deactivated`) },
  { key: 'feature', label: tx('تمييز', 'Feature'), icon: 'star', applies: (p) => !isFeaturedProduct(p),
    all: bulkProducts('feature'), done: refreshAfterBulk, success: (n) => tx(`تم تمييز ${n} منتج`, `${n} products featured`) },
  { key: 'unfeature', label: tx('إلغاء التمييز', 'Unfeature'), icon: 'star', applies: isFeaturedProduct,
    all: bulkProducts('unfeature'), done: refreshAfterBulk, success: (n) => tx(`تم إلغاء تمييز ${n} منتج`, `${n} products unfeatured`) },
  { key: 'change_category', label: tx('نقل لقسم', 'Move to category'), icon: 'folder',
    prepare: async () => {
      const categoryId = await askBulkCategory();
      return categoryId ? { category_id: Number(categoryId) } : null;
    },
    all: bulkProducts('change_category'), done: refreshAfterBulk, success: (n) => tx(`تم نقل ${n} منتج`, `${n} products moved`) },
  { key: 'delete', label: tx('حذف', 'Delete'), icon: 'trash', tone: 'danger',
    confirm: (rows) => tx(`سيتم حذف ${rows.length} منتج. الحذف نهائي ولا يمكن التراجع عنه.`, `Delete ${rows.length} products? This cannot be undone.`),
    all: bulkProducts('delete'), done: refreshAfterBulk, success: (n) => tx(`تم حذف ${n} منتج`, `${n} products deleted`) },
]);

// ── Editor URLs ──────────────────────────────────────────────────────────────
// The add / edit pages have their own address, so a refresh or a shared link lands on the same page:
//   /admin/products              the list
//   /admin/products/new          add a product (?from=<id> when duplicating one)
//   /admin/products/:id/edit     edit a product
const route = useRoute();
const router = useRouter();
const PRODUCT_ROUTES = ['Products', 'ProductNew', 'ProductEdit'];

const editorPath = () => {
  if (!showFormModal.value) return '/admin/products';
  if (isEdit.value && editingId.value) return `/admin/products/${editingId.value}/edit`;
  if (duplicateSource.value?.id) return `/admin/products/new?from=${duplicateSource.value.id}`;
  return '/admin/products/new';
};

// Opening / closing the editor from the page updates the address.
watch(() => [showFormModal.value, isEdit.value, editingId.value, duplicateSource.value?.id], () => {
  if (!PRODUCT_ROUTES.includes(route.name)) return; // the page is kept alive in the background
  const target = editorPath();
  if (route.fullPath !== target) router.push(target);
});

const loadProductForEditor = async (id) => {
  const listed = products.value.find((product) => String(product.id) === String(id));
  if (listed) return listed;
  try {
    if (!categories.value.length) await fetchDependencies();
    return await adminCatalogService.getProduct(id);
  } catch {
    return null;
  }
};

// The address opens the matching editor (direct link, refresh, back / forward buttons).
const openEditorFromRoute = async () => {
  if (route.name === 'Products') {
    if (showFormModal.value) closeModal();
    return;
  }
  if (route.name === 'ProductNew') {
    const from = route.query.from;
    if (!from) {
      if (!(showFormModal.value && !isEdit.value && !duplicateSource.value)) openAddModal();
      return;
    }
    if (showFormModal.value && String(duplicateSource.value?.id) === String(from)) return;
    const source = await loadProductForEditor(from);
    if (source) openDuplicateModal(source);
    else router.replace('/admin/products');
    return;
  }
  if (route.name === 'ProductEdit') {
    const id = route.params.id;
    if (showFormModal.value && isEdit.value && String(editingId.value) === String(id)) return;
    const product = await loadProductForEditor(id);
    if (product) openEditModal(product);
    else {
      triggerAlert(tx('المنتج غير موجود', 'Product not found'), 'error');
      router.replace('/admin/products');
    }
  }
};

watch(() => route.fullPath, () => {
  if (PRODUCT_ROUTES.includes(route.name)) openEditorFromRoute();
});
</script>

<style scoped>
.bulk-category-box { width: min(420px, 100%); padding: 1.4rem; display: flex; flex-direction: column; gap: 1rem; }
.bulk-category-title { margin: 0; font-size: 1rem; font-weight: 800; color: #111827; }
.bulk-category-footer { display: flex; gap: 0.6rem; }
.bulk-category-btn { flex: 1; justify-content: center; padding: 0.7rem; border-radius: 10px; cursor: pointer; font-family: inherit; font-weight: 700; }
.bulk-category-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.points-hint { margin: 0 0 0.5rem; font-size: 0.78rem; color: #9ca3af; }
.points-group { margin-bottom: 1.25rem; }
.overview-box { position: relative; }
.overview-textarea { width: 100%; box-sizing: border-box; resize: none; padding: 0.8rem 1rem 1.9rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; font: 400 0.9rem/1.6 'IBM Plex Sans Arabic', sans-serif; color: #1f2937; outline: none; transition: 0.2s; }
.overview-textarea:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(102, 0, 51, 0.08); }
.overview-counter { position: absolute; inset-inline-end: 0.9rem; bottom: 0.5rem; font-size: 0.72rem; color: #9ca3af; pointer-events: none; }
.products-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 2rem;
}

/* The list sections sit in their own wrapper (so the add / edit page can replace them): it keeps the page's spacing. */
.products-list-view { display: flex; flex-direction: column; gap: 1.5rem; }

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
.filters-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: stretch; margin-bottom: -0.5rem; }
.search-box { flex: 1 1 260px; min-width: 0; position: relative; display: flex; align-items: center; }
.filters-columns { flex: 0 0 auto; display: flex; }
.filters-row :deep(.col-btn) { height: 100%; padding: 0.7rem 1rem; border-radius: 8px; font-size: 0.85rem; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 0.7rem 2.8rem 0.7rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; transition: border-color 0.2s; }
.search-input:focus { border-color: #660033; }
.filter-select { position: relative; display: flex; align-items: center; flex: 0 1 170px; min-width: 140px; }
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

.featured-box { display: flex; flex-direction: column; gap: 0.45rem; padding: 0.85rem 1rem; margin: 0.25rem 0 1.1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; }
.featured-check { display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.92rem; font-weight: 700; color: #1f2937; line-height: 1.4; }
.featured-check input { width: 18px; height: 18px; flex-shrink: 0; margin: 0; accent-color: #660033; cursor: pointer; }
.featured-hint { display: block; margin: 0; padding-inline-start: calc(18px + 0.6rem); font-size: 0.78rem; line-height: 1.6; color: #6b7280; }
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
.image-uploader.is-missing .upload-box { border-color: #dc2626; background: #fef2f2; }
.image-uploader.is-missing .upload-box p { color: #b91c1c; }
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
.default-variant-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.1rem; background: #fff; margin-bottom: 1rem; }
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
.not-available-chip { margin-top: 8px; border-style: dashed !important; color: #6b7280; }
.not-available-chip.active { background: #6b7280 !important; border-color: #6b7280 !important; color: #fff !important; }
/* ===== Add / edit product: an inline page (not a dialog) ===== */
.editor-page { display: flex; flex-direction: column; gap: 1.25rem; }
.editor-top { display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap; }
.editor-back { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.95rem; border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; background: var(--bg-card, #fff); color: var(--text-main, #374151); font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.15s; }
.editor-back:hover { border-color: #660033; color: #660033; }
.editor-back-ico { flex: 0 0 auto; }
.editor-titles { min-width: 0; }
.editor-title { margin: 0; font-size: 1.3rem; font-weight: 800; color: var(--text-main, #111827); }
.editor-sub { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-muted, #9ca3af); }
.editor-body { display: block; }
.editor-main.form-modal { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 18px; padding-top: 1.25rem; min-width: 0; }
.editor-main .modal-tabs { flex-wrap: wrap; justify-content: flex-start; }
/* Stepper */
.stepper { list-style: none; display: flex; align-items: center; gap: 0; margin: 0 2.5rem 1.5rem; padding: 0 0 1.25rem; border-bottom: 1px solid var(--border-color, #e5e7eb); }
.step { flex: none; }
.step-btn { display: flex; align-items: center; gap: 0.7rem; background: none; border: none; padding: 0.25rem 0.4rem; cursor: pointer; font-family: inherit; text-align: start; color: var(--text-muted, #6b7280); -webkit-tap-highlight-color: transparent; }
.step-dot { width: 38px; height: 38px; flex: none; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;
  background: var(--bg-card, #fff); border: 2px solid #cbd5e1; color: #94a3b8; transition: 0.2s; }
.step-text { display: flex; flex-direction: column; line-height: 1.25; }
.step-text small { font-size: 0.72rem; font-weight: 600; color: var(--text-muted, #9ca3af); }
.step-text b { font-size: 0.92rem; font-weight: 800; }
.step.active .step-dot { background: #660033; border-color: #660033; color: #fff; box-shadow: 0 0 0 5px rgba(102, 0, 51, 0.14); }
.step.active .step-text b { color: #660033; }
.step.done .step-dot { background: rgba(102, 0, 51, 0.1); border-color: #660033; color: #660033; }
.step.done .step-text b { color: var(--text-main, #111827); }
.step-btn:hover .step-dot { border-color: #660033; }
.step-line { flex: 1; min-width: 24px; height: 3px; margin: 0 0.6rem; border-radius: 999px; background: #e2e8f0; }
.step-line.done { background: #660033; }
.stepper .tab-count { margin-inline-start: 0; }
@media (max-width: 720px) {
  .stepper { margin: 0 1rem 1.25rem; padding-bottom: 1rem; }
  .step-text small { display: none; }
  .step:not(.active) .step-text { display: none; }
  .step-dot { width: 34px; height: 34px; }
  .step-line { margin: 0 0.35rem; }
}
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; margin-inline-start: 6px; border-radius: 999px; background: #660033; color: #fff; font-size: 0.7rem; font-weight: 800; }
.editor-main .build-pane { padding: 0 1.5rem 1.5rem; }
.editor-footer { position: sticky; bottom: 0; display: flex; gap: 1rem; padding: 1rem 2.5rem; border-top: 1px solid var(--border-color, #e5e7eb); background: color-mix(in srgb, var(--bg-card, #fff) 92%, transparent); backdrop-filter: blur(6px); border-radius: 0 0 18px 18px; z-index: 5; }
.editor-footer .btn-cancel { flex: 1; padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-color, #e5e7eb); background: var(--bg-card, #fff); color: var(--text-muted, #6b7280); font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
.editor-footer .btn-back, .editor-footer .btn-next { flex: 1; padding: 0.85rem; border-radius: 10px; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; background: var(--bg-card, #fff); color: #660033; border: 1.5px solid #660033; }
.editor-footer .btn-back { color: var(--text-main, #374151); border-color: var(--border-color, #cbd5e1); }
.editor-footer .btn-next.primary { flex: 2; background: #660033; color: #fff; }
.editor-footer .btn-next.primary:hover { background: #4d0026; }
.editor-footer .btn-submit { flex: 2; padding: 0.85rem; border-radius: 10px; border: none; background: #660033; color: #fff; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.editor-footer .btn-submit:hover:not(:disabled) { background: #4d0026; }
.editor-footer .btn-submit:disabled { opacity: 0.6; cursor: wait; }
@media (max-width: 600px) {
  .editor-main .build-pane { padding: 0 1rem 1rem; }
  .editor-footer { padding: 0.9rem 1.25rem; }
}
@media (max-width: 640px) {
  .filters-row { gap: 0.6rem; }
  .search-box { flex: 1 1 100%; }
  .filter-select { flex: 1 1 calc(50% - 0.3rem); min-width: 0; }
  .filters-columns { flex: 1 1 100%; }
  .filters-columns :deep(.col-picker) { width: 100%; }
  .filters-columns :deep(.col-btn) { width: 100%; justify-content: center; }
}
</style>
