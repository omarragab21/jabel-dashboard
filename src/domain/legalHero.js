// Header photo of the legal pages: reading the URL the site-images upload endpoint answers with.

/** The URL out of an upload response ({data:{image_url}}, {url}, a bare string ...), or '' when it has none. */
export const uploadedImageUrl = (body) => {
  const candidates = [body, body?.data, body?.data?.data, body?.data?.image, body?.image];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = typeof candidate === 'string'
      ? candidate
      : (candidate.image_url || candidate.url || candidate.image || candidate.path || candidate.file || candidate.src);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

// The cover of a legal page is EITHER a photo OR a plain colour, never both.
export const LEGAL_HERO_TYPES = ['image', 'color'];
// The plain dark the website header already shows when nothing else is chosen.
export const DEFAULT_HERO_COLOR = '#0f172a';

/** "#abc" / "#AABBCC" -> "#aabbcc"; '' when the value is not a hex colour. */
export const normalizeHeroColor = (value) => {
  const text = String(value ?? '').trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(text)) return `#${[...text.slice(1)].map((c) => c + c).join('')}`.toLowerCase();
  return '';
};

/** Which kind of cover a stored page uses. Pages saved before colours existed have a photo or the dark default. */
export const resolveHeroType = (data) => {
  if (LEGAL_HERO_TYPES.includes(data?.hero_type)) return data.hero_type;
  return typeof data?.hero_image === 'string' && data.hero_image.trim() && data.hero_image.trim() !== '[]' ? 'image' : 'color';
};

/** Problem with the chosen cover ('' when fine). `hasImage` says whether a photo is picked (staged or stored). */
export const heroProblem = ({ type, color, hasImage }) => {
  if (type === 'image') return hasImage ? '' : 'IMAGE_REQUIRED';
  if (type === 'color') return normalizeHeroColor(color) ? '' : 'COLOR_INVALID';
  return 'TYPE_REQUIRED';
};
