import { logPayment } from './terminalLogger.js';
import { getCustomerToken } from './customerSession.js';

const PAYTABS_SUCCESS_STATUSES = new Set([
  'A',
  'AUTHORIZED',
  'AUTHORISED',
  'SUCCESS',
  'PAID',
  'COMPLETED',
]);

const PAYTABS_FAILURE_STATUSES = new Set([
  'C',
  'D',
  'E',
  'X',
  'FAILED',
  'FAILURE',
  'CANCELLED',
  'CANCELED',
  'DECLINED',
  'ERROR',
]);

const PENDING_PAYMENT_PREFIX = 'pending_paytabs_order_v3_';
const COMPLETED_PAYMENT_PREFIX = 'completed_paytabs_order_v2_';
const PROCESSING_LOCK_PREFIX = 'paytabs_processing_lock_v1_';
const ORDER_ATTEMPT_PREFIX = 'checkout_order_attempt_v2_';

export const PAYMENT_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000;
export const PAYMENT_LOCK_TTL_MS = 2 * 60 * 1000;

const getStorage = (storage) => storage || globalThis.localStorage;

const safeParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

const stableTokenFingerprint = (token = '') => {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const getCheckoutOwner = (storage) => {
  const targetStorage = getStorage(storage);
  const token = storage ? targetStorage?.getItem('c_token') || '' : getCustomerToken() || '';
  return token ? `customer_${stableTokenFingerprint(token)}` : 'guest';
};

const sweepExpiredOwnerRecords = (storage, prefix, now) => {
  if (!storage || typeof storage.key !== 'function' || !Number.isFinite(storage.length)) return;
  const ownerPrefix = `${prefix}${getCheckoutOwner(storage)}_`;
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (!key?.startsWith(ownerPrefix)) continue;
    const record = safeParse(storage.getItem(key));
    if (!record || !Number.isFinite(record.expiresAt) || record.expiresAt <= now) {
      storage.removeItem(key);
    }
  }
};

const normalizeAttemptId = (value) => (value ?? '').toString().trim();

export const getPendingPaymentKey = (attemptId, storage) => {
  const normalizedAttemptId = normalizeAttemptId(attemptId);
  if (!normalizedAttemptId) return null;
  return `${PENDING_PAYMENT_PREFIX}${getCheckoutOwner(storage)}_${stableTokenFingerprint(normalizedAttemptId)}`;
};

const getOrderAttemptKey = (orderFingerprint, storage) => (
  `${ORDER_ATTEMPT_PREFIX}${getCheckoutOwner(storage)}_${orderFingerprint}`
);

const getCompletedPaymentKey = (transactionRef, attemptId, storage) => {
  const receiptIdentity = `${normalizeAttemptId(transactionRef)}:${normalizeAttemptId(attemptId)}`;
  return `${COMPLETED_PAYMENT_PREFIX}${getCheckoutOwner(storage)}_${stableTokenFingerprint(receiptIdentity)}`;
};

const createRandomId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const createIdempotencyKey = () => `checkout-${createRandomId()}`;

export const getOrCreateOrderAttempt = (
  orderData,
  { storage, now = Date.now() } = {}
) => {
  if (!isValidOrderSnapshot(orderData)) {
    throw new Error('Cannot create an empty order attempt');
  }

  const targetStorage = getStorage(storage);
  sweepExpiredOwnerRecords(targetStorage, ORDER_ATTEMPT_PREFIX, now);
  const orderFingerprint = stableTokenFingerprint(JSON.stringify(orderData));
  const key = getOrderAttemptKey(orderFingerprint, targetStorage);
  const current = safeParse(targetStorage.getItem(key));
  if (
    current?.owner === getCheckoutOwner(targetStorage) &&
    current?.orderFingerprint === orderFingerprint &&
    current?.expiresAt > now &&
    current?.idempotencyKey
  ) {
    return current;
  }

  const attempt = {
    version: 2,
    owner: getCheckoutOwner(targetStorage),
    orderFingerprint,
    idempotencyKey: createIdempotencyKey(),
    createdAt: now,
    expiresAt: now + PAYMENT_ATTEMPT_TTL_MS,
  };
  targetStorage.setItem(key, JSON.stringify(attempt));
  return attempt;
};

export const clearOrderAttempt = (
  storage,
  expectedIdempotencyKey = null,
  orderData = null
) => {
  if (!isValidOrderSnapshot(orderData)) return false;
  const targetStorage = getStorage(storage);
  const orderFingerprint = stableTokenFingerprint(JSON.stringify(orderData));
  const key = getOrderAttemptKey(orderFingerprint, targetStorage);
  const current = safeParse(targetStorage.getItem(key));
  if (
    expectedIdempotencyKey &&
    current?.idempotencyKey &&
    current.idempotencyKey !== expectedIdempotencyKey
  ) {
    return false;
  }
  targetStorage.removeItem(key);
  return true;
};

