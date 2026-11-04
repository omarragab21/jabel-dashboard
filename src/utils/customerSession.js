const TOKEN_KEY = 'c_token';

const getStorage = (kind) => {
  if (kind === 'session') {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : globalThis.sessionStorage || null;
  }
  return typeof localStorage !== 'undefined' ? localStorage : globalThis.localStorage || null;
};

const normalizeToken = (raw) => {
  const value = String(raw ?? '').trim();
  if (!value || value === 'undefined' || value === 'null') return null;
  return value;
};

const isMockAuthAllowed = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) return false;
  if (typeof window === 'undefined' || !window.location) return false;
  const host = String(window.location.hostname || '').toLowerCase();
  return !host || host === 'localhost' || host === '127.0.0.1';
};

export const getCustomerToken = () => {
  if (
    isMockAuthAllowed() &&
    typeof window !== 'undefined' &&
    window.location?.search?.includes('mockAuth=true')
  ) {
    return 'preview_token';
  }
  return (
    normalizeToken(getStorage('local')?.getItem(TOKEN_KEY)) ||
    normalizeToken(getStorage('session')?.getItem(TOKEN_KEY)) ||
    null
  );
};

export const setCustomerToken = (token, remember = true) => {
  const local = getStorage('local');
  const session = getStorage('session');
  local?.removeItem(TOKEN_KEY);
  session?.removeItem(TOKEN_KEY);
  const clean = normalizeToken(token);
  if (clean) {
    (remember ? local : session)?.setItem(TOKEN_KEY, clean);
  }
};

export const clearCustomerToken = () => {
  getStorage('local')?.removeItem(TOKEN_KEY);
  getStorage('session')?.removeItem(TOKEN_KEY);
};
