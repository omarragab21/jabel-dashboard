<template>
  <div class="offers-page" data-testid="offers-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <div class="tag-icon-wrapper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
          </svg>
        </div>
        <div>
          <h2 class="page-title">{{ tx('إدارة العروض', 'Offers') }}</h2>
          <p class="page-subtitle">{{ tx('إنشاء وإدارة العروض الترويجية', 'Create and manage promotional offers') }}</p>
        </div>
      </div>
      <button class="add-btn" data-testid="create-offer" @click="openCreate">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {{ tx('إنشاء عرض جديد', 'Create offer') }}
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper pink">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('إجمالي العروض', 'Total offers') }}</span>
          <h3 class="stat-value" data-testid="stat-total">{{ offers.length }}</h3>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('العروض النشطة', 'Active offers') }}</span>
          <h3 class="stat-value" data-testid="stat-active">{{ countByStatus('active') }}</h3>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper gray">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('المنتهية', 'Expired') }}</span>
          <h3 class="stat-value" data-testid="stat-expired">{{ countByStatus('expired') }}</h3>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ tx('الموقوفة', 'Paused') }}</span>
          <h3 class="stat-value" data-testid="stat-paused">{{ countByStatus('paused') }}</h3>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('بحث باسم العرض...', 'Search offers...')" class="search-input" data-testid="offers-search" />
      </div>
      <div class="filter-select">
        <select v-model="typeFilter" class="form-select" data-testid="offers-type-filter">
          <option value="">{{ tx('كل العروض', 'All offers') }}</option>
          <option value="percentage">{{ tx('نسبة مئوية', 'Percentage') }}</option>
          <option value="fixed">{{ tx('مبلغ ثابت', 'Fixed amount') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="filter-select">
        <select v-model="statusFilter" class="form-select" data-testid="offers-status-filter">
          <option value="">{{ tx('كل الحالات', 'All statuses') }}</option>
          <option value="active">{{ tx('نشط', 'Active') }}</option>
          <option value="scheduled">{{ tx('مجدول', 'Scheduled') }}</option>
          <option value="expired">{{ tx('منتهي', 'Expired') }}</option>
          <option value="paused">{{ tx('موقوف', 'Paused') }}</option>
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="date-comp"><input type="date" lang="en-GB" v-model="startDateFilter" class="date-input" :title="tx('من تاريخ', 'From date')" /></div>
      <div class="date-comp"><input type="date" lang="en-GB" v-model="endDateFilter" class="date-input" :title="tx('إلى تاريخ', 'To date')" /></div>
      <button v-if="hasFilters" type="button" class="clear-filters" :title="tx('مسح الفلاتر', 'Clear filters')" :aria-label="tx('مسح الفلاتر', 'Clear filters')" @click="clearFilters">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-name text-right">{{ tx('اسم العرض', 'Offer name') }}</th>
            <th>{{ tx('النوع', 'Type') }}</th>
            <th>{{ tx('قيمة الخصم', 'Discount') }}</th>
            <th>{{ tx('ينطبق على', 'Applies to') }}</th>
            <th>{{ tx('تاريخ البداية', 'Start date') }}</th>
            <th>{{ tx('تاريخ النهاية', 'End date') }}</th>
            <th>{{ tx('الاستخدامات', 'Usage') }}</th>
            <th>{{ tx('الحالة', 'Status') }}</th>
            <th>{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="9">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="loadFailed" class="state-row"><td colspan="9">
            {{ tx('تعذّر تحميل العروض من الخادم.', 'Could not load the offers from the server.') }}
            <button type="button" class="retry-btn" @click="fetchOffers">{{ tx('إعادة المحاولة', 'Retry') }}</button>
          </td></tr>
          <tr v-else-if="filteredOffers.length === 0" class="state-row" data-testid="offers-empty"><td colspan="9">
            <div class="empty-state">
              <div class="empty-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>
              <span>{{ offers.length ? tx('لا توجد عروض مطابقة', 'No matching offers') : tx('لا توجد عروض بعد', 'No offers yet') }}</span>
            </div>
          </td></tr>
          <template v-else>
            <tr v-for="offer in pagedOffers" :key="offer.id" class="data-row" data-testid="offer-row">
              <td class="col-name text-right">
                <div class="name-cell">
                  <img v-if="offerImage(offer)" :src="offerImage(offer)" class="offer-thumb" alt="" data-testid="offer-thumb" />
                  <span v-else class="offer-thumb offer-thumb-empty" aria-hidden="true">%</span>
                  <span class="offer-name">{{ displayName(offer) }}</span>
                </div>
              </td>
              <td><span class="type-text">{{ offer.type === 'fixed' ? tx('مبلغ ثابت', 'Fixed amount') : tx('نسبة مئوية', 'Percentage') }}</span></td>
              <td><span class="discount-pill" dir="ltr" data-testid="offer-value">{{ discountLabel(offer) }}</span></td>
              <td>
                <span v-if="!coversAllProducts(offer)" class="scope-text">{{ offer.products_count }} {{ tx('منتج محدد', 'selected products') }}</span>
                <span v-else class="scope-text">{{ tx('جميع المنتجات', 'All products') }}</span>
              </td>
              <td>{{ formatDate(offer.start_date) }}</td>
              <td>{{ formatDate(offer.end_date) }}</td>
              <td>
                <div v-if="usageFor(offer)" class="usage-cell" data-testid="offer-usage" :title="usageTitle(offer)">
                  <strong>{{ usageFor(offer).orders }}</strong>
                  <small>{{ tx('طلب', 'orders') }} · {{ usageFor(offer).customers }} {{ tx('عميل', 'customers') }}</small>
                </div>
                <span v-else class="usage-cell muted" data-testid="offer-usage" :title="usageLoading ? tx('جاري الحساب...', 'Counting...') : tx('تعذّر حساب الاستخدامات', 'Could not count the usage')">{{ usageLoading ? '…' : '—' }}</span>
              </td>
              <td><span :class="['status-badge-table', offer.status]" data-testid="offer-status">{{ formatStatus(offer.status) }}</span></td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit-btn" data-testid="offer-edit" @click="openEdit(offer)" :title="tx('تعديل العرض', 'Edit offer')" :aria-label="tx('تعديل العرض', 'Edit offer')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    :class="['action-btn', offer.is_active ? 'pause-btn' : 'resume-btn']"
                    data-testid="offer-toggle"
                    :disabled="togglingId === offer.id"
                    :title="offer.is_active ? tx('إيقاف العرض', 'Pause offer') : tx('تفعيل العرض', 'Activate offer')"
                    :aria-label="offer.is_active ? tx('إيقاف العرض', 'Pause offer') : tx('تفعيل العرض', 'Activate offer')"
                    @click="toggleOffer(offer)"
                  >
                    <svg v-if="offer.is_active" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    data-testid="offer-delete"
                    :disabled="deletingId === offer.id"
                    :title="tx('حذف العرض', 'Delete offer')"
                    :aria-label="tx('حذف العرض', 'Delete offer')"
                    @click="deleteOffer(offer)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div v-if="filteredOffers.length > PAGE_SIZE" class="pager" data-testid="offers-pager">
        <span class="pager-info">{{ tx('عرض', 'Showing') }} {{ pageFrom }}-{{ pageTo }} {{ tx('من', 'of') }} {{ filteredOffers.length }}</span>
        <div class="pager-buttons">
          <button type="button" class="pager-btn" :disabled="page === 1" :aria-label="tx('السابق', 'Previous')" @click="page -= 1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button v-for="n in pageCount" :key="n" type="button" :class="['pager-btn', { active: n === page }]" @click="page = n">{{ n }}</button>
          <button type="button" class="pager-btn" :disabled="page === pageCount" :aria-label="tx('التالي', 'Next')" @click="page += 1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-content form-content" role="dialog" aria-modal="true" data-testid="offer-modal">
        <button class="modal-close" type="button" :aria-label="tx('إغلاق', 'Close')" @click="closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="form-header">
          <div class="header-icon-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
          </div>
          <h3 class="modal-title-main">{{ editingId ? tx('تعديل العرض', 'Edit offer') : tx('إنشاء عرض جديد', 'Create offer') }}</h3>
          <p class="modal-subtitle-main">{{ tx('أدخل تفاصيل العرض الترويجي', 'Enter the promotional offer details') }}</p>
        </div>

        <div v-if="editingId && usageFor(editingOffer)" class="usage-box" data-testid="offer-usage-info">
          <strong>{{ tx('الاستخدامات', 'Usage') }}</strong>
          <span>{{ usageTitle(editingOffer) }}</span>
        </div>
        <form @submit.prevent="saveOffer" class="offer-form" novalidate>
          <div class="form-section">
            <div class="i18n-toggle" role="tablist" aria-label="Language" dir="ltr">
              <button type="button" class="i18n-btn" :class="{ active: activeLang === 'en' }" @click="activeLang = 'en'">English</button>
              <button type="button" class="i18n-btn" :class="{ active: activeLang === 'ar' }" @click="activeLang = 'ar'">العربية</button>
            </div>

            <label class="form-label">{{ tx('اسم العرض', 'Offer name') }} <span class="req">*</span></label>
            <input v-show="activeLang === 'ar'" type="text" v-model="form.name_ar" :class="['form-control', { invalid: errors.name_ar }]" placeholder="مثال: خصم الصيف الكبير" data-testid="offer-name-ar" />
            <input v-show="activeLang === 'en'" type="text" v-model="form.name_en" :class="['form-control', 'ltr-text', { invalid: errors.name_en }]" placeholder="e.g. Summer Big Discount" data-testid="offer-name-en" />
            <span v-if="activeLang === 'ar' && errors.name_ar" class="field-error" data-testid="err-name-ar">{{ tx('اسم العرض بالعربي مطلوب', 'The Arabic name is required') }}</span>
            <span v-if="activeLang === 'en' && errors.name_en" class="field-error" data-testid="err-name-en">{{ tx('اسم العرض بالإنجليزي مطلوب', 'The English name is required') }}</span>
          </div>

          <div class="form-section">
            <label class="form-label">{{ tx('صورة العرض', 'Offer image') }}</label>
            <div class="upload-wrapper" data-testid="offer-image-upload" @click="fileInputRef?.click()">
              <input type="file" ref="fileInputRef" accept="image/*" hidden data-testid="offer-image-input" @change="handleImageUpload" />
              <div class="upload-box">
                <template v-if="imagePreview">
                  <img :src="imagePreview" class="preview-image" alt="Preview" data-testid="offer-image-preview" />
                  <div class="image-actions"><ImageCropButton @crop="recropCurrentImage" /></div>
                </template>
                <div v-else class="upload-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p>{{ tx('انقر لرفع صورة العرض', 'Click to upload the offer image') }}</p>
                  <span>{{ tx('الحد الأقصى 1 ميجابايت', 'Maximum 1 MB') }}</span>
                </div>
              </div>
            </div>
            <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
          </div>

          <div class="form-section">
            <label class="form-label">{{ tx('نوع العرض', 'Offer type') }} <span class="req">*</span></label>
            <div class="type-grid" role="radiogroup">
              <button type="button" role="radio" :aria-checked="form.type === 'percentage'" :class="['type-card', { active: form.type === 'percentage' }]" data-testid="type-percentage" @click="form.type = 'percentage'">
                <span class="type-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></span>
                <span><strong>{{ tx('نسبة مئوية %', 'Percentage %') }}</strong><small>{{ tx('خصم بنسبة من السعر', 'A percentage off the price') }}</small></span>
              </button>
              <button type="button" role="radio" :aria-checked="form.type === 'fixed'" :class="['type-card', { active: form.type === 'fixed' }]" data-testid="type-fixed" @click="form.type = 'fixed'">
                <span class="type-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
                <span><strong>{{ tx('مبلغ ثابت', 'Fixed amount') }}</strong><small>{{ tx('خصم مبلغ محدد', 'A set amount off the price') }}</small></span>
              </button>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label">{{ form.type === 'fixed' ? `مبلغ الخصم (${cur})` : tx('نسبة الخصم (%)', 'Discount (%)') }} <span class="req">*</span></label>
            <div class="input-suffix">
              <input
                type="number" inputmode="decimal" step="any" min="0" :max="form.type === 'percentage' ? 100 : undefined"
                v-model="form.value" :class="['form-control', 'no-spin', { invalid: errors.value }]"
                :placeholder="form.type === 'fixed' ? '10' : '25'" data-testid="offer-value-input" @wheel="$event.target.blur()"
              />
              <span class="suffix">{{ form.type === 'fixed' ? cur : '%' }}</span>
            </div>
            <span v-if="errors.value === 'required'" class="field-error" data-testid="err-value">{{ form.type === 'fixed' ? tx('اكتب مبلغ الخصم', 'Enter the discount amount') : tx('اكتب نسبة الخصم', 'Enter the discount percentage') }}</span>
            <span v-else-if="errors.value === 'too_high'" class="field-error" data-testid="err-value">{{ tx('النسبة لا يمكن أن تزيد عن 100%', 'The percentage cannot be more than 100%') }}</span>
          </div>

          <div class="form-section">
            <label class="form-label">{{ tx('ينطبق على', 'Applies to') }}</label>
            <div class="pricing-mode-toggle" role="radiogroup">
              <button type="button" class="mode-btn" role="radio" :aria-checked="form.applies_to === 'all'" :class="{ active: form.applies_to === 'all' }" data-testid="applies-all" @click="form.applies_to = 'all'">{{ tx('جميع المنتجات', 'All products') }}</button>
              <button type="button" class="mode-btn" role="radio" :aria-checked="form.applies_to === 'products'" :class="{ active: form.applies_to === 'products' }" data-testid="applies-products" @click="form.applies_to = 'products'">{{ tx('منتجات محددة', 'Selected products') }}</button>
            </div>

            <div v-if="form.applies_to === 'products'" class="selection-box-area" data-testid="product-picker">
              <div class="products-toolbar">
                <div class="search-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" v-model="productSearch" class="form-control search-control" :placeholder="tx('ابحث عن منتج...', 'Search products...')" />
                </div>
                <label class="chk-item select-all">
                  <input type="checkbox" :checked="allFilteredSelected" :disabled="!filteredProducts.length" @change="toggleAllProducts" />
                  <span>{{ tx('تحديد الكل', 'Select all') }}</span>
                </label>
              </div>
              <div class="product-pick-list">
                <p v-if="!filteredProducts.length" class="hint">{{ tx('لا توجد منتجات مطابقة.', 'No matching products.') }}</p>
                <div v-for="product in filteredProducts" :key="product.id" class="product-pick-row" :class="{ selected: isSelected(product.id) }" data-testid="product-pick" @click="toggleProduct(product.id)">
                  <input type="checkbox" :checked="isSelected(product.id)" @click.stop @change="toggleProduct(product.id)" />
                  <div class="product-thumb">
                    <img v-if="productImage(product)" :src="productImage(product)" :alt="productName(product)" />
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  </div>
                  <span class="product-pick-name">{{ productName(product) }}</span>
                </div>
              </div>
            </div>
            <div v-if="form.applies_to === 'products'" class="picked-count">{{ tx('تم تحديد', 'Selected') }} {{ form.selected_products.length }} {{ tx('منتج', 'products') }}</div>
            <span v-if="errors.selected_products" class="field-error" data-testid="err-products">{{ tx('اختر منتجًا واحدًا على الأقل', 'Choose at least one product') }}</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">{{ tx('تاريخ البداية', 'Start date') }} <span class="req">*</span></label>
              <input type="date" lang="en-GB" v-model="form.start_date" :class="['form-control', { invalid: errors.start_date }]" data-testid="offer-start" />
              <span v-if="errors.start_date" class="field-error" data-testid="err-start">{{ tx('حدد تاريخ البداية', 'Pick the start date') }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">{{ tx('تاريخ النهاية', 'End date') }} <span class="req">*</span></label>
              <input type="date" lang="en-GB" v-model="form.end_date" :min="form.start_date || undefined" :class="['form-control', { invalid: errors.end_date }]" data-testid="offer-end" />
              <span v-if="errors.end_date === 'required'" class="field-error" data-testid="err-end">{{ tx('حدد تاريخ النهاية', 'Pick the end date') }}</span>
              <span v-else-if="errors.end_date === 'before_start'" class="field-error" data-testid="err-end">{{ tx('تاريخ النهاية قبل تاريخ البداية', 'The end date is before the start date') }}</span>
            </div>
          </div>

          <div class="form-section-toggle">
            <span class="toggle-lbl">{{ tx('تفعيل العرض', 'Enable offer') }}</span>
            <label class="toggle-switch">
              <input type="checkbox" v-model="form.is_active" hidden data-testid="offer-active">
              <div class="t-slider" :class="{ on: form.is_active }"><div class="t-knob"></div></div>
            </label>
          </div>

          <div class="form-footer-btns">
            <button type="button" class="btn-cancel-form" @click="closeModal">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-submit-form" :disabled="saving" data-testid="offer-save">
              {{ saving ? tx('جاري الحفظ...', 'Saving...') : (editingId ? tx('حفظ التعديلات', 'Save changes') : tx('إنشاء العرض', 'Create offer')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" :class="[alertType, { show: showAlert }]" role="status" data-testid="offers-toast">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <path v-if="alertType === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline v-if="alertType === 'success'" points="22 4 12 14.01 9 11.01"/>
        <circle v-if="alertType === 'error'" cx="12" cy="12" r="10"/><line v-if="alertType === 'error'" x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { localizeMessage } from '../utils/uiMessages';
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
import { apiErrorMessage } from '../utils/apiMessage';
import { computed, onMounted, ref, watch } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import adminCatalogService from '../application/adminCatalogService';
import { offerUsage, promotionDiscountLabel, promotionFormFrom, toPromotionPayload, validatePromotionForm } from '../domain/catalog/adminCatalog';
import ImageCropModal from '../components/ImageCropModal.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useDialog } from '../composables/useDialog';
import { useImageCrop } from '../composables/useImageCrop';
import { safeObjectUrl, sanitizeAssetUrl } from '../utils/adminSecurity';

const { tx, locale } = useAdminText();
const { cur } = useCurrencyLabel();
const dialog = useDialog();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();

const PAGE_SIZE = 10;

const offers = ref([]);
const products = ref([]);
const loading = ref(false);
const loadFailed = ref(false);
const saving = ref(false);
const togglingId = ref(null);
const deletingId = ref(null);
const usageByOffer = ref({});
const usageLoading = ref(false);
const showModal = ref(false);
const editingId = ref(null);
// The form opens on the dashboard's language; Arabic tab sits on the right, English on the left.
const formLang = () => (locale.value === 'en' ? 'en' : 'ar');
const activeLang = ref(formLang());
const submitted = ref(false);

const searchQuery = ref('');
const typeFilter = ref('');
const statusFilter = ref('');
const startDateFilter = ref('');
const endDateFilter = ref('');
const page = ref(1);
const productSearch = ref('');

const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');
let alertTimer = null;
const triggerAlert = (message, type = 'success') => {
  alertMessage.value = localizeMessage(message);
  alertType.value = type;
  showAlert.value = true;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => { showAlert.value = false; }, 3000);
};

const emptyForm = () => ({
  name_ar: '', name_en: '',
  type: 'percentage', value: '', applies_to: 'all', selected_products: [],
  start_date: '', end_date: '', is_active: true,
});
const form = ref(emptyForm());
const imageFile = ref(null);
const imagePreview = ref(null);
const fileInputRef = ref(null);

const backendOrigin = (import.meta.env.VITE_API_BASE_URL || 'https://backend-jabal.be-kite.com/api')
  .replace(/\/api\/?$/, '');

// Stored images come back as /storage/... paths on the backend host.
const resolveImage = (value) => {
  if (!value) return null;
  const raw = String(value);
  const resolved = raw.startsWith('/storage/')
    ? `${backendOrigin}/public${raw}`
    : (raw.includes('/storage/') && !raw.includes('/public/storage/') ? raw.replace('/storage/', '/public/storage/') : raw);
  return sanitizeAssetUrl(resolved, '');
};
const offerImage = (offer) => resolveImage(offer.image_url || offer.image);

const cropOptions = () => ({ maxSizeMB: 1, defaultRatio: '16:9', fileName: 'offer', title: tx('قص وضبط مقاسات صورة العرض (Crop & Resize)', 'Crop & resize offer image') });

// Every picked image goes through the crop modal before it is staged for upload.
const handleImageUpload = async (event) => {
  const picked = event.target.files?.[0];
  event.target.value = '';
  if (!picked) return;
  const { file, error } = await prepareImage(picked, cropOptions());
  if (error) { triggerAlert(error, 'error'); return; }
  if (!file) return;
  imageFile.value = file;
  imagePreview.value = safeObjectUrl(file, imagePreview.value);
};

const recropCurrentImage = async () => {
  const { file, error } = await recropImage(imageFile.value || imagePreview.value, cropOptions());
  if (error) triggerAlert(error, 'error');
  if (!file) return;
  imageFile.value = file;
  imagePreview.value = safeObjectUrl(file, imagePreview.value);
};

// Mistakes are shown only after the first save attempt, and follow the form as it is fixed.
const errors = computed(() => (submitted.value ? validatePromotionForm(form.value) : {}));

const formatDate = (value) => (value ? String(value).slice(0, 10) : '—');
const lang = computed(() => (locale.value === 'en' ? 'en' : 'ar'));
const displayName = (offer) => offer.name_i18n?.[lang.value] || offer.name_i18n?.ar || offer.name_i18n?.en || offer.name || `${tx('عرض', 'Offer')} #${offer.id}`;
const discountLabel = (offer) => promotionDiscountLabel(offer, cur.value);
const formatStatus = (status) => {
  const labels = { active: ['نشط', 'Active'], paused: ['موقوف', 'Paused'], expired: ['منتهي', 'Expired'], scheduled: ['مجدول', 'Scheduled'] };
  return labels[status] ? tx(...labels[status]) : status;
};

const countByStatus = (status) => offers.value.filter((offer) => offer.status === status).length;

const hasFilters = computed(() => Boolean(searchQuery.value || typeFilter.value || statusFilter.value || startDateFilter.value || endDateFilter.value));
const clearFilters = () => {
  searchQuery.value = '';
  typeFilter.value = '';
  statusFilter.value = '';
  startDateFilter.value = '';
  endDateFilter.value = '';
};

const filteredOffers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return offers.value.filter((offer) => {
    const nameMatch = !q
      || (offer.name_i18n?.ar || '').toLowerCase().includes(q)
      || (offer.name_i18n?.en || '').toLowerCase().includes(q)
      || (offer.name || '').toLowerCase().includes(q);
    const typeMatch = !typeFilter.value || offer.type === typeFilter.value;
    const statusMatch = !statusFilter.value || offer.status === statusFilter.value;
    const start = offer.start_date ? String(offer.start_date).slice(0, 10) : '';
    const end = offer.end_date ? String(offer.end_date).slice(0, 10) : '';
    const startMatch = !startDateFilter.value || (start && start >= startDateFilter.value);
    const endMatch = !endDateFilter.value || (end && end <= endDateFilter.value);
    return nameMatch && typeMatch && statusMatch && startMatch && endMatch;
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredOffers.value.length / PAGE_SIZE)));
const pagedOffers = computed(() => filteredOffers.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const pageFrom = computed(() => (filteredOffers.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0));
const pageTo = computed(() => Math.min(page.value * PAGE_SIZE, filteredOffers.value.length));
// A new search or filter starts on the first page; a shorter list never leaves you on a page that is gone.
watch([searchQuery, typeFilter, statusFilter, startDateFilter, endDateFilter], () => { page.value = 1; });
watch(pageCount, (count) => { if (page.value > count) page.value = count; });

// The API only holds chosen products, so an offer on every product of the catalog reads as "all products".
const coversAllProducts = (offer) => products.value.length > 0 && offer.products_count >= products.value.length;

// How often each offer was used, counted from the orders (the API keeps no counter). Never blocks the list.
const loadUsage = async (list) => {
  usageLoading.value = true;
  try {
    const [orders, details] = await Promise.all([
      adminCatalogService.listOrdersForUsage(),
      Promise.allSettled(list.map((offer) => adminCatalogService.getPromotion(offer.id))),
    ]);
    const next = {};
    details.forEach((result, index) => {
      if (result.status === 'fulfilled') next[list[index].id] = offerUsage({ ...list[index], ...result.value }, orders);
    });
    usageByOffer.value = next;
  } catch {
    usageByOffer.value = {};
  } finally {
    usageLoading.value = false;
  }
};
const usageFor = (offer) => (offer ? usageByOffer.value[offer.id] || null : null);
const usageTitle = (offer) => {
  const usage = usageFor(offer);
  return usage
    ? tx(`استخدمه ${usage.customers} عميل في ${usage.orders} طلب (${usage.units} قطعة)`, `Used by ${usage.customers} customers in ${usage.orders} orders (${usage.units} items)`)
    : '';
};
const editingOffer = computed(() => offers.value.find((offer) => String(offer.id) === String(editingId.value)) || null);

const fetchOffers = async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    offers.value = await adminCatalogService.listPromotions();
    loadUsage(offers.value);
  } catch (error) {
    offers.value = [];
    loadFailed.value = true;
    triggerAlert(apiErrorMessage(error, 'تعذّر تحميل العروض من الخادم'), 'error');
  } finally {
    loading.value = false;
  }
};
const fetchProducts = async () => {
  try { products.value = await adminCatalogService.listAllProducts({ per_page: 100 }); } catch { products.value = []; }
};

const openCreate = () => {
  editingId.value = null;
  form.value = emptyForm();
  imageFile.value = null;
  imagePreview.value = null;
  submitted.value = false;
  activeLang.value = formLang();
  productSearch.value = '';
  showModal.value = true;
};

const openEdit = async (offer) => {
  editingId.value = offer.id;
  imageFile.value = null;
  imagePreview.value = offerImage(offer);
  submitted.value = false;
  activeLang.value = formLang();
  productSearch.value = '';
  // The list does not carry the chosen products: read the offer before showing its form.
  let detailed = offer;
  try { detailed = await adminCatalogService.getPromotion(offer.id); } catch { detailed = offer; }
  form.value = { ...emptyForm(), ...promotionFormFrom({ ...offer, ...detailed }, products.value.map((product) => product.id)) };
  showModal.value = true;
};

const closeModal = () => { if (!saving.value) showModal.value = false; };

// Product picker
const productName = (product) => product.name || product.name_i18n?.ar || product.name_ar || `منتج #${product.id}`;
const productImage = (product) => product.images?.[0] || product.image || '';
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter((product) => `${productName(product)} ${product.name_i18n?.en || ''}`.toLowerCase().includes(q));
});
const isSelected = (id) => form.value.selected_products.some((selected) => String(selected) === String(id));
const toggleProduct = (id) => {
  const index = form.value.selected_products.findIndex((selected) => String(selected) === String(id));
  if (index >= 0) form.value.selected_products.splice(index, 1);
  else form.value.selected_products.push(id);
};
const allFilteredSelected = computed(() => filteredProducts.value.length > 0 && filteredProducts.value.every((product) => isSelected(product.id)));
const toggleAllProducts = () => {
  const ids = filteredProducts.value.map((product) => product.id);
  if (allFilteredSelected.value) {
    form.value.selected_products = form.value.selected_products.filter((selected) => !ids.some((id) => String(id) === String(selected)));
  } else {
    ids.filter((id) => !isSelected(id)).forEach((id) => form.value.selected_products.push(id));
  }
};

const apiMessage = (error, fallback) => {
  const data = error.response?.data;
  if (data?.errors) return Object.values(data.errors)[0]?.[0] || fallback;
  return data?.message || fallback;
};

const saveOffer = async () => {
  submitted.value = true;
  const found = validatePromotionForm(form.value);
  if (Object.keys(found).length) {
    // Show the language tab that has the missing name.
    if (found.name_ar) activeLang.value = 'ar';
    else if (found.name_en) activeLang.value = 'en';
    return;
  }
  saving.value = true;
  try {
    const payload = toPromotionPayload(form.value, products.value.map((product) => product.id));
    if (editingId.value) {
      await adminCatalogService.updatePromotion(editingId.value, payload, imageFile.value);
      triggerAlert('تم تحديث العرض بنجاح');
    } else {
      await adminCatalogService.createPromotion(payload, imageFile.value);
      triggerAlert('تم إنشاء العرض بنجاح');
    }
    showModal.value = false;
    await fetchOffers();
  } catch (error) {
    triggerAlert(apiMessage(error, 'فشل حفظ العرض'), 'error');
  } finally {
    saving.value = false;
  }
};

// Pause or resume an offer from the table: the saved offer, with only its active flag changed.
const deleteOffer = async (offer) => {
  if (deletingId.value) return;
  const name = displayName(offer);
  const ok = await dialog.confirm(
    tx(`سيتم حذف العرض «${name}» نهائيًا وتعود أسعار منتجاته إلى سعرها العادي في الموقع.`, `The offer "${name}" will be deleted for good and its products go back to their normal price on the site.`),
    { type: 'error', title: tx('حذف العرض؟', 'Delete this offer?'), confirmText: tx('حذف العرض', 'Delete offer') },
  );
  if (!ok) return;
  deletingId.value = offer.id;
  try {
    await adminCatalogService.deletePromotion(offer.id);
    triggerAlert('تم حذف العرض');
    await fetchOffers();
  } catch (error) {
    triggerAlert(apiMessage(error, 'تعذّر حذف العرض'), 'error');
  } finally {
    deletingId.value = null;
  }
};

const toggleOffer = async (offer) => {
  if (togglingId.value) return;
  togglingId.value = offer.id;
  const turnOn = !offer.is_active;
  try {
    await adminCatalogService.togglePromotion(offer.id);
    triggerAlert(turnOn ? 'تم تفعيل العرض' : 'تم إيقاف العرض');
    await fetchOffers();
  } catch (error) {
    triggerAlert(apiMessage(error, 'تعذّر تغيير حالة العرض'), 'error');
  } finally {
    togglingId.value = null;
  }
};

onMounted(() => { fetchOffers(); fetchProducts(); });
</script>

<style scoped>
.offers-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 3rem;
}

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.title-with-icon { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }
.tag-icon-wrapper { background: #f3f4f6; color: #660033; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 0; }

.add-btn {
  display: flex; align-items: center; gap: 0.5rem; background: #660033; color: #fff; border: none; padding: 0.65rem 1.1rem; border-radius: 8px;
  font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.add-btn:hover { background: #4d0026; }

/* Stats Cards */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.stat-icon-wrapper { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-icon-wrapper.pink { background: #f3f4f6; color: #660033; }
.stat-icon-wrapper.green { background: #ecfdf5; color: #10b981; }
.stat-icon-wrapper.gray { background: #f9fafb; color: #6b7280; }
.stat-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
.stat-info { display: flex; flex-direction: column; gap: 0.2rem; }
.stat-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; }
.stat-value { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; }

/* Filters */
.filters-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.search-box { flex: 1; min-width: 250px; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 0.75rem 2.8rem 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; }
.search-input:focus { border-color: #660033; }
.filter-select { position: relative; display: flex; align-items: center; min-width: 150px; }
.form-select { width: 100%; padding: 0.75rem 0.75rem 0.75rem 2.2rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #374151; appearance: none; outline: none; }
.filter-select .select-icon { position: absolute; left: 0.75rem; color: #9ca3af; pointer-events: none; }
.date-input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.65rem 0.75rem; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #374151; outline: none; }

/* Table */
.table-container { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto; margin-top: 0.5rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 1.1rem 0.75rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; text-align: center; }
.data-table th { background: #f9fafb; font-size: 0.75rem; font-weight: 700; color: #6b7280; white-space: nowrap; }
.data-table td { font-size: 0.82rem; color: #374151; }
.data-row:hover td { background: #f3f4f6; }
.state-row td { padding: 3rem 1rem; color: #6b7280; }

.text-right { text-align: right !important; }
.font-bold { font-weight: 700; }
.text-blue { color: #2563eb; }
.ltr-text { direction: ltr; }
.col-discount .discount-pill { display: inline-block; background: #fdf2f8; color: #660033; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px; }
.mode-hint, .old-total { display: block; color: #9ca3af; font-size: 0.7rem; margin-top: 0.2rem; }
.old-total { text-decoration: line-through; }
.pricing-mode-toggle { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
.mode-btn { flex: 1; padding: 0.55rem 0.75rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; font-family: inherit; font-size: 0.8rem; font-weight: 700; color: #6b7280; cursor: pointer; }
.mode-btn.active { border-color: #660033; background: #fdf2f8; color: #660033; }
.input-suffix { position: relative; display: flex; align-items: center; }
.input-suffix .form-control { padding-left: 3rem; }
.input-suffix .suffix { position: absolute; left: 0.85rem; color: #6b7280; font-size: 0.8rem; font-weight: 700; }
.bundle-summary { border: 1px dashed #e5e7eb; border-radius: 10px; padding: 0.9rem 1rem; background: #fafafa; display: flex; flex-direction: column; gap: 0.45rem; }
.bundle-summary .sum-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: #374151; }
.bundle-summary .sum-row.saving { color: #059669; font-weight: 700; }
.bundle-summary .old-total { margin: 0; font-size: 0.85rem; }
.name-cell { display: flex; align-items: center; gap: 0.75rem; }
.offer-thumb { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0; background: #f3f4f6; }
.offer-thumb-empty { display: inline-flex; align-items: center; justify-content: center; color: #9ca3af; font-weight: 700; }
.image-actions { margin-top: 0.625rem; }
.offer-name { display: block; font-weight: 700; color: #111827; }

/* Usage Bar */
.usage-text { font-size: 0.65rem; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
.usage-bar-bg { width: 80px; height: 6px; background: #f3f4f6; border-radius: 10px; margin: 0 auto; overflow: hidden; }
.usage-bar-fill { height: 100%; background: #660033; border-radius: 10px; }

/* Status Badges */
.status-badge-table { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
.status-badge-table.active { background: #ecfdf5; color: #059669; }
.status-badge-table.paused { background: #eff6ff; color: #2563eb; }
.status-badge-table.expired { background: #fef2f2; color: #dc2626; }
.status-badge-table.scheduled { background: #fff7ed; color: #ea580c; }

/* Actions */
.actions-group { display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
.action-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
.view-btn { background: #f3f4f6; color: #660033; }
.edit-btn { background: #eff6ff; color: #2563eb; }
.delete-btn { background: #fef2f2; color: #dc2626; }
.action-btn:hover { opacity: 0.8; transform: translateY(-1px); }

/* Delete Modal */
.delete-modal { max-width: 460px; padding: 28px; text-align: center; }
.delete-icon { width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626; background: #fef2f2; }
.delete-copy h2 { margin: 0 0 8px; color: #111827; font-size: 1.2rem; }
.delete-copy p { margin: 0; color: #6b7280; line-height: 1.7; font-size: 0.92rem; }
.delete-footer { display: flex; gap: 1rem; padding: 24px 0 0; }
.delete-footer button { min-height: 44px; }
.btn-delete-confirm { background: #dc2626; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; flex: 1; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-delete-confirm:hover { background: #b91c1c; }
.btn-delete-confirm:disabled, .btn-cancel-form:disabled { opacity: 0.6; cursor: not-allowed; }
.delete-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.45); border-top-color: white; border-radius: 50%; animation: delete-spin 0.7s linear infinite; }
@keyframes delete-spin { to { transform: rotate(360deg); } }

/* FORM MODAL */
.form-content { max-width: 650px; padding: 0; max-height: 95vh; overflow-y: auto; }
.form-header { text-align: center; padding: 2rem 2rem 1.5rem 2rem; position: relative; }
.header-icon-main { width: 50px; height: 50px; background: #f3f4f6; color: #660033; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.modal-title-main { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0; }
.modal-subtitle-main { font-size: 0.85rem; color: #9ca3af; margin-top: 0.4rem; }

.offer-form { padding: 0 2.5rem 2.5rem 2.5rem; }
.i18n-toggle { display: inline-flex; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; margin: 0 auto 1.1rem; }
.i18n-btn { border: none; background: transparent; padding: 0.4rem 0.9rem; font-weight: 800; font-size: 0.85rem; cursor: pointer; color: #6b7280; min-width: 96px; font-family: 'IBM Plex Sans Arabic', sans-serif; }
.i18n-btn.active { background: #660033; color: #fff; }
.form-section { margin-bottom: 1.5rem; }
.form-label { display: block; font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem; text-align: right; }
.req { color: #dc2626; }
.form-control { width: 100%; padding: 0.8rem 1rem; border: 1px solid #e5e7eb; border-radius: 10px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; transition: 0.2s; outline: none; background: #f9fafb; box-sizing: border-box; }
.form-control:focus { background: #fff; border-color: #660033; box-shadow: 0 0 0 4px rgba(0,0,0, 0.08); }
.select-control { appearance: none; padding-left: 2.2rem; }

/* Upload */
.upload-wrapper { width: 100%; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 1.5rem; text-align: center; cursor: pointer; transition: 0.2s; background: #f9fafb; margin-bottom: 1rem; box-sizing: border-box; }
.upload-wrapper:hover { border-color: #660033; background: #fff; }
.upload-box { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 120px; }
.preview-image { max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #6b7280; }
.upload-placeholder svg { color: #9ca3af; margin-bottom: 0.25rem; }
.upload-placeholder p { font-size: 0.9rem; font-weight: 700; margin: 0; color: #374151; }
.upload-placeholder span { font-size: 0.75rem; color: #9ca3af; }

/* Items */
.items-section { border-top: 1px solid #f3f4f6; padding-top: 1.25rem; }
.items-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.items-heading .form-label { margin-bottom: 0; }
.items-count { font-size: 0.75rem; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 0.25rem 0.6rem; border-radius: 6px; }
.selection-box-area { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; background: #fff; }
.products-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.products-toolbar .search-box { min-width: 0; }
.search-control { padding: 0.65rem 2.4rem 0.65rem 1rem; }
.select-all { white-space: nowrap; font-weight: 700; }
.product-pick-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 320px; overflow-y: auto; padding: 0.25rem; border: 1px solid #f3f4f6; border-radius: 8px; }
.product-pick-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: 0.2s; background: #fff; }
.product-pick-row:hover { border-color: #660033; background: #f9fafb; }
.product-pick-row.selected { border-color: #660033; background: #f3f4f6; }
.product-pick-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: #660033; flex-shrink: 0; cursor: pointer; }
.product-thumb { width: 42px; height: 42px; border-radius: 8px; background: #f3f4f6; color: #9ca3af; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.product-thumb img { width: 100%; height: 100%; object-fit: cover; }
.product-pick-name { flex: 1; min-width: 0; font-size: 0.82rem; font-weight: 700; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qty-box { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
.qty-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; }
.qty-input { width: 70px; padding: 0.45rem 0.5rem; text-align: center; }
.qty-input:disabled { opacity: 0.5; }
.hint { color: #9ca3af; font-size: 0.8rem; margin: 0.5rem; text-align: center; }

.chk-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #374151; cursor: pointer; padding: 0.25rem 0; }
.chk-item input { width: 16px; height: 16px; accent-color: #660033; }
.mt-2 { margin-top: 0.75rem; }

/* Form Grid */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.mt-1 { margin-top: 1.5rem; margin-bottom: 1.5rem; }

/* Toggle */
.form-section-toggle { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #f9fafb; border-radius: 12px; margin-top: 1.5rem; }
.toggle-lbl { font-size: 0.9rem; font-weight: 700; color: #111827; }
.toggle-switch { cursor: pointer; }
.t-slider { width: 50px; height: 26px; background: #e5e7eb; border-radius: 100px; position: relative; transition: 0.4s; }
.t-knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 3px; right: 3px; transition: 0.4s; }
.t-slider.on { background: #10b981; }
.t-slider.on .t-knob { transform: translateX(-24px); }

/* Footer Btns */
.form-footer-btns { margin-top: 2rem; display: flex; gap: 1rem; }
.btn-cancel-form { flex: 1; padding: 0.85rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; }
.btn-submit-form { flex: 2; padding: 0.85rem; border-radius: 10px; border: none; background: #660033; color: #fff; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-submit-form:hover:not(:disabled) { background: #4d0026; }
.btn-submit-form:disabled { opacity: 0.6; }

/* Modals Shared */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(4px); }
.modal-content { background: #fff; border-radius: 20px; width: 100%; position: relative; box-shadow: 0 25px 70px rgba(0,0,0,0.25); }
.modal-close { position: absolute; top: 1.5rem; left: 1.5rem; background: #f3f4f6; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; }

/* Alerts */

.form-fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.form-fieldset:disabled .form-control { background: #f9fafb; cursor: default; }

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .offer-form { padding: 0 1.25rem 1.5rem; }
  .page-header { align-items: flex-start; flex-direction: column; gap: 1rem; }
}

/* ---- Offers page ---- */
.header-titles { display: flex; align-items: center; gap: 0.9rem; }
.page-header .tag-icon-wrapper { width: 48px; height: 48px; border-radius: 12px; background: #f6e9ef; color: #660033; flex-shrink: 0; }
.page-header .page-title { line-height: 1.3; }
.type-text { font-size: 0.78rem; color: #6b7280; }
.scope-text { font-size: 0.78rem; color: #374151; }

/* Number fields have no up/down arrows */
.no-spin { -moz-appearance: textfield; appearance: textfield; }
.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* Offer type cards */
.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.type-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; border: 2px solid #e5e7eb; border-radius: 12px; background: #fff; cursor: pointer; text-align: right; font-family: inherit; transition: 0.15s; }
.type-card:hover { border-color: rgba(102, 0, 51, 0.35); }
.type-card.active { border-color: #660033; background: #fdf2f8; }
.type-icon { width: 36px; height: 36px; border-radius: 8px; background: #f3f4f6; color: #6b7280; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.type-card.active .type-icon { background: #660033; color: #fff; }
.type-card strong { display: block; font-size: 0.85rem; color: #111827; }
.type-card.active strong { color: #660033; }
.type-card small { display: block; font-size: 0.68rem; color: #9ca3af; margin-top: 2px; }

/* Validation */
.form-control.invalid { border-color: #dc2626; background: #fef2f2; }
.field-error { display: block; margin-top: 0.4rem; color: #dc2626; font-size: 0.76rem; font-weight: 600; text-align: right; }
.picked-count { margin-top: 0.6rem; font-size: 0.75rem; font-weight: 700; color: #6b7280; }

/* Filters + table extras */
.clear-filters { width: 40px; height: 40px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.clear-filters:hover { background: #f3f4f6; color: #111827; }
.pause-btn { background: #ecfdf5; color: #059669; }
.resume-btn { background: #f3f4f6; color: #6b7280; }
.usage-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; line-height: 1.2; }
.usage-cell strong { font-size: 0.95rem; color: #111827; }
.usage-cell small { font-size: 0.7rem; color: #6b7280; white-space: nowrap; }
.usage-cell.muted { color: #9ca3af; }
.usage-box { display: flex; align-items: center; gap: 0.6rem; margin: 0 0 1rem; padding: 0.7rem 0.9rem; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 0.85rem; color: #374151; }
.usage-box strong { color: #111827; }
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: #6b7280; }
.empty-icon { width: 56px; height: 56px; border-radius: 50%; background: #f3f4f6; color: #9ca3af; display: flex; align-items: center; justify-content: center; }
.retry-btn { margin-inline-start: 0.75rem; padding: 0.4rem 0.9rem; border: 1px solid #660033; border-radius: 8px; background: #fff; color: #660033; font-family: inherit; font-weight: 700; cursor: pointer; }

/* Pager */
.pager { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1.25rem; border-top: 1px solid #f3f4f6; background: #fafafa; }
.pager-info { font-size: 0.75rem; color: #6b7280; }
.pager-buttons { display: flex; align-items: center; gap: 0.25rem; }
.pager-btn { min-width: 32px; height: 32px; padding: 0 0.4rem; border: none; border-radius: 6px; background: transparent; color: #6b7280; font-family: inherit; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.pager-btn:hover:not(:disabled) { background: #f3f4f6; }
.pager-btn.active { background: #660033; color: #fff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 640px) {
  .type-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: stretch; gap: 1rem; }
  .pager { flex-direction: column; }
}
</style>