const normalizeQueryValue = (value) => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

export const getLatestPendingPayment = (storage, now = Date.now()) => {
  const targetStorage = getStorage(storage);
  const ownerPrefix = `${PENDING_PAYMENT_PREFIX}${getCheckoutOwner(targetStorage)}_`;
  let latestRecord = null;
  let latestTime = 0;

  if (!targetStorage || typeof targetStorage.key !== 'function' || !Number.isFinite(targetStorage.length)) {
    return null;
  }

  for (let index = targetStorage.length - 1; index >= 0; index -= 1) {
    const key = targetStorage.key(index);
    if (!key?.startsWith(ownerPrefix)) continue;
    const record = safeParse(targetStorage.getItem(key));
    if (
      record &&
      record.version === 3 &&
      record.owner === getCheckoutOwner(targetStorage) &&
      isValidOrderSnapshot(record.orderData) &&
      Number.isFinite(record.expiresAt) &&
      record.expiresAt > now
    ) {
      if (record.createdAt >= latestTime) {
        latestTime = record.createdAt;
        latestRecord = record;
      }
    }
  }
  return latestRecord;
};

export const getPaymentReturnState = (query = {}, storage) => {
  const rawStatus = normalizeQueryValue(
    query.respStatus ?? query.resp_status ?? query.status
  );
  const status = rawStatus.toString().trim().toUpperCase();
  const transactionRef = normalizeQueryValue(
    query.tranRef ?? query.tran_ref ?? query.tranRefNo ?? query.payment_reference ?? query.transaction_id
  ).toString().trim();
  let attemptId = normalizeQueryValue(
    query.attempt ??
    query.checkout_attempt_id ??
    query.checkoutAttemptId ??
    query.cartId ??
    query.cart_id ??
    query.order_id ??
    query.orderId
  ).toString().trim();

  const targetStorage = getStorage(storage);
  if (!attemptId && transactionRef) {
    try {
      const latestPending = getLatestPendingPayment(targetStorage);
      if (latestPending?.attemptId) {
        attemptId = latestPending.attemptId;
      }
    } catch (_) { /* storage unavailable; keep the current attempt id */ }
  }

  const gatewayError = normalizeQueryValue(query.error).toString().trim();

  let result;
  if (gatewayError || (status && PAYTABS_FAILURE_STATUSES.has(status))) {
    result = { kind: 'failed', status, transactionRef, attemptId, gatewayError };
  } else if (!transactionRef || !attemptId) {
    result = { kind: 'invalid', status, transactionRef, attemptId, gatewayError: '' };
  } else if (!status || PAYTABS_SUCCESS_STATUSES.has(status)) {
    result = { kind: 'success', status: status || 'SUCCESS', transactionRef, attemptId, gatewayError: '' };
  } else {
    result = { kind: 'invalid', status, transactionRef, attemptId, gatewayError: '' };
  }

  logPayment('Return State', `Parsed redirect parameters -> Result kind: "${result.kind}"`, {
    rawStatus,
    parsedStatus: status,
    transactionRef,
    attemptId,
    gatewayError,
  });

  return result;
};

const getOrderIdentity = (order) => (
  order?.id ?? order?.order_id ?? order?.orderId ?? order?.order_number ?? order?.orderNumber ?? null
);

export const extractCreatedOrder = (response) => {
  const payload = response?.data;
  if (!payload || typeof payload !== 'object') return null;
  if (payload.success === false || payload.ok === false || payload.error) return null;

  const responseStatus = (payload.status || '').toString().trim().toLowerCase();
  if (['error', 'failed', 'failure', 'declined', 'cancelled'].includes(responseStatus)) return null;

  const candidates = [
    payload.data?.order,
    payload.order,
    payload.data,
    payload,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const identity = getOrderIdentity(candidate);
    if (identity !== null && identity !== undefined && identity !== '') {
      return {
        order: candidate,
        id: candidate.id ?? candidate.order_id ?? candidate.orderId ?? identity,
        number: candidate.order_number ?? candidate.orderNumber ?? identity,
      };
    }
  }

  // Fallback: If payload explicitly indicates success (e.g. { success: true, message: "Payment successfully." })
  if (payload.success === true || payload.status === 'success' || payload.ok === true || (typeof payload.message === 'string' && payload.message.toLowerCase().includes('success'))) {
    const fallbackId = payload.order_id || payload.id || payload.payment_reference || payload.reference;
    if (fallbackId) {
      return {
        order: payload,
        id: fallbackId,
        number: payload.order_number || payload.number || fallbackId,
      };
    }
  }

  return null;
};

