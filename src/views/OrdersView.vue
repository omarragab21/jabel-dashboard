<template>
  <div class="orders-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-titles">
        <h2 class="page-title">{{ tx('إدارة الطلبات', 'Order Management') }}</h2>
        <p class="page-subtitle">{{ tx('متابعة وإدارة جميع الطلبات', 'Track and manage all orders') }}</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card total-orders">
        <div class="stat-content">
          <span class="stat-value">{{ totalOrders }}</span>
          <span class="stat-label">{{ tx('إجمالي الطلبات', 'Total Orders') }}</span>
        </div>
        <div class="stat-icon-wrapper total-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-content">
          <span class="stat-value">{{ pendingOrders }}</span>
          <span class="stat-label">{{ tx('قيد الانتظار', 'Pending') }}</span>
        </div>
        <div class="stat-icon-wrapper pending-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
      </div>
      <div class="stat-card stat-processing">
        <div class="stat-content">
          <span class="stat-value">{{ processingOrders }}</span>
          <span class="stat-label">{{ tx('قيد المعالجة', 'Processing') }}</span>
        </div>
        <div class="stat-icon-wrapper processing-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
      </div>
      <div class="stat-card stat-delivered">
        <div class="stat-content">
          <span class="stat-value">{{ deliveredOrders }}</span>
          <span class="stat-label">{{ tx('تم التوصيل', 'Delivered') }}</span>
        </div>
        <div class="stat-icon-wrapper success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="tx('بحث برقم الطلب أو اسم العميل...', 'Search by order number or customer name...')" class="search-input" />
      </div>
      <div class="filter-group">
        <div class="date-filter">
          <input type="date" lang="en-GB" v-model="dateFrom" class="form-control" />
          <span class="date-separator">-</span>
          <input type="date" lang="en-GB" v-model="dateTo" class="form-control" />
        </div>
        <div class="filter-select">
          <select v-model="statusFilter" class="form-select">
            <option value="">{{ tx('جميع الحالات', 'All statuses') }}</option>
            <option v-for="status in ORDER_STATUSES" :key="status" :value="status">{{ statusText(status) }}</option>
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="select-icon" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-order-num">{{ tx('رقم الطلب', 'Order number') }}</th>
            <th class="col-customer">{{ tx('العميل', 'Customer') }}</th>
            <th class="col-products">{{ tx('المنتجات', 'Products') }}</th>
            <th class="col-total">{{ tx('المبلغ', 'Amount') }}</th>
            <th class="col-status">{{ tx('الحالة', 'Status') }}</th>
            <th class="col-date">{{ tx('التاريخ', 'Date') }}</th>
            <th class="col-actions">{{ tx('الإجراءات', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="state-row"><td colspan="7">{{ tx('جاري التحميل...', 'Loading...') }}</td></tr>
          <tr v-else-if="filteredOrders.length === 0" class="state-row"><td colspan="7">{{ tx('لا توجد طلبات مطابقة', 'No matching orders found') }}</td></tr>
          <template v-else>
            <tr v-for="order in filteredOrders" :key="order.id" class="data-row" :data-order="order.orderNumber" :data-status="order.status">
              <td class="col-order-num">
                <span class="order-number" dir="ltr">#{{ order.orderNumber }}</span>
                <i v-if="order.isGift" class="fas fa-gift gift-badge-icon" title="طلب هدية"></i>
              </td>
              <td class="col-customer">
                <div class="customer-cell">
                  <span class="font-bold">{{ order.customerName || tx('عميل محذوف', 'Deleted customer') }}</span>
                </div>
              </td>
              <td class="col-products">
                <div class="products-cell">
                  <div class="products-imgs-group" v-if="order.products?.length">
                    <!-- Display up to 3 products -->
                    <div class="product-img-circle" v-for="(prod, idx) in order.products.slice(0, 3)" :key="idx" :style="{ zIndex: 10 - idx }">
                      <img v-if="prod.image" :src="prod.image" />
                      <div v-else class="img-placeholder"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg></div>
                    </div>
                    <!-- If more than 3, show +X -->
                    <div v-if="order.products.length > 3" class="more-images-circle" :style="{ zIndex: 0 }">
                      +{{ order.products.length - 3 }}
                    </div>
                  </div>
                <span class="products-count">{{ order.products?.length || 0 }} {{ tx('منتج', 'products') }}</span>
                </div>
              </td>
              <td class="col-total">
                <span class="total-amount">{{ formatPrice(order.total) }} {{ cur }}</span>
              </td>
              <td class="col-status">
                <span class="status-badge" :class="order.status">
                  {{ statusText(order.status) }}
                </span>
              </td>
              <td class="col-date">
                <span class="date-text">{{ order.date }}</span>
              </td>
              <td class="col-actions">
                <div class="actions-group">
                  <button class="action-btn delete-btn" @click="confirmDelete(order)" :title="tx('حذف', 'Delete')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                  <button class="action-btn view-btn" @click="openViewModal(order)" :title="tx('عرض التفاصيل', 'View details')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- View Modal Details -->
    <div class="modal-overlay" v-if="showViewModal" @click.self="showViewModal = false;">
      <div class="modal-content view-content-large">
        <div class="view-header-bar">
          <div class="right-col">
            <h3 class="view-title">{{ tx('تفاصيل الطلب', 'Order details') }} #{{ viewOrder?.orderNumber }}</h3>
            <span class="view-time">{{ viewOrder?.date }} - {{ viewOrder?.time }}</span>
            <span class="status-badge" :class="viewOrder?.status">{{ trackingStatusText(viewOrder?.status) }}</span>
          </div>
          <div class="left-col">
            <button v-if="allowedStatuses.length" class="btn-outline" data-testid="update-status" @click="openStatusModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-2.36"/></svg>
              {{ tx('تحديث الحالة', 'Update status') }}
            </button>
            <button class="modal-close" @click="showViewModal = false;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="view-body-wrapper">
          <!-- Stepper -->
          <div class="order-stepper">
            <template v-for="(step, index) in ORDER_TRACKING_STEPS" :key="step.key">
              <div
                class="step"
                :class="getTrackingStepState(step.rank)"
                :data-tracking-step="step.key"
              >
                <div class="step-icon">
                  <i
                    :class="getTrackingStepIcon(step, getTrackingStepState(step.rank))"
                    :aria-label="step.label"
                  ></i>
                </div>
                <span>{{ trackingStepText(step) }}</span>
                <small class="step-time">{{ getTrackingStepTime(step.rank) }}</small>
              </div>
              <div
                v-if="index < ORDER_TRACKING_STEPS.length - 1"
                class="step-line"
                :class="getTrackingLineClass(step.rank + 1)"
              ></div>
            </template>
          </div>

          <div class="order-layout">
            <!-- Right side (Products & Customer) -->
            <div class="content-main">
              <div class="card-section">
                <h4 class="section-heading">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  {{ tx('منتجات الطلب', 'Order products') }}
                </h4>
                <table class="products-table">
                  <thead>
                    <tr>
                      <th class="text-right">{{ tx('المنتج', 'Product') }}</th>
                      <th>{{ tx('الكمية', 'Quantity') }}</th>
                      <th>{{ tx('الإجمالي', 'Total') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prod in viewOrder?.products" :key="prod.id">
                      <td>
                        <div class="p-info">
                          <img v-if="prod.image" :src="prod.image" :alt="prod.name" />
                          <div v-else class="img-placeholder"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg></div>
                          <div class="p-texts">
                            <span class="p-name">{{ prod.name }}</span>
                            <div v-for="(choice, choiceIndex) in prod.choices" :key="choiceIndex" class="p-attrs-v2">
                              <span v-if="prod.choices.length > 1" class="choice-qty" dir="ltr">×{{ choice.quantity }}</span>
                              <span v-for="option in choice.options" :key="option.id" class="attr-tag-v2">
                                <span v-if="option.hex" class="attr-swatch" :style="{ backgroundColor: option.hex }"></span>
                                {{ option.group }}: <strong>{{ option.name }}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="text-center font-bold">{{ prod.quantity }}</td>
                      <td class="text-center">{{ formatPrice(prod.price * prod.quantity) }} {{ cur }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="card-section">
                <h4 class="section-heading">{{ tx('معلومات العميل', 'Customer information') }}</h4>
                <div class="customer-info-grid">
                  <div class="info-item">
                    <span class="info-label">{{ tx('الاسم', 'Name') }}</span>
                    <span class="info-val font-bold">{{ viewOrder?.customerName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">{{ tx('الهاتف', 'Phone') }}</span>
                    <span class="info-val ltr flex-end" style="direction:ltr; text-align:right; width: 100%">{{ viewOrder?.customerPhone || tx('لا يوجد', 'Not available') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">{{ tx('البريد الإلكتروني', 'Email') }}</span>
                    <span class="info-val">{{ viewOrder?.customerEmail || tx('لا يوجد', 'Not available') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">{{ tx('العنوان', 'Address') }}</span>
                    <span class="info-val">{{ viewOrder?.customerAddress || tx('لا يوجد', 'Not available') }}</span>
                  </div>
                  <div class="info-item" v-if="viewOrder?.notes">
                    <span class="info-label">{{ tx('ملاحظات العميل', 'Customer notes') }}</span>
                    <span class="info-val">{{ viewOrder.notes }}</span>
                  </div>
                </div>
              </div>

              <div class="card-section cancel-reason-card" v-if="viewOrder?.status === 'cancelled'" data-testid="cancel-reason-card">
                <h4 class="section-heading">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ tx('سبب الإلغاء', 'Cancellation reason') }}
                </h4>
                <p class="cancel-reason-text" data-testid="cancel-reason-text">{{ viewOrder.cancellationReason || tx('لم يُسجَّل سبب لهذا الطلب', 'No reason was recorded for this order') }}</p>
              </div>

              <div class="card-section" v-if="viewOrder?.activityLog && viewOrder.activityLog.length">
                <h4 class="section-heading">{{ tx('سجل النشاط', 'Activity log') }}</h4>
                <div class="activity-timeline">
                  <div class="timeline-item" v-for="(log, idx) in viewOrder.activityLog" :key="idx">
                    <div class="ti-date">{{ log.date }}<br>{{ log.time }}</div>
                    <div class="ti-bullet"></div>
                    <div class="ti-content">
                      <p class="ti-msg">{{ log.message }}</p>
                      <span class="ti-status" :class="log.status" v-if="log.status">{{ statusText(log.status) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Left side (Summary) -->
            <div class="content-side">
              <div class="card-section">
                <h4 class="section-heading">{{ tx('ملخص الطلب', 'Order summary') }}</h4>
                <div class="summary-rows">
                  <div class="s-row">
                    <span>{{ tx('المجموع الفرعي', 'Subtotal') }}</span>
                    <span>{{ formatPrice(viewOrder?.subtotal) }} {{ cur }}</span>
                  </div>
                  <div class="s-row">
                    <span>{{ tx('الشحن', 'Shipping') }}</span>
                    <span>{{ formatPrice(viewOrder?.shipping) }} {{ cur }}</span>
                  </div>
                  <div class="s-row" v-if="viewOrder?.discount > 0">
                    <span>{{ tx('الخصم', 'Discount') }}</span>
                    <span class="green-text">-{{ formatPrice(viewOrder?.discount) }} {{ cur }}<template v-if="viewOrder?.couponCode"> ({{ viewOrder.couponCode }})</template></span>
                  </div>
                  <div class="s-row">
                    <span>{{ tx('الضريبة', 'Tax') }}</span>
                    <span>{{ formatPrice(viewOrder?.tax) }} {{ cur }}</span>
                  </div>
                  <div class="s-row total">
                    <span>{{ tx('الإجمالي', 'Total') }}</span>
                    <span>{{ formatPrice(viewOrder?.total) }} {{ cur }}</span>
                  </div>
                  <div class="s-row flex-start mt-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span class="text-gray">{{ paymentMethodText(viewOrder?.paymentMethod) }}</span>
                    <span class="payment-badge" :class="viewOrder?.paymentStatus">{{ paymentStatusText(viewOrder?.paymentStatus) }}</span>
                  </div>
                </div>
              </div>

              <!-- Gift Info Section in Details -->
              <div class="card-section gift-admin-section" v-if="viewOrder?.isGift">
                <h4 class="section-heading">
                  <i class="fas fa-gift"></i>
                  {{ tx('طلب هدية', 'Gift order') }}
                </h4>
                <div class="gift-msg-admin">
                  <span class="info-label">{{ tx('رسالة الإهداء:', 'Gift message:') }}</span>
                  <p class="gift-text-admin">{{ viewOrder?.giftMessage || tx('بدون رسالة', 'No message') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div class="modal-overlay" v-if="showStatusModal" @click.self="showStatusModal = false;">
      <div class="modal-content status-content">
        <button class="modal-close" @click="showStatusModal = false;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="status-header">
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-2.36"/></svg>
          </div>
          <h3 class="modal-title">{{ tx('تحديث حالة الطلب', 'Update Order Status') }}</h3>
          <p class="modal-subtitle">{{ tx('اختر الحالة الجديدة للطلب رقم', 'Choose the new status for order') }} #{{ viewOrder?.orderNumber }}</p>
        </div>

        <form @submit.prevent="requestStatusUpdate" class="status-form">
          <div class="form-group">
            <label class="form-label">{{ tx('الحالة الحالية:', 'Current status:') }} <span class="status-badge" :class="viewOrder?.status">{{ trackingStatusText(viewOrder?.status) }}</span></label>
          </div>
          <div class="form-group">
            <label class="form-label">{{ tx('الحالة الجديدة', 'New status') }} <span class="req">*</span></label>
            <div class="select-wrapper">
              <select v-model="statusForm.status" class="form-control" data-testid="status-select" required>
                <option v-for="status in allowedStatuses" :key="status" :value="status">{{ trackingStatusText(status) }}</option>
              </select>
              <svg class="select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div v-if="statusForm.status === 'cancelled'" class="form-group cancel-reason-group">
            <label class="form-label" for="status-cancel-reason">{{ tx('سبب الإلغاء', 'Cancellation reason') }} <span class="req">*</span></label>
            <textarea
              id="status-cancel-reason"
              v-model="cancelReason"
              class="form-control cancel-reason-input"
              :class="{ invalid: cancelReasonError }"
              rows="3"
              :maxlength="CANCEL_REASON_MAX"
              :placeholder="tx('اكتب سبب إلغاء الطلب (مثلًا: مشكلة في التوصيل)...', 'Write why the order is being cancelled (e.g. a delivery problem)...')"
              data-testid="status-cancel-reason"
              @input="cancelReasonTouched = true"
            ></textarea>
            <div class="cancel-reason-meta">
              <span v-if="cancelReasonError" class="field-error" data-testid="status-cancel-reason-error">{{ cancelReasonError }}</span>
              <span class="char-count" dir="ltr">{{ cancelReason.length }}/{{ CANCEL_REASON_MAX }}</span>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="showStatusModal = false;">{{ tx('إلغاء', 'Cancel') }}</button>
            <button type="submit" class="btn-submit" data-testid="continue-status" :disabled="isSubmittingStatus">
              {{ tx('متابعة للتأكيد', 'Continue to confirm') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Separate confirmation for entering delivery and confirming receipt. -->
    <div class="modal-overlay" v-if="showStatusConfirm" @click.self="cancelStatusConfirmation">
      <div class="modal-content status-content status-confirm-content" :class="`tone-${confirmTone}`" role="dialog" aria-modal="true" aria-labelledby="status-confirm-title">
        <button class="modal-close" @click="cancelStatusConfirmation" :aria-label="tx('إغلاق', 'Close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="status-header">
          <div class="icon-circle status-confirm-icon">
            <svg v-if="pendingStatus === 'delivered'" data-testid="confirm-icon-delivered" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <svg v-else-if="pendingStatus === 'cancelled'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17h3l2-8h8l2 8h3"/><path d="M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0"/><path d="M10 9V6h4l2 3"/></svg>
          </div>
          <h3 id="status-confirm-title" class="modal-title">{{ statusConfirmationTitle }}</h3>
          <p class="modal-subtitle">{{ statusConfirmationMessage }}</p>
        </div>
        <div class="status-transition-summary">
          <span>{{ trackingStatusText(viewOrder?.status) }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
          <strong>{{ trackingStatusText(pendingStatus) }}</strong>
        </div>
        <div v-if="pendingStatus === 'cancelled'" class="form-group cancel-reason-group">
          <label class="form-label" for="cancel-reason">{{ tx('سبب الإلغاء', 'Cancellation reason') }} <span class="req">*</span></label>
          <textarea
            id="cancel-reason"
            v-model="cancelReason"
            class="form-control cancel-reason-input"
            :class="{ invalid: cancelReasonError }"
            rows="3"
            :maxlength="CANCEL_REASON_MAX"
            :placeholder="tx('اكتب سبب إلغاء الطلب...', 'Write why the order is being cancelled...')"
            data-testid="cancel-reason"
            @input="cancelReasonTouched = true"
          ></textarea>
          <div class="cancel-reason-meta">
            <span v-if="cancelReasonError" class="field-error" data-testid="cancel-reason-error">{{ cancelReasonError }}</span>
            <span class="char-count" dir="ltr">{{ cancelReason.length }}/{{ CANCEL_REASON_MAX }}</span>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="cancelStatusConfirmation">{{ tx('رجوع', 'Back') }}</button>
          <button type="button" class="btn-submit" :class="`btn-${confirmTone}`" :disabled="isSubmittingStatus" data-testid="confirm-status" @click="confirmStatusUpdate">
            {{ isSubmittingStatus ? tx('جاري التحديث...', 'Updating...') : pendingStatus === 'cancelled' ? tx('تأكيد الإلغاء', 'Confirm cancellation') : tx('تأكيد التحديث', 'Confirm update') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Alert Message -->
    <div class="alert-toast" data-testid="toast" :class="[alertType, { show: showAlert }]">
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import adminOrderService from '../application/adminOrderService';
import {
  ORDER_STATUSES,
  ORDER_TRACKING_STEPS,
  CANCEL_REASON_MAX,
  CANCEL_REASON_MIN,
  cleanCancelReason,
  nextStatuses,
  paymentMethodLabel,
  paymentStatusLabel,
  statusLabel,
  trackingRank,
  trackingStepIcon,
  trackingStepState,
} from '../domain/orders/adminOrder';

const { tx, locale } = useAdminText();
const { cur } = useCurrencyLabel();

const orders = ref([]);
const loading = ref(false);

// A link from another page (e.g. a customer's order history) can open the list filtered: ?search=ORD-…
const searchQuery = ref(String(useRoute().query.search || ''));
const statusFilter = ref('');
const dateFrom = ref('');
const dateTo = ref('');

const showViewModal = ref(false);
const showStatusModal = ref(false);
const showStatusConfirm = ref(false);
const viewOrder = ref(null);

const isSubmittingStatus = ref(false);
const statusForm = ref({ status: '' });
const pendingStatus = ref('');
const cancelReason = ref('');
const cancelReasonTouched = ref(false);
const confirmTone = computed(() => ({ delivered: 'success', cancelled: 'danger' })[pendingStatus.value] || 'warn');
// The reason is written as soon as "cancelled" is chosen, then shown again in the confirmation step.
const reasonStatus = computed(() => (showStatusModal.value ? statusForm.value.status : pendingStatus.value));
const cancelReasonError = computed(() => {
  if (reasonStatus.value !== 'cancelled' || !cancelReasonTouched.value) return '';
  return cleanCancelReason(cancelReason.value).length < CANCEL_REASON_MIN
    ? tx('اكتب سبب الإلغاء (٣ أحرف على الأقل)', 'Write the cancellation reason (at least 3 characters)')
    : '';
});

const statusText = (status) => {
  const english = {
    pending: 'Order received', processing: 'Order prepared', confirmed: 'Order confirmed', paid_confirmed: 'Order confirmed', shipped: 'Shipped',
    in_transit: 'On the way', delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled', returned: 'Returned',
    refunded: 'Refunded', pending_review: 'Pending review', approved: 'Approved', rejected: 'Rejected',
  };
  return tx(statusLabel(status), english[status] || statusLabel(status));
};
const trackingStatusText = (status) => statusText(status);
const paymentMethodText = (method) => {
  const english = {
    cash_on_delivery: 'Cash on delivery', cash: 'Cash on delivery', card: 'Card', wallet: 'Wallet',
  };
  return tx(paymentMethodLabel(method), english[method] || paymentMethodLabel(method));
};
const paymentStatusText = (status) => {
  const english = {
    pending: 'Pending', paid: 'Paid', paid_confirmed: 'Payment Confirmed', refunded: 'Refunded', failed: 'Failed',
  };
  return tx(paymentStatusLabel(status), english[status] || paymentStatusLabel(status));
};
const trackingStepText = (step) => {
  const labels = {
    pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped',
    delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled',
  };
  return tx(step?.label || '', labels[step?.key] || step?.label || '');
};
const allowedStatuses = computed(() => nextStatuses(viewOrder.value?.status));
const statusConfirmationTitle = computed(() => {
  if (pendingStatus.value === 'shipped') return tx('تأكيد شحن الطلب', 'Confirm order shipped');
  if (pendingStatus.value === 'in_transit') return tx('تأكيد أن الطلب في الطريق', 'Confirm order on the way');
  if (pendingStatus.value === 'delivered') return tx('تأكيد استلام العميل', 'Confirm customer receipt');
  if (pendingStatus.value === 'cancelled') return tx('تأكيد إلغاء الطلب', 'Confirm order cancellation');
  return tx('تأكيد تحديث حالة الطلب', 'Confirm order status update');
});
const statusConfirmationMessage = computed(() => {
  if (pendingStatus.value === 'shipped') return tx('سيتم تسجيل أن الطلب تم شحنه. خطوة "الطلب في الطريق" بعدها منفصلة.', 'The order will be marked shipped. "On the way" is a separate next step.');
  if (pendingStatus.value === 'in_transit') return tx('سيصبح الطلب في الطريق فقط. لن يتم اعتباره مستلماً حتى تؤكد خطوة منفصلة.', 'The order will be on the way and will not be marked received until a separate confirmation.');
  if (pendingStatus.value === 'delivered') return tx('أكد فقط بعد التحقق من أن العميل استلم الطلب فعلاً.', 'Confirm only after verifying that the customer received the order.');
  if (pendingStatus.value === 'cancelled') return tx('اكتب سبب الإلغاء، وسيظهر في تفاصيل الطلب. لا يمكن التراجع بعد الإلغاء.', 'Write the reason; it will show in the order details. A cancelled order cannot be reopened.');
  return tx('راجع الحالة الجديدة قبل إرسالها إلى النظام.', 'Review the new status before sending it to the system.');
});

// Stats
const totalOrders = computed(() => orders.value.length);
const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending').length);
const processingOrders = computed(() => orders.value.filter(o => o.status === 'processing').length);
const deliveredOrders = computed(() => orders.value.filter(o => o.status === 'delivered').length);

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchQ = (o.orderNumber?.includes(searchQuery.value) || o.customerName?.includes(searchQuery.value));
    const matchS = statusFilter.value ? o.status === statusFilter.value : true;
    let matchD = true;
    if (dateFrom.value && o.date) {
      matchD = matchD && o.date >= dateFrom.value;
    }
    if (dateTo.value && o.date) {
      matchD = matchD && o.date <= dateTo.value;
    }
    return matchQ && matchS && matchD;
  });
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

const formatPrice = (p) => Number(p || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fetchOrders = async () => {
  loading.value = true;
  try {
    orders.value = await adminOrderService.listOrders();
  } catch (err) {
    triggerAlert('فشل استيراد الطلبات', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});

const openViewModal = async (order) => {
  viewOrder.value = order;
  showViewModal.value = true;
  // The orders list leaves products' options empty; only the single-order
  // endpoint lists them, and they are needed to name the chosen color/size…
  if (!order.hasChosenOptions) return;
  try {
    const full = await adminOrderService.getOrder(order.id);
    if (viewOrder.value?.id === order.id) viewOrder.value = { ...order, products: full.products };
  } catch {
    // The products still show, without their chosen options.
  }
};

const openStatusModal = () => {
  statusForm.value = { status: allowedStatuses.value[0] || '' };
  cancelReason.value = '';
  cancelReasonTouched.value = false;
  showStatusModal.value = true;
};

// Status updates follow the API lifecycle; the visual stepper follows the
// same six-stage timeline and rank rules as the customer website.
const getTrackingStepState = (step) => trackingStepState(viewOrder.value, step);
const getTrackingStepIcon = (step, state) => trackingStepIcon(step, state);
const getTrackingLineClass = (step) => getTrackingStepState(step) === 'pending' ? '' : 'completed';
const getTrackingStepTime = (step) => {
  const definition = ORDER_TRACKING_STEPS.find((item) => item.rank === step);
  if (!definition || getTrackingStepState(step) === 'pending') return 'لم تبدأ بعد';

  const rawDate = viewOrder.value?.[definition.dateField]
    || (step === 1 ? viewOrder.value?.createdAt || viewOrder.value?.date : null)
    || (trackingRank(viewOrder.value) >= step ? viewOrder.value?.updatedAt : null);
  if (!rawDate) return viewOrder.value?.date || '—';

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime())
    ? rawDate
    : date.toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
};

const requestStatusUpdate = () => {
  if (!statusForm.value.status) return;
  if (statusForm.value.status === 'cancelled' && cleanCancelReason(cancelReason.value).length < CANCEL_REASON_MIN) {
    cancelReasonTouched.value = true;
    return;
  }
  pendingStatus.value = statusForm.value.status;
  if (pendingStatus.value !== 'cancelled') cancelReason.value = '';
  showStatusModal.value = false;
  showStatusConfirm.value = true;
};

const cancelStatusConfirmation = () => {
  showStatusConfirm.value = false;
  pendingStatus.value = '';
  cancelReason.value = '';
  cancelReasonTouched.value = false;
};

const confirmStatusUpdate = async () => {
  const nextStatus = pendingStatus.value;
  if (!nextStatus) return;
  if (nextStatus === 'cancelled' && cleanCancelReason(cancelReason.value).length < CANCEL_REASON_MIN) {
    cancelReasonTouched.value = true;
    return;
  }
  isSubmittingStatus.value = true;
  try {
    const updated = await adminOrderService.updateStatus(viewOrder.value, nextStatus, cancelReason.value);
    triggerAlert(nextStatus === 'cancelled' ? 'تم إلغاء الطلب وحفظ السبب' : 'تم تحديث حالة الطلب بنجاح');
    showStatusConfirm.value = false;
    pendingStatus.value = '';
    cancelReason.value = '';
    viewOrder.value = updated; // update local view
    // Update in array
    const idx = orders.value.findIndex(o => o.id === updated.id);
    if (idx !== -1) orders.value[idx] = updated;
    window.dispatchEvent(new CustomEvent('orders-updated'));
  } catch (err) {
    // Until the backend adds `in_transit` to its status enum it answers 422.
    if (nextStatus === 'in_transit' && err.response?.status === 422) {
      triggerAlert('الخادم لا يدعم حالة "الطلب في الطريق" بعد (in_transit). يلزم إضافتها في الباك اند.', 'error');
    } else {
      triggerAlert(apiErrorMessage(err, 'فشل التحديث'), 'error');
    }
  } finally {
    isSubmittingStatus.value = false;
  }
};

const confirmDelete = async (order) => {
  if (confirm(`تأكيد حذف الطلب #${order.orderNumber}؟ لا يمكن التراجع.`)) {
    try {
      await adminOrderService.deleteOrder(order.id);
      triggerAlert('تم الحذف بنجاح');
      fetchOrders();
      window.dispatchEvent(new CustomEvent('orders-updated'));
    } catch (err) {
      triggerAlert(apiErrorMessage(err, 'فشل عملية الحذف'), 'error');
    }
  }
};

</script>

<style scoped>
.orders-page {
  display: flex; flex-direction: column; gap: 1.5rem; direction: inherit; font-family: 'IBM Plex Sans Arabic', sans-serif; padding-bottom: 2rem;
}

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin-bottom: 0.2rem; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; }

/* Stats Cards */
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.stat-content { display: flex; flex-direction: column; align-items: flex-start; }
.stat-value { font-size: 1.6rem; font-weight: 800; color: #111827; margin-bottom: 0.2rem; line-height: 1.2; }
.stat-label { font-size: 0.8rem; font-weight: 700; color: #6b7280; }
.stat-icon-wrapper { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.total-icon { background: #f3f4f6; color: #660033; }
.pending-icon { background: #fffbeb; color: #d97706; }
.processing-icon { background: #eff6ff; color: #3b82f6; }
.success-icon { background: #ecfdf5; color: #059669; }

/* Filters */
.filters-row { display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;}
.search-box { flex: 1; min-width: 250px; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 0.7rem 2.8rem 0.7rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; outline: none; background: #fff; transition: border-color 0.2s; }
.search-input:focus { border-color: #660033; }

.filter-group { display: flex; gap: 0.8rem; align-items: center; }
.date-filter { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.3rem 0.5rem; }
.date-filter .form-control { border: none; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.8rem; color: #374151; outline: none; padding: 0.3rem; background: transparent; cursor: pointer; }
.date-separator { color: #9ca3af; font-weight: bold; }
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
.col-order-num { text-align: right; width: 12%; }
.col-customer { text-align: right; width: 22%; }
.col-products { text-align: right; width: 18%; }
.col-total { text-align: center; width: 13%; }
.col-status { text-align: center; width: 12%; }
.col-date { text-align: center; width: 13%; }
.col-actions { text-align: left; width: 10%; padding-left: 1.5rem !important; }

.data-table th.col-actions, .data-table th.col-status, .data-table th.col-total, .data-table th.col-date { text-align: center; }
.data-table th.col-actions { text-align: left; padding-left: 1.5rem !important; }

.order-number { display: inline-block; direction: ltr; white-space: nowrap; font-weight: 800; color: #660033; font-size: 0.85rem; background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 6px; }
.gift-badge-icon { color: #660033; margin-right: 8px; font-size: 14px; animation: gift-bounce 2s infinite; }
@keyframes gift-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.customer-cell { display: flex; align-items: center; gap: 0.8rem; }
.font-bold { font-weight: 700; color: #111827; }
.products-cell { display: flex; align-items: center; gap: 0.8rem; }
.products-imgs-group { display: flex; align-items: center; }
.product-img-circle { width: 34px; height: 34px; border-radius: 6px; overflow: hidden; border: 2px solid #fff; background: #f3f4f6; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.product-img-circle img { width: 100%; height: 100%; object-fit: cover; }
.more-images-circle { width: 34px; height: 34px; border-radius: 6px; border: 2px solid #fff; background: #f3f4f6; color: #660033; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.products-imgs-group > div:not(:last-child) { margin-left: -12px; }
.img-placeholder { color: #9ca3af; }
.products-count { font-weight: 600; color: #4b5563; font-size: 0.8rem; }
.total-amount { font-weight: 800; color: #111827; }
.date-text { color: #6b7280; font-size: 0.8rem; font-weight: 600; }

.status-badge { display: inline-block; padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.status-badge.pending { background: #fffbeb; color: #d97706; }
.status-badge.paid_confirmed { background: #f0fdf4; color: #15803d; }
.status-badge.processing { background: #eff6ff; color: #3b82f6; }
.status-badge.shipped { background: #f3f4f6; color: #660033; }
.status-badge.in_transit { background: #fdf2f8; color: #9d174d; }
.status-badge.delivered { background: #ecfdf5; color: #059669; }
.status-badge.cancelled { background: #fef2f2; color: #dc2626; }

.actions-group { display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem; }
.action-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.2s; }
.action-btn:hover { background: #f3f4f6; }
.delete-btn:hover { color: #dc2626; background: #fef2f2; }
.view-btn:hover { color: #660033; background: #f3f4f6; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; overflow-y: auto; }
.modal-content { background: #f9fafb; border-radius: 12px; width: 100%; position: relative; margin: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.view-content-large { max-width: 1200px; padding: 0; overflow: hidden; }

/* Large View Header */
.view-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; background: #fff; border-bottom: 1px solid #f3f4f6; }
.right-col { display: flex; align-items: center; gap: 1rem; }
.view-title { font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0; }
.view-time { font-size: 0.85rem; color: #6b7280; font-weight: 600; }
.left-col { display: flex; align-items: center; gap: 1rem; }
.btn-outline { background: #fff; border: 1px solid #e5e7eb; color: #374151; padding: 0.5rem 1rem; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
.btn-outline:hover { background: #f9fafb; border-color: #d1d5db; }
.modal-close { background: #f3f4f6; border: none; color: #6b7280; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.modal-close:hover { background: #e5e7eb; color: #111827; }

/* Stepper */
.view-body-wrapper { padding: 2rem; }
.order-stepper { display: flex; align-items: flex-start; justify-content: space-between; background: #fff; padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 1.5rem; min-height: 139px; }
.step { display: flex; flex: 1; min-width: 0; flex-direction: column; align-items: center; gap: 0.5rem; z-index: 2; position: relative; text-align: center; }
.step-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: transparent; border: 2px solid #e2e8f0; color: #cbd5e1; font-weight: bold; transition: all 0.3s; }
.step-icon i { font-size: 14px; line-height: 1; }
.step span { font-size: 0.8rem; font-weight: 400; color: #660033; line-height: 1.5; transition: color 0.3s; }
.step-time { min-height: 18px; font-size: 0.72rem; font-weight: 400; color: #64748b; line-height: 1.5; }
.step.pending span { color: #64748b; }
.step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 1rem 1rem 0; transition: background 0.3s; }
/* active / completed */
.step.completed .step-icon { background: #10b981; border-color: #10b981; color: #fff; }
.step.completed span { color: #660033; }
.step-line.completed { background: #10b981; }
.step.active .step-icon { width: 40px; height: 40px; margin-top: -4px; background: #f59e1f; border-color: #f59e1f; color: #fff; box-shadow: 0 0 8px rgba(255, 150, 79, 0.25); }
.step.active .step-icon i { font-size: 16px; }
.step.active[data-tracking-step="delivered"] .step-icon { background: #10b981; border-color: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.3); }
.step.active span { color: #660033; }

/* Grid layout for details */
.order-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start; }
.content-main { display: flex; flex-direction: column; gap: 1.5rem; }
.content-side { display: flex; flex-direction: column; gap: 1.5rem; }

.card-section { background: #fff; border-radius: 12px; border: 1px solid #f3f4f6; padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.01); }
.section-heading { font-size: 0.95rem; font-weight: 800; color: #111827; margin: 0 0 1.25rem 0; display: flex; align-items: center; gap: 0.5rem; }
.section-heading svg { color: #660033; }

/* Table inside modal */
.products-table { width: 100%; border-collapse: collapse; }
.products-table th { text-align: right; font-size: 0.8rem; color: #6b7280; font-weight: 700; padding-bottom: 1rem; border-bottom: 1px solid #f3f4f6; }
.products-table td { padding: 1rem 0; border-bottom: 1px solid #f9fafb; font-size: 0.85rem; color: #374151; vertical-align: middle; }
.products-table tr:last-child td { border-bottom: none; }
.p-info { display: flex; align-items: center; gap: 0.8rem; }
.p-info img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb; }
.p-texts { display: flex; flex-direction: column; gap: 2px; }
.p-name { font-weight: 700; color: #111827; }
.p-attrs-v2 { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; }
.attr-tag-v2 { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; background: #fdf2f7; color: #4b5563; padding: 3px 9px; border-radius: 999px; font-weight: 500; border: 1px solid #f3d6e4; }
.attr-tag-v2 strong { color: #660033; font-weight: 700; }
.attr-swatch { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15); }
.choice-qty { font-size: 11px; font-weight: 800; color: #6b7280; }
.text-center { text-align: center !important; }
.text-right { text-align: right !important; }

/* Info Grid */
.customer-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.info-item { display: flex; flex-direction: column; gap: 0.3rem; }
.info-label { font-size: 0.75rem; font-weight: 700; color: #9ca3af; }
.info-val { font-size: 0.85rem; font-weight: 600; color: #374151; }
.flex-end { align-self: flex-end; }
.ltr { direction: ltr; }

/* Timeline */
.activity-timeline { display: flex; flex-direction: column; padding-top: 0.5rem; }
.timeline-item { display: flex; gap: 1.5rem; position: relative; padding-bottom: 1.5rem; }
.timeline-item:last-child { padding-bottom: 0; }
.ti-date { font-size: 0.75rem; color: #9ca3af; font-weight: 600; line-height: 1.4; width: 60px; text-align: left; }
.ti-bullet { width: 12px; height: 12px; background: #e5e7eb; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #e5e7eb; position: relative; margin-top: 4px; z-index: 2;}
.timeline-item:not(:last-child)::before { content: ''; position: absolute; right: 88px; top: 16px; bottom: 0; width: 1px; background: #e5e7eb; }
.ti-content { flex: 1; margin-top: 2px; }
.ti-msg { margin: 0; font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 0.4rem;  }
.ti-status { font-size: 0.7rem; padding: 0.1rem 0.5rem; border-radius: 4px; display: inline-block; }

/* Summary */
.summary-rows { display: flex; flex-direction: column; gap: 1rem; }
.s-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; color: #4b5563; border-bottom: 1px dashed #f3f4f6; padding-bottom: 0.5rem; }
.s-row:last-child { border-bottom: none; padding-bottom: 0; }
.s-row.total { font-size: 1.1rem; font-weight: 800; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 1rem; border-bottom: none; }
.green-text { color: #059669; }
.text-gray { color: #6b7280; font-size: 0.8rem; }
.payment-badge { margin-inline-start: auto; padding: 0.15rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: #fffbeb; color: #d97706; }
.payment-badge.paid { background: #ecfdf5; color: #059669; }
.payment-badge.refunded { background: #f3f4f6; color: #374151; }
.flex-start { justify-content: flex-start; gap: 0.5rem; border: none; padding: 0; margin-top: 0.5rem; }

/* Shipping Block */
.shipping-info { display: flex; flex-direction: column; gap: 1.25rem; }
.shi-row { display: flex; align-items: flex-start; gap: 0.8rem; }
.shi-row div { display: flex; flex-direction: column; }
.shi-label { font-size: 0.75rem; font-weight: 700; color: #9ca3af; margin-bottom: 0.2rem; }
.shi-val { font-size: 0.85rem; font-weight: 800; color: #1f2937; }

/* Status Modal */
.status-content { max-width: 450px; padding: 2rem; background: #fff; }
.status-confirm-content { max-width: 480px; }
.status-confirm-icon { background: #fff7ed; color: #ea580c; }
.status-transition-summary { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.9rem 1rem; margin: 0.25rem 0 1.25rem; border: 1px solid #fed7aa; border-radius: 10px; background: #fff7ed; color: #7c2d12; font-size: 0.85rem; font-weight: 700; }
.status-transition-summary strong { color: #c2410c; }
.tone-success .status-confirm-icon { background: #ecfdf5; color: #059669; }
.tone-success .status-transition-summary { border-color: #a7f3d0; background: #ecfdf5; color: #064e3b; }
.tone-success .status-transition-summary strong { color: #047857; }
.tone-danger .status-confirm-icon { background: #fef2f2; color: #dc2626; }
.tone-danger .status-transition-summary { border-color: #fecaca; background: #fef2f2; color: #7f1d1d; }
.tone-danger .status-transition-summary strong { color: #b91c1c; }
.btn-submit.btn-success { background: #059669; }
.btn-submit.btn-success:hover:not(:disabled) { background: #047857; }
.btn-submit.btn-danger { background: #dc2626; }
.btn-submit.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.cancel-reason-group { margin-bottom: 1.25rem; text-align: right; }
.cancel-reason-input { width: 100%; resize: vertical; min-height: 84px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; padding: 0.7rem 0.9rem; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; box-sizing: border-box; }
.cancel-reason-input:focus { border-color: #dc2626; }
.cancel-reason-input.invalid { border-color: #dc2626; background: #fef2f2; }
.cancel-reason-meta { display: flex; justify-content: space-between; gap: 0.5rem; margin-top: 0.3rem; font-size: 0.72rem; }
.field-error { color: #dc2626; font-weight: 700; }
.char-count { color: #9ca3af; margin-inline-start: auto; }
.cancel-reason-card { border-color: #fecaca; background: #fff8f8; }
.cancel-reason-card .section-heading { color: #b91c1c; }
.cancel-reason-text { margin: 0; font-size: 0.9rem; line-height: 1.8; color: #7f1d1d; white-space: pre-wrap; word-break: break-word; }
.status-header { text-align: center; margin-bottom: 1.5rem; }
.icon-circle { width: 50px; height: 50px; background: #f3f4f6; color: #660033; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.modal-title { font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0 0 0.5rem 0; }
.modal-subtitle { font-size: 0.85rem; font-weight: 600; color: #6b7280; margin: 0; }

.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; font-size: 0.85rem; font-weight: 700; color: #374151; margin-bottom: 0.5rem; }
.req { color: #dc2626; }
.form-control { width: 100%; padding: 0.8rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 0.85rem; color: #1f2937; outline: none; transition: border-color 0.2s; }
.form-control:focus { border-color: #660033; }
.text-area { resize: vertical; min-height: 80px; }

.select-wrapper { position: relative; }
.select-wrapper select { appearance: none; padding-left: 2.5rem; cursor: pointer; }
.select-wrapper .select-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }

.form-actions { display: flex; gap: 1rem; margin-top: 2rem; }
.form-actions button { flex: 1; padding: 0.8rem; border-radius: 8px; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; outline: none; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; }
.btn-cancel:hover { background: #e5e7eb; color: #111827; }
.btn-submit { background: #660033; color: #fff; border: none; }
.btn-submit:hover:not(:disabled) { background: #4d0026; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* Alert */
.alert-icon { font-weight: bold; }

/* Gift Admin Styles */
.gift-admin-section {
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}
.gift-msg-admin {
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  border-radius: 8px;
}
.gift-text-admin {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #660033;
  white-space: pre-wrap;
}
</style>
