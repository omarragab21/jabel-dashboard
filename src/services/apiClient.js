import api, {
  classifyApiError,
  isCancelledRequest,
  recordApiMetric,
} from '../config/axios';

const inflightRequests = new Map();
const responseCache = new Map();

const RETRY_DELAYS = [300, 800, 1500];

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const stableSerialize = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
};

export const createRequestKey = (endpoint, params = {}) => `${endpoint}?${stableSerialize(params)}`;

const numeric = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const getMetaSource = (body) => {
  if (!isPlainObject(body)) return {};
  const nested = isPlainObject(body.data) ? body.data : {};
  const nestedMeta = isPlainObject(nested.meta) ? nested.meta : {};
  return {
    ...body,
    ...nested,
    ...(isPlainObject(body.meta) ? body.meta : {}),
    ...(isPlainObject(nested.meta) ? nested.meta : {}),
    ...nestedMeta,
  };
};

/**
 * Normalize every collection response shape used by Laravel and the public API.
 * Supports raw arrays, {data: []}, {data: {data: []}}, and pagination metadata.
 */
export const parseCollectionResponse = (payload) => {
  const body = payload?.config && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;

  let items = [];
  let data = body;

  if (Array.isArray(body)) {
    items = body;
  } else if (isPlainObject(body)) {
    if (Array.isArray(body.data)) {
      items = body.data;
      data = body.data;
    } else if (isPlainObject(body.data) && Array.isArray(body.data.data)) {
      items = body.data.data;
      data = body.data.data;
    } else if (Array.isArray(body.items)) {
      items = body.items;
      data = body.items;
    }
  }

  const metaSource = getMetaSource(body);
  const meta = {
    ...metaSource,
    total: numeric(metaSource.total ?? metaSource.total_count, items.length),
    current_page: numeric(metaSource.current_page ?? metaSource.currentPage, 1) || 1,
    last_page: numeric(metaSource.last_page ?? metaSource.lastPage, 1) || 1,
    per_page: numeric(metaSource.per_page ?? metaSource.perPage, items.length) || items.length,
  };

  return {
    items,
    total: meta.total,
    current_page: meta.current_page,
    last_page: meta.last_page,
    per_page: meta.per_page,
    meta,
    data,
    raw: body,
  };
};

export const parseDataResponse = (payload) => {
  const body = payload?.config && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
  if (isPlainObject(body) && body.data !== undefined) {
    if (isPlainObject(body.data) && body.data.data !== undefined) return body.data.data;
    return body.data;
  }
  return body;
};

const createCancelledError = () => {
  const error = new Error('Request cancelled');
  error.name = 'AbortError';
  error.code = 'ERR_CANCELED';
  return error;
};

const wait = (milliseconds, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(createCancelledError());
    return;
  }
  const timer = setTimeout(resolve, milliseconds);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(createCancelledError());
  }, { once: true });
});

const shouldRetry = (error) => {
  if (isCancelledRequest(error)) return false;
  const kind = classifyApiError(error);
  return kind === 'timeout' || kind === 'network' || kind === '5xx';
};

const requestWithRetry = async (endpoint, params, options) => {
  const retries = Math.max(0, Math.min(Number(options.retries ?? 2), RETRY_DELAYS.length));
  let attempt = 0;

  while (true) {
    if (options.signal?.aborted) throw createCancelledError();
    try {
      const response = await api.get(endpoint, {
        params,
        signal: options.signal,
        timeout: options.timeout,
        __retryCount: attempt,
      });
      return response.data;
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) throw error;
      await wait(RETRY_DELAYS[attempt], options.signal);
      attempt += 1;
    }
  }
};

const recordCacheMetric = (endpoint, params, cache) => {
  const now = Date.now();
  recordApiMetric({
    endpoint,
    parameters: params,
    start_time: now,
    end_time: now,
    duration: 0,
    status: 200,
    retry_count: 0,
    cache,
    aborted: false,
  });
};

export const getCached = (endpoint, params = {}, options = {}) => {
  const key = createRequestKey(endpoint, params);
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    recordCacheMetric(endpoint, params, 'hit');
    return Promise.resolve(cached.value);
  }

  if (inflightRequests.has(key)) {
    recordCacheMetric(endpoint, params, 'inflight');
    return inflightRequests.get(key);
  }

  recordCacheMetric(endpoint, params, 'miss');
  const promise = requestWithRetry(endpoint, params, options)
    .then((value) => {
      responseCache.set(key, {
        value,
        expiresAt: Date.now() + Math.max(0, Number(options.ttl ?? 0)),
        savedAt: Date.now(),
      });
      return value;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, promise);
  return promise;
};

export const getStaleCached = (endpoint, params = {}) => {
  const entry = responseCache.get(createRequestKey(endpoint, params));
  return entry?.value;
};

export const invalidateCache = (endpoint, params) => {
  if (params) responseCache.delete(createRequestKey(endpoint, params));
  else {
    for (const key of responseCache.keys()) {
      if (key.startsWith(`${endpoint}?`)) responseCache.delete(key);
    }
  }
};

export const clearApiCache = () => {
  responseCache.clear();
  inflightRequests.clear();
};

export const getCacheState = () => ({
  entries: [...responseCache.entries()].map(([key, value]) => ({ key, ...value })),
  inflight: [...inflightRequests.keys()],
});

export const API_TTL = Object.freeze({
  settings: 5 * 60 * 1000,
  categories: 5 * 60 * 1000,
  offers: 60 * 1000,
  products: 45 * 1000,
  productDetail: 60 * 1000,
});

export default {
  getCached,
  getStaleCached,
  invalidateCache,
  clearApiCache,
  parseCollectionResponse,
  parseDataResponse,
  createRequestKey,
  API_TTL,
};