const getResponseMarker = (response, keys) => {
  const payload = response?.data;
  const sources = [
    response?.headers,
    payload,
    payload?.meta,
    payload?.data,
    payload?.data?.meta,
    payload?.order,
    payload?.data?.order,
  ];
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== null && value !== undefined && value !== '') {
        return value.toString().trim();
      }
    }
  }
  return '';
};

// A 409 is only a safe idempotency replay when the response proves that the
// returned order belongs to this exact checkout/payment attempt.
export const extractMatchingConflictOrder = (
  response,
  { idempotencyKey = '', transactionRef = '' } = {}
) => {
  const expectedAttempt = normalizeAttemptId(idempotencyKey);
  const expectedTransaction = normalizeAttemptId(transactionRef);
  const responseAttempt = getResponseMarker(response, [
    'idempotency-key',
    'Idempotency-Key',
    'x-checkout-id',
    'X-Checkout-Id',
    'idempotency_key',
    'idempotencyKey',
    'checkout_attempt_id',
    'checkoutAttemptId',
    'checkout_id',
    'cart_id',
    'cartId',
  ]);
  const responseTransaction = getResponseMarker(response, [
    'payment_reference',
    'transaction_reference',
    'transactionRef',
    'tran_ref',
    'tranRef',
  ]);
  const attemptMatches = Boolean(expectedAttempt && responseAttempt === expectedAttempt);
  const transactionMatches = Boolean(expectedTransaction && responseTransaction === expectedTransaction);
  if (!attemptMatches && !transactionMatches) return null;
  return extractCreatedOrder(response);
};

export const getOrderDisplayNumber = (orderResult) => (
  orderResult?.number ?? orderResult?.id ?? ''
);

const isValidOrderSnapshot = (orderData) => (
  orderData &&
  typeof orderData === 'object' &&
  Array.isArray(orderData.items) &&
  orderData.items.length > 0
);

export const savePendingPayment = (
  orderData,
  { storage, now = Date.now(), idempotencyKey = createIdempotencyKey() } = {}
) => {
  if (!isValidOrderSnapshot(orderData)) {
    throw new Error('Cannot save an empty checkout attempt');
  }

  const targetStorage = getStorage(storage);
  const owner = getCheckoutOwner(targetStorage);
  const attemptId = normalizeAttemptId(idempotencyKey);
  if (!attemptId) throw new Error('Checkout attempt ID is required');
  sweepExpiredOwnerRecords(targetStorage, PENDING_PAYMENT_PREFIX, now);
  const record = {
    version: 3,
    owner,
    attemptId,
    createdAt: now,
    expiresAt: now + PAYMENT_ATTEMPT_TTL_MS,
    idempotencyKey: attemptId,
    orderData,
  };

  targetStorage.setItem(getPendingPaymentKey(attemptId, targetStorage), JSON.stringify(record));
  logPayment('Pending Saved', `Saved pending payment attempt "${attemptId}" to LocalStorage`, {
    owner,
    attemptId,
    itemCount: orderData.items?.length,
  });
  return record;
};

export const readPendingPayment = (attemptId, storage, now = Date.now()) => {
  let normalizedAttemptId = normalizeAttemptId(attemptId);
  const targetStorage = getStorage(storage);

  if (!normalizedAttemptId) {
    const latest = getLatestPendingPayment(targetStorage, now);
    if (latest?.attemptId) {
      normalizedAttemptId = latest.attemptId;
    } else {
      return { ok: false, reason: 'missing_attempt' };
    }
  }

  const key = getPendingPaymentKey(normalizedAttemptId, targetStorage);
  const raw = targetStorage.getItem(key);
  const record = safeParse(raw);

  if (!record) {
    if (raw) targetStorage.removeItem(key);
    return { ok: false, reason: 'missing' };
  }

  if (
    record.version !== 3 ||
    record.owner !== getCheckoutOwner(targetStorage) ||
    record.attemptId !== normalizedAttemptId ||
    record.idempotencyKey !== normalizedAttemptId ||
    !isValidOrderSnapshot(record.orderData)
  ) {
    return { ok: false, reason: 'invalid' };
  }

  if (!Number.isFinite(record.expiresAt) || record.expiresAt <= now) {
    targetStorage.removeItem(key);
    return { ok: false, reason: 'expired' };
  }

  if (record) {
    logPayment('Pending Read', `Found pending payment attempt "${normalizedAttemptId}" in LocalStorage`, { attemptId: normalizedAttemptId });
  } else {
    logPayment('Pending Read Warning', `Pending payment attempt "${normalizedAttemptId}" not found or expired in LocalStorage`);
  }

  return { ok: true, key, record };
};

