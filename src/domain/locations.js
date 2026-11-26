// Cities, delivery areas and store branches (/v1/dashboard/cities, /areas, /branches).
// Pure helpers (no Vue, no HTTP) so every rule here is covered by node tests.
//
// API resources (BranchResource / AreaResource / CityResource):
//   city   { id, name, description, is_active, areas?: Area[], translations: { en: { name, description }, ar: {...} } }
//   area   { id, city_id, name, description, is_active, city?: City, translations }
//   branch { id, city_id, area_id, name, description, lat, lang, is_active, city?: City, area?: Area, translations }
// Request bodies (JSON):
//   city   { name_en*, name_ar*, description_en, description_ar, is_active }
//   area   { city_id*, name_en*, name_ar*, description_en, description_ar, is_active }
//   branch { city_id*, area_id*, name_en*, name_ar*, description_en, description_ar, lat (-90..90), lang (-180..180), is_active }
// `lang` is the backend's name for the longitude.

const ARABIC_LETTERS = /[؀-ۿ]/;

const text = (value) => (value === null || value === undefined ? '' : String(value).trim());
const firstText = (...values) => values.map(text).find(Boolean) || '';
const toBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') return !['0', 'false', 'inactive', 'off', 'no'].includes(value.trim().toLowerCase());
  return Boolean(value);
};
const toId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};
/** A finite number, or null for blank / invalid input (never NaN). Accepts "24,71" too. */
export const toCoordinate = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim().replace(',', '.');
  if (!raw) return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
};

const bilingual = (raw = {}, field) => {
  const translations = raw.translations && typeof raw.translations === 'object' ? raw.translations : {};
  return {
    ar: firstText(translations.ar?.[field], raw[`${field}_ar`]),
    en: firstText(translations.en?.[field], raw[`${field}_en`]),
  };
};

export const hasArabicLetters = (value) => ARABIC_LETTERS.test(String(value || ''));

/** The name / description of an item in the given language, falling back to the other one and to `name`. */
export const localizedName = (item, lang = 'ar') => {
  if (!item) return '';
  const other = lang === 'en' ? 'ar' : 'en';
  return firstText(item.name_i18n?.[lang], item.name_i18n?.[other], item.name);
};
export const localizedDescription = (item, lang = 'ar') => {
  if (!item) return '';
  const other = lang === 'en' ? 'ar' : 'en';
  return firstText(item.description_i18n?.[lang], item.description_i18n?.[other], item.description);
};

const base = (raw = {}) => {
  const name = bilingual(raw, 'name');
  const description = bilingual(raw, 'description');
  return {
    id: toId(raw.id),
    name: firstText(raw.name, name.ar, name.en),
    name_i18n: { ar: firstText(name.ar, raw.name), en: firstText(name.en, raw.name) },
    description: firstText(raw.description, description.ar, description.en),
    description_i18n: { ar: firstText(description.ar, raw.description), en: firstText(description.en, raw.description) },
    // Exact names as saved (no fallback): the edit form must not copy the Arabic name into the English field.
    translations: { ar: { name: name.ar, description: description.ar }, en: { name: name.en, description: description.en } },
    is_active: toBool(raw.is_active),
    created_at: raw.created_at || null,
    updated_at: raw.updated_at || null,
  };
};

export const toArea = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...base(raw),
    city_id: toId(raw.city_id ?? raw.city?.id),
    city: raw.city && typeof raw.city === 'object' ? toCityShallow(raw.city) : null,
  };
};

// A city inside an area / branch (no nested areas, to avoid cycles).
const toCityShallow = (raw = {}) => ({ ...base(raw) });

export const toCity = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const areas = Array.isArray(raw.areas) ? raw.areas.map(toArea).filter(Boolean) : null;
  return {
    ...base(raw),
    // null = the list did not include the areas (unknown), [] = the city really has none.
    areas,
    areas_count: areas ? areas.length : (Number.isFinite(Number(raw.areas_count)) ? Number(raw.areas_count) : null),
  };
};

export const toBranch = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...base(raw),
    city_id: toId(raw.city_id ?? raw.city?.id),
    area_id: toId(raw.area_id ?? raw.area?.id),
    city: raw.city && typeof raw.city === 'object' ? toCityShallow(raw.city) : null,
    area: raw.area && typeof raw.area === 'object' ? toArea(raw.area) : null,
    lat: toCoordinate(raw.lat ?? raw.latitude),
    lang: toCoordinate(raw.lang ?? raw.lng ?? raw.longitude),
  };
};

// ---- Forms ---------------------------------------------------------------------------------------------------------

const emptyText = { name_ar: '', name_en: '', description_ar: '', description_en: '', is_active: true };

