import { sanitizeUrl } from './sanitize.js';

export const DASHBOARD_STORAGE_KEY = 'admin_dashboard_cache_v1';
export const LOGIN_ATTEMPTS_KEY = 'admin_login_attempts_v1';

const ALLOWED_RASTER_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const ALLOWED_FAVICON_MIME_TYPES = new Set([
  ...ALLOWED_RASTER_MIME_TYPES,
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const ALLOWED_RASTER_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
]);

const ALLOWED_FAVICON_EXTENSIONS = new Set([
  ...ALLOWED_RASTER_EXTENSIONS,
  'ico',
]);

const DANGEROUS_EXTENSIONS_REGEX = /\.(?:svg|svgz|html|htm|xhtml|xml|js|mjs|cjs|ts|php|phtml|phar|sh|bat|cmd|exe|dll|msi|vbs|ps1|py|rb|pl|asp|aspx|jsp|cgi)(?:$|\.)/i;
const FORMULA_PREFIX_REGEX = /^[=+\-@|]/;
const PLAIN_NUMBER_REGEX = /^-[0-9]+(?:\.[0-9]+)?$/;
const SAFE_DATA_IMAGE_REGEX = /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i;

export function hasControlCharacters(str) {
  const input = String(str ?? '');
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

const stripLeadingControlChars = (str) => {
  const input = String(str ?? '');
  let idx = 0;
  while (idx < input.length && (input.charCodeAt(idx) <= 32 || input.charCodeAt(idx) === 127)) {
    idx += 1;
  }
  return input.slice(idx);
};

/**
 * Validates an uploaded image file in the Admin Dashboard.
 * Blocks SVG/HTML/script uploads (Stored XSS vector), double extensions, and oversized files.
 */
export function validateAdminImageFile(file, options = {}) {
  const { maxSizeMB = 2, allowIco = false } = options;

  if (!file || typeof file !== 'object') {
    return { valid: false, error: 'الملف المختار غير صالح' };
  }

  const fileName = String(file.name || '').trim();
  const mimeType = String(file.type || '').trim().toLowerCase();
  const size = Number(file.size ?? 0);

  if (!fileName || hasControlCharacters(fileName)) {
    return { valid: false, error: 'اسم الملف غير صالح' };
  }

  if (DANGEROUS_EXTENSIONS_REGEX.test(fileName) || mimeType.includes('svg') || mimeType.includes('html') || mimeType.includes('xml') || mimeType.includes('script')) {
    return {
      valid: false,
      error: 'لا يُسمح برفع ملفات SVG أو الملفات التنفيذية لأسباب أمنية. يرجى اختيار صورة بصيغة PNG أو JPG أو WEBP',
    };
  }

  const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';
  const allowedExts = allowIco ? ALLOWED_FAVICON_EXTENSIONS : ALLOWED_RASTER_EXTENSIONS;
  const allowedMimes = allowIco ? ALLOWED_FAVICON_MIME_TYPES : ALLOWED_RASTER_MIME_TYPES;

  if (!ext || !allowedExts.has(ext)) {
    return {
      valid: false,
      error: 'امتداد الصورة غير مدعوم. الصيغ المسموحة: JPG, PNG, WEBP, GIF, AVIF',
    };
  }

  if (!mimeType || !allowedMimes.has(mimeType)) {
    return {
      valid: false,
      error: 'نوع ملف الصورة غير مدعوم. يرجى رفع صورة حقيقية بصيغة JPG أو PNG أو WEBP',
    };
  }

  if (!Number.isFinite(size) || size <= 0) {
    return { valid: false, error: 'ملف الصورة فارغ أو تالف' };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (size > maxBytes) {
    return {
      valid: false,
      error: `حجم الصورة يجب أن لا يتجاوز ${maxSizeMB} ميجابايت`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Safely creates a blob preview URL and revokes any previous blob URL to prevent memory leaks.
 */
export function safeObjectUrl(file, previousUrl = null) {
  if (
    previousUrl &&
    typeof previousUrl === 'string' &&
    previousUrl.startsWith('blob:') &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    try {
      URL.revokeObjectURL(previousUrl);
    } catch {
      // Ignore revoke errors
    }
  }
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && file) {
    return URL.createObjectURL(file);
  }
  return '';
}

/**
 * Neutralizes spreadsheet formula injection (CSV / Excel DDE Injection).
 * Any cell beginning with =, +, -, @, |, tab, or CR/LF (except plain negative numbers)
 * is prefixed with a single quote so spreadsheet apps treat it strictly as text.
 */
export function sanitizeSpreadsheetCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  const raw = String(value);
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (PLAIN_NUMBER_REGEX.test(trimmed)) return trimmed;
  const stripped = stripLeadingControlChars(raw);
  if (FORMULA_PREFIX_REGEX.test(stripped) || raw.startsWith('\t') || raw.startsWith('\r') || raw.startsWith('\n')) {
    return `'${stripped}`;
  }
  return raw;
}

/**
 * Encodes a URL path segment (such as an entity ID) and blocks path traversal sequences.
 */
export function encodePathSegment(value, label = 'id') {
  if (value === null || value === undefined || typeof value === 'object' || typeof value === 'boolean') {
    throw new Error(`Invalid ${label} parameter`);
  }
  const raw = String(value).trim();
  if (!raw || raw === 'undefined' || raw === 'null' || raw === '.' || raw === '..' || raw.includes('..') || /[\\/?#]/.test(raw) || hasControlCharacters(raw)) {
    throw new Error(`Invalid ${label} parameter`);
  }
  return encodeURIComponent(raw);
}

/**
 * Sanitizes asset/image URLs for the dashboard while preserving `/public/storage/` normalization.
 * Blocks `javascript:`, `vbscript:`, `data:text/html`, `data:image/svg+xml`, and `//evil.com`.
 */
export function sanitizeAssetUrl(raw, fallback = '') {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '[]' || hasControlCharacters(trimmed)) return fallback;

  if (trimmed.startsWith('blob:')) return trimmed;
  if (SAFE_DATA_IMAGE_REGEX.test(trimmed)) return trimmed;

  const normalizedStorage = trimmed.replace(/^(https?:\/\/[^/]+)\/storage\//i, '$1/public/storage/');
  const sanitized = sanitizeUrl(normalizedStorage, fallback);
  return sanitized || fallback;
}

/**
 * Strictly checks whether a user object has explicit boolean/numeric-1 admin privileges.
 */
export function isExplicitNonAdminUser(user) {
  if (!user || typeof user !== 'object') return false;
  const role = String(user.role || '').trim().toLowerCase();
  const isSuper = user.is_super_admin === true || user.is_super_admin === 1;
  const isAdmin = user.is_admin === true || user.is_admin === 1;
  return ['customer', 'user', 'client', 'guest'].includes(role) && !isSuper && !isAdmin;
}

/**
 * Purges all admin session tokens, cached admin profile, and cached dashboard business data.
 */
export function clearAdminSessionArtifacts(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    storage?.removeItem('token');
    storage?.removeItem('admin');
    storage?.removeItem(DASHBOARD_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  if (typeof globalThis !== 'undefined' && globalThis.__mastergasDashboardCache) {
    globalThis.__mastergasDashboardCache.data = null;
    globalThis.__mastergasDashboardCache.version = -1;
    globalThis.__mastergasDashboardCache.owner = null;
    globalThis.__mastergasDashboardCache.inFlight = null;
  }
}

/**
 * Verifies that the current browser storage holds a valid admin token and non-tampered admin profile.
 */
export function hasValidAdminSession(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return false;
  const rawToken = String(storage.getItem('token') ?? '').trim();
  if (!rawToken || rawToken === 'undefined' || rawToken === 'null' || hasControlCharacters(rawToken)) {
    return false;
  }

  const rawAdmin = storage.getItem('admin');
  if (rawAdmin !== null && rawAdmin !== undefined) {
    try {
      const parsed = JSON.parse(rawAdmin);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        clearAdminSessionArtifacts(storage);
        return false;
      }
      const user = parsed.user || parsed.admin || parsed;
      if (isExplicitNonAdminUser(user)) {
        clearAdminSessionArtifacts(storage);
        return false;
      }
    } catch {
      // Corrupt or tampered `admin` JSON invalidates the entire session
      clearAdminSessionArtifacts(storage);
      return false;
    }
  }

  return true;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000;

const getSessionStore = () => (typeof sessionStorage !== 'undefined' ? sessionStorage : globalThis.sessionStorage || null);

export function checkLoginRateLimit(now = Date.now()) {
  const store = getSessionStore();
  if (!store) return { blocked: false, remainingSeconds: 0, attempts: 0 };
  try {
    const raw = store.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { blocked: false, remainingSeconds: 0, attempts: 0 };
    const state = JSON.parse(raw);
    const lockedUntil = Number(state?.lockedUntil || 0);
    if (lockedUntil > now) {
      return {
        blocked: true,
        remainingSeconds: Math.ceil((lockedUntil - now) / 1000),
        attempts: Number(state?.attempts || MAX_LOGIN_ATTEMPTS),
      };
    }
    if (lockedUntil && lockedUntil <= now) {
      store.removeItem(LOGIN_ATTEMPTS_KEY);
      return { blocked: false, remainingSeconds: 0, attempts: 0 };
    }
    return {
      blocked: false,
      remainingSeconds: 0,
      attempts: Number(state?.attempts || 0),
    };
  } catch {
    store.removeItem(LOGIN_ATTEMPTS_KEY);
    return { blocked: false, remainingSeconds: 0, attempts: 0 };
  }
}

export function recordLoginFailure(now = Date.now()) {
  const store = getSessionStore();
  if (!store) return { blocked: false, remainingSeconds: 0, attempts: 1 };
  const current = checkLoginRateLimit(now);
  const attempts = current.attempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;
  try {
    store.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ attempts, lockedUntil }));
  } catch {
    // Ignore storage errors
  }
  return {
    blocked: lockedUntil > now,
    remainingSeconds: lockedUntil > now ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0,
    attempts,
  };
}

export function resetLoginRateLimit() {
  const store = getSessionStore();
  try {
    store?.removeItem(LOGIN_ATTEMPTS_KEY);
  } catch {
    // Ignore storage errors
  }
}