export const clearPendingPayment = (attemptId, storage) => {
  const normalizedAttemptId = normalizeAttemptId(attemptId);
  if (!normalizedAttemptId) return false;
  const targetStorage = getStorage(storage);
  const key = getPendingPaymentKey(normalizedAttemptId, targetStorage);
  const current = safeParse(targetStorage.getItem(key));
  if (current?.idempotencyKey && current.idempotencyKey !== normalizedAttemptId) return false;
  targetStorage.removeItem(key);
  return true;
};

export const saveCompletedPayment = (
  {
    transactionRef,
    attemptId,
    orderId,
    orderNumber,
    purchasedItems = [],
    cleanupState = 'pending',
  },
  storage,
  now = Date.now()
) => {
  const normalizedTransactionRef = normalizeAttemptId(transactionRef);
  const normalizedAttemptId = normalizeAttemptId(attemptId);
  if (!normalizedTransactionRef || !normalizedAttemptId) {
    throw new Error('Completed payment must be bound to a transaction and checkout attempt');
  }
  const targetStorage = getStorage(storage);
  sweepExpiredOwnerRecords(targetStorage, COMPLETED_PAYMENT_PREFIX, now);
  const record = {
    version: 2,
    owner: getCheckoutOwner(targetStorage),
    transactionRef: normalizedTransactionRef,
    attemptId: normalizedAttemptId,
    orderId,
    orderNumber: orderNumber || orderId,
    purchasedItems: Array.isArray(purchasedItems) ? purchasedItems : [],
    cleanupState: ['pending', 'started', 'complete'].includes(cleanupState)
      ? cleanupState
      : 'pending',
    completedAt: now,
    expiresAt: now + PAYMENT_ATTEMPT_TTL_MS,
  };
  targetStorage.setItem(
    getCompletedPaymentKey(normalizedTransactionRef, normalizedAttemptId, targetStorage),
    JSON.stringify(record)
  );
  return record;
};

export const readCompletedPayment = (transactionRef, attemptId, storage, now = Date.now()) => {
  const normalizedTransactionRef = normalizeAttemptId(transactionRef);
  let normalizedAttemptId = normalizeAttemptId(attemptId);
  if (!normalizedTransactionRef) return null;
  const targetStorage = getStorage(storage);

  if (!normalizedAttemptId) {
    const latestPending = getLatestPendingPayment(targetStorage, now);
    if (latestPending?.attemptId) {
      normalizedAttemptId = latestPending.attemptId;
    }
  }
  if (!normalizedAttemptId) return null;

  const key = getCompletedPaymentKey(normalizedTransactionRef, normalizedAttemptId, targetStorage);
  const record = safeParse(targetStorage.getItem(key));
  if (
    !record ||
    record.version !== 2 ||
    record.owner !== getCheckoutOwner(targetStorage) ||
    record.transactionRef !== normalizedTransactionRef ||
    record.attemptId !== normalizedAttemptId ||
    !Number.isFinite(record.expiresAt) ||
    record.expiresAt <= now
  ) {
    if (record?.expiresAt <= now) targetStorage.removeItem(key);
    return null;
  }
  return record;
};

export const acquirePaymentLock = (
  idempotencyKey,
  storage,
  now = Date.now()
) => {
  const targetStorage = getStorage(storage);
  const key = `${PROCESSING_LOCK_PREFIX}${idempotencyKey}`;
  const current = safeParse(targetStorage.getItem(key));
  if (current?.expiresAt > now) return null;

  const owner = createRandomId();
  const lock = { owner, expiresAt: now + PAYMENT_LOCK_TTL_MS };
  targetStorage.setItem(key, JSON.stringify(lock));
  const saved = safeParse(targetStorage.getItem(key));
  const acquired = saved?.owner === owner;
  if (acquired) {
    logPayment('Lock Acquired', `Acquired processing lock for idempotency key: "${idempotencyKey}"`);
    return { key, owner };
  } else {
    logPayment('Lock Failed', `Could not acquire processing lock for idempotency key: "${idempotencyKey}"`);
    return null;
  }
};

export const releasePaymentLock = (lock, storage) => {
  if (!lock) return;
  const targetStorage = getStorage(storage);
  const current = safeParse(targetStorage.getItem(lock.key));
  if (current?.owner === lock.owner) targetStorage.removeItem(lock.key);
};

export const getIdempotencyConfig = (idempotencyKey) => ({
  timeout: 30_000,
  headers: {
    'Idempotency-Key': idempotencyKey,
    'X-Checkout-Id': idempotencyKey,
  },
});
