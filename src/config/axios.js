import axios from 'axios';
import { isDataWrite, markDataChanged } from '../utils/dataFreshness';
import { clearAdminSessionArtifacts } from '../utils/adminSecurity';

const serverUrl = 'https://backend-jabal.be-kite.com/api';
const envUrl = import.meta.env.VITE_API_BASE_URL;

const isBrowser = typeof window !== 'undefined';
const frappeMode = import.meta.env.VITE_FRAPPE_MODE === 'true';
// Every request goes to the remote Tijara API; there is no local data source.
const baseURL = envUrl || (import.meta.env.DEV && isBrowser ? '/api' : serverUrl);

// Admin resources of the Tijara API; an auth failure on them ends the admin session.
const LIVE_ADMIN_PATH_PREFIXES = [
  '/v1/admins',
  '/v1/users',
  '/v1/categories',
  '/v1/discount_codes',
  '/v1/offers',
  '/v1/products',
  '/v1/attributes',
  '/v1/orders',
  '/v1/sliders',
  '/v1/reviews',
  '/v1/contacts',
  '/v1/returns',
  '/v1/settings',
  '/v1/site-images',
  '/v1/reports',
];

const isLiveAdminEndpoint = (cleanPath) =>
  LIVE_ADMIN_PATH_PREFIXES.some((prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`));

const normalizePath = (url = '') => String(url).split('?')[0].replace(/^\/api/, '') || '/';

// No instance-wide timeout: axios merges it into every request before the interceptor runs,
// which made the per-route values from getRequestTimeout unreachable. The interceptor sets it.
const api = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
  },
});

const apiMetrics = [];
const MAX_METRICS = 250;

const getStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null);

const getRequestPath = (config = {}) => {
  const rawUrl = config.url || '';
  return rawUrl.split('?')[0].replace(/^\/api/, '') || '/';
};

const sanitizeParameters = (parameters = {}) => Object.fromEntries(
  Object.entries(parameters || {}).map(([key, value]) => {
    const sensitive = /token|password|secret|authorization|email|phone|address|card|cvv|iban/i.test(key);
    return [key, sensitive ? '[redacted]' : value];
  })
);

export const getRequestTimeout = (url = '') => {
  const path = String(url).split('?')[0].replace(/^\/api/, '');
  if (/^\/v1\/(admin\/)?login$/.test(path)) return 15000;
  if (/^\/frontend\/(settings|categories|offers|sliders)(\/|$)/.test(path)) return 4000;
  if (/^\/frontend\/products\/[^/]+$/.test(path)) return 6000;
  if (/^\/frontend\/products(\/|$)/.test(path)) return 6000;
  // The contacts routes often take 5-12s on the live server; 6s cut them off mid-save.
  if (/^\/v1\/contacts(\/|$)/.test(path)) return 20000;
  return 6000;
};

const performanceMark = (name) => {
  try {
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark(name);
    }
  } catch {
    // Performance marks must never affect a customer request.
  }
};

export const recordApiMetric = (metric) => {
  const entry = { ...metric, recorded_at: new Date().toISOString() };
  apiMetrics.push(entry);
  if (apiMetrics.length > MAX_METRICS) apiMetrics.shift();
  if (import.meta.env?.DEV && typeof window !== 'undefined') {
    window.__mastergasApiMetrics = apiMetrics;
  }
  return entry;
};

export const getApiMetrics = () => [...apiMetrics];
export const clearApiMetrics = () => apiMetrics.splice(0, apiMetrics.length);

export const isCancelledRequest = (error) => Boolean(
  error?.code === 'ERR_CANCELED' ||
  error?.name === 'CanceledError' ||
  error?.name === 'AbortError' ||
  (typeof axios.isCancel === 'function' && axios.isCancel(error))
);

export const classifyApiError = (error) => {
  if (isCancelledRequest(error)) return 'cancelled';
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return 'timeout';
  if (!error?.response) return 'network';
  if (error.response.status >= 500) return '5xx';
  if (error.response.status >= 400) return '4xx';
  return 'unknown';
};

/**
 * Attach only the token that belongs to the requested API surface.
 */
api.interceptors.request.use(config => {
  const storage = getStorage();
  const lang = storage?.getItem('lang') || 'ar';
  config.headers['Accept-Language'] = lang;

  const requestId = config.headers['X-Request-ID'] || `mg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  config.headers['X-Request-ID'] = requestId;
  // A timeout passed on the call wins; otherwise the route decides (axios leaves 0 when unset).
  config.timeout = config.timeout || getRequestTimeout(config.url);
  config.__mastergasRequest = {
    requestId,
    startedAt: performanceNow(),
    endpoint: getRequestPath(config),
    retryCount: config.__retryCount || 0,
  };
  if (!globalThis.__mastergasFirstApiRequest) {
    globalThis.__mastergasFirstApiRequest = true;
    performanceMark('mastergas:first-api-request');
  }
  performanceMark(`mastergas:api:start:${requestId}`);

  const requestUrl = config.url || '';
  const cleanPath = normalizePath(requestUrl);
  // `/v1/site/*` is the customer-facing Site API, while `/v1/site-images`
  // is an authenticated Admin upload endpoint. Keep the slash boundary so
  // image uploads retain the admin token instead of being sent as storefront.
  const isStorefrontPath = cleanPath.startsWith('/frontend') || cleanPath.startsWith('/v1/site/');
  const rawToken = isStorefrontPath ? '' : String(storage?.getItem('token') ?? '').trim();
  const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (frappeMode && cleanPath.startsWith('/frontend') && config.method?.toLowerCase() === 'get') {
    const parts = cleanPath.split('/').filter(Boolean);
    const resource = parts[1];
    const methodMap = { products: 'get_products', categories: 'get_categories', offers: 'get_offers', brands: 'get_brands', settings: 'get_settings', sliders: 'get_sliders', reviews: 'get_product_reviews', coupons: 'get_coupons', topics: 'get_topics' };
    if (resource === 'products' && parts[2]) {
      config.baseURL = '/api';
      config.url = '/method/mastergas_core.api.frontend.get_product_detail';
      config.params = { ...(config.params || {}), id_or_slug: decodeURIComponent(parts[2]) };
    } else if (methodMap[resource]) {
      config.baseURL = '/api';
      config.url = `/method/mastergas_core.api.frontend.${methodMap[resource]}`;
    }
  }
  return config;
});

