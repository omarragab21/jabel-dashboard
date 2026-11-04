import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTR = [
  'href',
  'title',
  'rel',
  'dir',
  'lang',
  'class',
];

const SAFE_URI_REGEXP = /^(?:(?:https?|mailto|tel):|\/(?![/\\])|#)/i;
const UNSAFE_URI_SCHEME = /^(?:javascript|data|vbscript|file|blob):/i;

export function sanitizeHtml(content) {
  const input = String(content ?? '');
  if (typeof DOMPurify?.sanitize === 'function') {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
      KEEP_CONTENT: false,
      ALLOWED_URI_REGEXP: SAFE_URI_REGEXP,
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
      FORBID_ATTR: ['style', 'target', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
    });
  }
  // Safe SSR / non-DOM fallback: strip forbidden tags, event handlers, and unsafe href/src attributes
  return input
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:style|target|data-[a-z0-9_-]+|aria-[a-z0-9_-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*(?:"\s*(?:javascript|data|vbscript|file):[^"]*"|'\s*(?:javascript|data|vbscript|file):[^']*')/gi, '');
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeUrl(raw, fallback = '') {
  const cleaned = [...String(raw ?? '')].filter((char) => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('').trim();
  const schemeProbe = cleaned.replace(/\s+/g, '');
  if (!cleaned || UNSAFE_URI_SCHEME.test(schemeProbe)) {
    return escapeHtml(fallback);
  }
  if (/^(?:https?:\/\/|\/(?![/\\]))/i.test(cleaned)) {
    return escapeHtml(cleaned);
  }
  return escapeHtml(fallback);
}
