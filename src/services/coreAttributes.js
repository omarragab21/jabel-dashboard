// Core product attributes («الخصائص الأساسية»), chosen on the attributes page.
//
// The backend attribute has no "core" field, so the chosen attribute ids are kept
// in the key-value settings API under one row: `core_attribute_ids` (JSON array).
// Until that row is saved, the core attributes are the ones named colour,
// capacity and size (the earlier fixed rule).
import api from '../config/axios';
import { settingsService } from './settingsService';
import { splitCoreAttributes } from '../domain/catalog/adminCatalog';

export const CORE_ATTRIBUTES_KEY = 'core_attribute_ids';

const parseIds = (value) => {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return null; }
  }
  if (!Array.isArray(parsed)) return null;
  return [...new Set(parsed.map((id) => String(id)).filter(Boolean))];
};

const defaultCoreIds = (attributes = []) => splitCoreAttributes(attributes).core.map(({ attribute }) => String(attribute.id));

// The saved ids, or null when nothing was saved yet.
export const loadSavedCoreIds = async () => {
  const rows = await settingsService.getAdminSettings();
  const list = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
  return parseIds(list.find((row) => row?.key === CORE_ATTRIBUTES_KEY)?.value);
};

// The core ids in effect for this list of attributes (ids of deleted attributes are dropped).
export const resolveCoreIds = (savedIds, attributes = []) => {
  const known = new Set(attributes.map((attribute) => String(attribute.id)));
  const ids = savedIds ?? defaultCoreIds(attributes);
  return ids.filter((id) => known.has(id));
};

// Saves only this row: settingsService.bulkUpdate would rewrite other settings too.
export const saveCoreIds = async (ids) => {
  const value = [...new Set(ids.map((id) => String(id)))];
  await api.post('/v1/settings/bulk', {
    settings: [{ key: CORE_ATTRIBUTES_KEY, group: 'general', value, is_active: true }],
  });
  return value;
};

// Core attributes first (in the saved order), then the rest.
export const splitByCoreIds = (attributes = [], coreIds = []) => {
  const byId = new Map(attributes.map((attribute) => [String(attribute.id), attribute]));
  const core = coreIds.map((id) => byId.get(String(id))).filter(Boolean);
  const coreSet = new Set(core);
  return { core, others: attributes.filter((attribute) => !coreSet.has(attribute)) };
};