const performanceNow = () => {
  try {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  } catch {
    return Date.now();
  }
};

const finalizeMetric = (config, overrides = {}) => {
  const request = config?.__mastergasRequest || {};
  const start = request.startedAt || performanceNow();
  const duration = Math.max(0, performanceNow() - start);
  const requestId = request.requestId || config?.headers?.['X-Request-ID'];
  performanceMark(`mastergas:api:end:${requestId || 'unknown'}`);
  return recordApiMetric({
    endpoint: request.endpoint || getRequestPath(config),
    parameters: sanitizeParameters(config?.params || {}),
    start_time: start,
    end_time: start + duration,
    duration,
    status: overrides.status ?? null,
    retry_count: request.retryCount || 0,
    cache: overrides.cache || 'miss',
    aborted: Boolean(overrides.aborted),
    error_type: overrides.errorType,
  });
};

let appRouter = null;
export function setRouter(r) {
  appRouter = r;
}

let isRedirectingToAdminLogin = false;

api.interceptors.response.use(
  response => {
    finalizeMetric(response.config, { status: response.status });
    // A successful write makes every cached admin screen potentially stale.
    if (isDataWrite(response.config)) markDataChanged();
    if (frappeMode && response.data?.message?.success) response.data = response.data.message;
    if (getRequestPath(response.config).startsWith('/frontend/products')) {
      performanceMark('mastergas:products-api-complete');
    }
    return response;
  },
  error => {
    finalizeMetric(error.config, {
      status: error.response?.status || null,
      aborted: isCancelledRequest(error),
      errorType: classifyApiError(error),
    });
    // The Tijara backend currently answers a missing/expired token with HTTP 500 {"message":"Unauthenticated."}
    // instead of 401, so treat that exact payload as an auth failure too.
    const isUnauthenticated = error.response?.status === 401
      || (error.response?.status === 500 && error.response?.data?.message === 'Unauthenticated.');
    if (error.response && isUnauthenticated) {
      const url = error.config?.url || '';
      const cleanPath = url.split('?')[0].replace(/^\/api/, '');
      const isFrontendReq = cleanPath.startsWith('/frontend') || cleanPath.startsWith('/v1/site');
      const isAdminReq = !isFrontendReq && (
        cleanPath.startsWith('/dashboard') || 
        cleanPath.startsWith('/v1/admins') || 
        cleanPath.startsWith('/admin') ||
        isLiveAdminEndpoint(cleanPath)
      );
      const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

      if (isAdminReq || isAdminPath) {
        const storage = getStorage();
        clearAdminSessionArtifacts(storage);

        if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login' && !isRedirectingToAdminLogin) {
          isRedirectingToAdminLogin = true;
          if (appRouter && appRouter.currentRoute?.value?.path !== '/admin/login') {
            appRouter.push('/admin/login').finally(() => {
              isRedirectingToAdminLogin = false;
            });
          } else {
            window.location.replace('/admin/login');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