export const emptyCityForm = () => ({ ...emptyText });
export const emptyAreaForm = (cityId = '') => ({ ...emptyText, city_id: cityId || '' });
export const emptyBranchForm = () => ({ ...emptyText, city_id: '', area_id: '', lat: '', lang: '' });

const textForm = (item) => ({
  name_ar: item?.translations?.ar?.name || '',
  name_en: item?.translations?.en?.name || '',
  description_ar: item?.translations?.ar?.description || '',
  description_en: item?.translations?.en?.description || '',
  is_active: item ? item.is_active !== false : true,
});

export const cityFormFrom = (city) => textForm(city);
export const areaFormFrom = (area) => ({ ...textForm(area), city_id: area?.city_id || '' });
export const branchFormFrom = (branch) => ({
  ...textForm(branch),
  city_id: branch?.city_id || '',
  area_id: branch?.area_id || '',
  lat: branch?.lat ?? '',
  lang: branch?.lang ?? '',
});

const textPayload = (form) => ({
  name_ar: text(form.name_ar),
  name_en: text(form.name_en),
  // Blank descriptions are sent as null so an edit can clear them.
  description_ar: text(form.description_ar) || null,
  description_en: text(form.description_en) || null,
  is_active: form.is_active !== false,
});

export const toCityPayload = (form = {}) => textPayload(form);
export const toAreaPayload = (form = {}) => ({ city_id: toId(form.city_id), ...textPayload(form) });
export const toBranchPayload = (form = {}) => ({
  city_id: toId(form.city_id),
  area_id: toId(form.area_id),
  ...textPayload(form),
  lat: toCoordinate(form.lat),
  lang: toCoordinate(form.lang),
});

// ---- Validation (same rules as the API's form requests) --------------------------------------------------------------

const MAX_NAME = 255;

const validateText = (form, errors) => {
  if (!text(form.name_ar)) errors.name_ar = 'required';
  else if (text(form.name_ar).length > MAX_NAME) errors.name_ar = 'too_long';
  if (!text(form.name_en)) errors.name_en = 'required';
  else if (text(form.name_en).length > MAX_NAME) errors.name_en = 'too_long';
  else if (hasArabicLetters(form.name_en)) errors.name_en = 'arabic_in_english';
  if (hasArabicLetters(form.description_en)) errors.description_en = 'arabic_in_english';
  return errors;
};

/** {} when valid, otherwise { field: reason } with reason in required | too_long | arabic_in_english | out_of_range | invalid | mismatch. */
export const validateCityForm = (form = {}) => validateText(form, {});

export const validateAreaForm = (form = {}) => {
  const errors = validateText(form, {});
  if (!toId(form.city_id)) errors.city_id = 'required';
  return errors;
};

/**
 * `areas` (optional) is the list of known areas: when given, the chosen area must belong to the chosen city
 * (the API rejects a mismatch, so the form says it first).
 */
export const validateBranchForm = (form = {}, areas = null) => {
  const errors = validateText(form, {});
  const cityId = toId(form.city_id);
  const areaId = toId(form.area_id);
  if (!cityId) errors.city_id = 'required';
  if (!areaId) errors.area_id = 'required';
  else if (cityId && Array.isArray(areas)) {
    const area = areas.find((item) => item.id === areaId);
    if (area && area.city_id && area.city_id !== cityId) errors.area_id = 'mismatch';
  }
  const lat = text(form.lat);
  const lang = text(form.lang);
  if (lat) {
    const value = toCoordinate(lat);
    if (value === null) errors.lat = 'invalid';
    else if (value < -90 || value > 90) errors.lat = 'out_of_range';
  }
  if (lang) {
    const value = toCoordinate(lang);
    if (value === null) errors.lang = 'invalid';
    else if (value < -180 || value > 180) errors.lang = 'out_of_range';
  }
  // A map pin needs both numbers.
  if (lat && !lang && !errors.lat) errors.lang = 'required';
  if (lang && !lat && !errors.lang) errors.lat = 'required';
  return errors;
};

// ---- Lists ---------------------------------------------------------------------------------------------------------

const normalize = (value) => text(value).toLowerCase();

/** Rows whose Arabic or English name / description (or their city / area name) contain `query`. */
export const matchesSearch = (item, query) => {
  const q = normalize(query);
  if (!q) return true;
  const fields = [
    item?.name, item?.name_i18n?.ar, item?.name_i18n?.en,
    item?.description_i18n?.ar, item?.description_i18n?.en,
    item?.city?.name_i18n?.ar, item?.city?.name_i18n?.en,
    item?.area?.name_i18n?.ar, item?.area?.name_i18n?.en,
  ];
  return fields.some((field) => normalize(field).includes(q));
};

