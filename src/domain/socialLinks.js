// Social links in Settings > Contact. The website opens each one as a normal web address, so whatever the admin
// types is turned into one here: a WhatsApp number becomes a wa.me link, a bare "facebook.com/page" gets https://,
// and a plain handle ("@mastergas") becomes that platform's profile address. Anything else is reported as invalid
// instead of being dropped silently.
export const SOCIAL_KEYS = ['whatsapp', 'facebook', 'instagram', 'x_twitter', 'linkedin', 'youtube', 'snapchat', 'tiktok'];

const HANDLE_URLS = {
  facebook: (handle) => `https://facebook.com/${handle}`,
  instagram: (handle) => `https://instagram.com/${handle}`,
  x_twitter: (handle) => `https://x.com/${handle}`,
  linkedin: (handle) => `https://linkedin.com/company/${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
  snapchat: (handle) => `https://snapchat.com/add/${handle}`,
  tiktok: (handle) => `https://tiktok.com/@${handle}`,
};

const UNSAFE_SCHEME = /^(?:javascript|data|vbscript|file|blob):/i;
const printable = (raw) => [...String(raw ?? '')].filter((char) => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127).join('').trim();

/** Arabic-Indic digits to 0-9, so "٠٥٠٠" works as a phone number. */
const westernDigits = (text) => text
  .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

const isHttpUrl = (text) => {
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
};

/** WhatsApp number to international digits: +966..., 00966..., or a Saudi 05... number. */
export const whatsappDigits = (raw) => {
  let digits = westernDigits(String(raw ?? '')).replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  return digits;
};

/**
 * One social link as the form field holds it.
 * Returns { value } (empty string = no link) or { error } when the text cannot be a link.
 */
export const normalizeSocialLink = (key, raw) => {
  const text = printable(raw);
  if (!text) return { value: '' };
  if (UNSAFE_SCHEME.test(text.replace(/\s+/g, ''))) return { error: 'unsafe' };
  if (isHttpUrl(text)) return { value: text };

  if (key === 'whatsapp') {
    const digits = whatsappDigits(text);
    return digits.length >= 8 && digits.length <= 15 ? { value: `https://wa.me/${digits}` } : { error: 'invalid' };
  }

  // "facebook.com/mastergas" without https://
  if (/^[^\s/@]+\.[a-z]{2,}(?:[/?#]\S*)?$/i.test(text) && isHttpUrl(`https://${text}`)) return { value: `https://${text}` };

  // "@mastergas" or "mastergas": a handle on that platform
  const handle = text.replace(/^@/, '');
  if (HANDLE_URLS[key] && /^[A-Za-z0-9._-]{2,60}$/.test(handle)) return { value: HANDLE_URLS[key](handle) };
  return { error: 'invalid' };
};
