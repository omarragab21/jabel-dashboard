/**
 * Meta (Facebook) Pixel Utility Helpers
 * Pixel ID: 1453462659987703
 */

export const PIXEL_ID = '1453462659987703';

/**
 * Safely calls window.fbq if initialized
 * @param {string} type - 'track' | 'trackCustom' | 'init'
 * @param {string} eventName 
 * @param {object} [params] 
 */
export function fbq(type, eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    if (Object.keys(params).length > 0) {
      window.fbq(type, eventName, params);
    } else {
      window.fbq(type, eventName);
    }
  }
}

/**
 * Tracks PageView event (typically called on Vue Router route changes)
 * @param {object} [params]
 */
export function trackPageView(params = {}) {
  fbq('track', 'PageView', params);
}

/**
 * Tracks standard Meta Pixel event
 * @param {string} eventName 
 * @param {object} [params]
 */
export function trackEvent(eventName, params = {}) {
  fbq('track', eventName, params);
}

/**
 * Tracks custom Meta Pixel event
 * @param {string} eventName 
 * @param {object} [params]
 */
export function trackCustomEvent(eventName, params = {}) {
  fbq('trackCustom', eventName, params);
}

/**
 * Track ViewContent event (Product Details View)
 * @param {object} product - { id, name, price, category }
 * @param {string} [currency='JOD']
 */
export function trackViewContent(product, currency = 'JOD') {
  if (!product) return;
  trackEvent('ViewContent', {
    content_name: product.name || product.arabic_name || product.english_name || '',
    content_category: product.category ? (product.category.name || product.category) : '',
    content_ids: [String(product.id || '')],
    content_type: 'product',
    value: parseFloat(product.sale_price || product.price || 0),
    currency: currency,
  });
}

/**
 * Track AddToCart event
 * @param {object} product - { id, name, price }
 * @param {number} [quantity=1]
 * @param {string} [currency='JOD']
 */
export function trackAddToCart(product, quantity = 1, currency = 'JOD') {
  if (!product) return;
  const price = parseFloat(product.sale_price || product.price || 0);
  trackEvent('AddToCart', {
    content_name: product.name || product.arabic_name || product.english_name || '',
    content_ids: [String(product.id || '')],
    content_type: 'product',
    value: price * quantity,
    currency: currency,
  });
}

/**
 * Track InitiateCheckout event
 * @param {Array} items - List of cart items
 * @param {number} totalValue - Total amount
 * @param {string} [currency='JOD']
 */
export function trackInitiateCheckout(items = [], totalValue = 0, currency = 'JOD') {
  const contentIds = items.map(item => String(item.id || item.product_id || ''));
  trackEvent('InitiateCheckout', {
    content_ids: contentIds,
    content_type: 'product',
    num_items: items.reduce((acc, item) => acc + (item.quantity || 1), 0),
    value: parseFloat(totalValue || 0),
    currency: currency,
  });
}

/**
 * Track Purchase event
 * @param {object} orderDetails - { orderId, totalValue, items }
 * @param {string} [currency='JOD']
 */
export function trackPurchase(orderDetails = {}, currency = 'JOD') {
  const { orderId, totalValue, items = [] } = orderDetails;
  const contentIds = items.map(item => String(item.id || item.product_id || ''));
  trackEvent('Purchase', {
    content_ids: contentIds,
    content_type: 'product',
    value: parseFloat(totalValue || 0),
    currency: currency,
    order_id: String(orderId || ''),
  });
}

/**
 * Track Search event
 * @param {string} searchQuery 
 */
export function trackSearch(searchQuery) {
  if (!searchQuery) return;
  trackEvent('Search', {
    search_string: searchQuery,
  });
}