/** status: '' | 'active' | 'inactive'; cityId / areaId: '' for all. */
export const filterLocations = (items = [], { query = '', status = '', cityId = '', areaId = '' } = {}) => items.filter((item) => {
  if (status === 'active' && !item.is_active) return false;
  if (status === 'inactive' && item.is_active) return false;
  if (toId(cityId) && item.city_id !== toId(cityId)) return false;
  if (toId(areaId) && item.area_id !== toId(areaId)) return false;
  return matchesSearch(item, query);
});

export const sortByName = (items = [], lang = 'ar') => [...items].sort((a, b) => (
  localizedName(a, lang).localeCompare(localizedName(b, lang), lang === 'en' ? 'en' : 'ar') || (a.id || 0) - (b.id || 0)
));

/** Areas of one city (all of them when cityId is blank). */
export const areasOfCity = (areas = [], cityId) => (toId(cityId) ? areas.filter((area) => area.city_id === toId(cityId)) : areas);

/** { [cityId]: count } from the areas list (used when the cities list has no nested areas). */
export const countByCity = (items = []) => items.reduce((counts, item) => {
  if (item?.city_id) counts[item.city_id] = (counts[item.city_id] || 0) + 1;
  return counts;
}, {});

/** { [areaId]: count } (branches per area). */
export const countByArea = (items = []) => items.reduce((counts, item) => {
  if (item?.area_id) counts[item.area_id] = (counts[item.area_id] || 0) + 1;
  return counts;
}, {});

const COUNTED = {
  area: { ar: ['لا مناطق', 'منطقة واحدة', 'منطقتان', 'مناطق', 'منطقة'], en: ['area', 'areas'] },
  branch: { ar: ['لا فروع', 'فرع واحد', 'فرعان', 'فروع', 'فرعًا'], en: ['branch', 'branches'] },
};
/** "منطقتان" / "3 فروع" / "11 فرعًا" / "2 areas": counted nouns with Arabic number agreement. */
export const countLabel = (count, noun, lang = 'ar') => {
  const n = Number(count) || 0;
  const forms = COUNTED[noun];
  if (lang === 'en') return `${n} ${n === 1 ? forms.en[0] : forms.en[1]}`;
  if (n === 0) return forms.ar[0];
  if (n === 1) return forms.ar[1];
  if (n === 2) return forms.ar[2];
  return n <= 10 ? `${n} ${forms.ar[3]}` : `${n} ${forms.ar[4]}`;
};

export const locationStats = (items = []) => {
  const active = items.filter((item) => item.is_active).length;
  return { total: items.length, active, inactive: items.length - active };
};

/** A Google Maps link for a branch pin, or '' when it has none. */
export const mapLink = (branch) => {
  const lat = toCoordinate(branch?.lat);
  const lang = toCoordinate(branch?.lang);
  if (lat === null || lang === null) return '';
  return `https://www.google.com/maps?q=${lat},${lang}`;
};

/**
 * Reads a map pin out of pasted text: "24.7136, 46.6753", a Google Maps link (…/@24.7136,46.6753,15z or ?q=24.7,46.6
 * or !3d24.7!4d46.6). Returns { lat, lang } inside the valid ranges, or null.
 */
export const parsePin = (input) => {
  const value = text(input);
  if (!value) return null;
  const number = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const patterns = [
    new RegExp(`!3d${number}!4d${number}`),
    new RegExp(`@${number},\\s*${number}`),
    new RegExp(`[?&](?:q|query|ll|destination)=${number}\\s*,\\s*${number}`),
    new RegExp(`^${number}\\s*[,\\s]\\s*${number}$`),
  ];
  for (const pattern of patterns) {
    const match = value.replace(/%2C/gi, ',').match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lang = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lang) && Math.abs(lat) <= 90 && Math.abs(lang) <= 180) return { lat, lang };
    }
  }
  return null;
};

/** Short "24.7136, 46.6753" text for a pin, or '' when there is none. */
export const formatCoordinates = (branch) => {
  const lat = toCoordinate(branch?.lat);
  const lang = toCoordinate(branch?.lang);
  if (lat === null || lang === null) return '';
  const short = (value) => String(Math.round(value * 1e6) / 1e6);
  return `${short(lat)}, ${short(lang)}`;
};

/** The is_active value after a toggle-status call: the server answer when it has one, else the flipped value. */
export const toggledActive = (response, previous) => {
  const body = response?.data ?? response;
  const fromServer = body?.is_active ?? body?.data?.is_active;
  return fromServer === undefined || fromServer === null ? !previous : toBool(fromServer);
};
