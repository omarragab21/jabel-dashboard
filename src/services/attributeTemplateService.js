// Creates the attributes and values of an attribute template through the normal attribute API.
//
// Nothing is duplicated: an attribute whose name already exists is reused (only its missing values
// are added), and a value whose name already exists is skipped. One failing value never stops the rest.
import productAttributeService from './productAttributeService';
import { loadSavedCoreIds, resolveCoreIds, saveCoreIds } from './coreAttributes';
import { normalizeCatalogSearchText } from '../domain/catalog/adminCatalog';
import { parseTemplateValue } from '../domain/attributeTemplates';

const norm = (value) => normalizeCatalogSearchText(value);

const attributeKeys = (attribute = {}) => [
  attribute.name, attribute.label, attribute.name_ar, attribute.name_en,
  attribute.translations?.ar?.name, attribute.translations?.en?.name,
].map(norm).filter(Boolean);

const valueKeys = (value = {}) => [
  value.name_ar, value.name_en, value.label, value.name, value.translations?.ar?.name, value.translations?.en?.name,
].map(norm).filter(Boolean);

/** How many attributes / values a selection will create, and which attributes already exist. */
export const planTemplate = (template, selection, existing = []) => {
  const plan = { attributes: 0, values: 0, rows: [] };
  template.attributes.forEach((attribute, index) => {
    const choice = selection[index];
    if (!choice?.include) return;
    const [ar, en] = attribute.name;
    const found = existing.find((item) => attributeKeys(item).some((key) => key === norm(ar) || key === norm(en)));
    const known = new Set((found?.values || []).flatMap(valueKeys));
    const wanted = attribute.values.filter((_, valueIndex) => choice.values[valueIndex]);
    const fresh = wanted.filter((raw) => {
      const value = parseTemplateValue(raw);
      return !valueKeys(value).some((key) => known.has(key));
    });
    if (!found) plan.attributes += 1;
    plan.values += fresh.length;
    plan.rows.push({ index, exists: Boolean(found), newValues: fresh.length, skipped: wanted.length - fresh.length });
  });
  return plan;
};

export const applyTemplate = async ({ template, selection, existing = [], onProgress = () => {} }) => {
  const plan = planTemplate(template, selection, existing);
  const total = plan.attributes + plan.values;
  const summary = { createdAttributes: 0, reusedAttributes: 0, createdValues: 0, skippedValues: 0, failures: [], coreFailed: false };
  const coreIds = [];
  const known = [...existing];
  let done = 0;
  const tick = (label) => { done += 1; onProgress({ done, total, label }); };

  for (let index = 0; index < template.attributes.length; index += 1) {
    const attribute = template.attributes[index];
    const choice = selection[index];
    if (!choice?.include) continue;
    const [nameAr, nameEn] = attribute.name;
    let target = known.find((item) => attributeKeys(item).some((key) => key === norm(nameAr) || key === norm(nameEn)));

    if (target) {
      summary.reusedAttributes += 1;
    } else {
      try {
        const created = await productAttributeService.create({
          name_ar: nameAr,
          name_en: nameEn,
          label_ar: `اختر ${nameAr}`,
          label_en: `Select ${nameEn}`,
          type: attribute.type === 'color' ? 'color' : 'text',
          is_active: true,
        });
        target = { id: created?.id, name: nameEn, name_ar: nameAr, name_en: nameEn, values: [] };
        known.push(target);
        summary.createdAttributes += 1;
        tick(nameAr);
      } catch (error) {
        summary.failures.push({ attribute: nameAr, value: '', message: error?.response?.data?.message || error?.message || '' });
        continue; // without the attribute its values cannot be created
      }
    }
    if (choice.core && target?.id) coreIds.push(String(target.id));

    const have = new Set((target.values || []).flatMap(valueKeys));
    for (let valueIndex = 0; valueIndex < attribute.values.length; valueIndex += 1) {
      if (!choice.values[valueIndex]) continue;
      const value = parseTemplateValue(attribute.values[valueIndex]);
      if (valueKeys(value).some((key) => have.has(key))) { summary.skippedValues += 1; continue; }
      try {
        await productAttributeService.createValue(target.id, { name_ar: value.name_ar, name_en: value.name_en, color: value.color });
        valueKeys(value).forEach((key) => have.add(key));
        summary.createdValues += 1;
      } catch (error) {
        summary.failures.push({ attribute: nameAr, value: value.name_ar, message: error?.response?.data?.message || error?.message || '' });
      }
      tick(`${nameAr} › ${value.name_ar}`);
    }
  }

  // The template's main attributes become "core" ones, next to the ones that already are.
  if (coreIds.length) {
    try {
      const current = resolveCoreIds(await loadSavedCoreIds(), known);
      await saveCoreIds([...current, ...coreIds]);
    } catch {
      summary.coreFailed = true;
    }
  }
  return summary;
};
