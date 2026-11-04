import adminCatalogService from '../application/adminCatalogService';
import { toAttributeOptionPayload, toAttributePayload, toAttributeUpdatePayload } from '../domain/catalog/adminCatalog';

export const buildProductAttributePayload = (form) => toAttributePayload(form);

export const productAttributeService = {
  async list() {
    return adminCatalogService.listAttributes();
  },
  async create(form) {
    return adminCatalogService.createAttribute(buildProductAttributePayload(form));
  },
  async update(attributeId, form) {
    return adminCatalogService.updateAttribute(attributeId, toAttributeUpdatePayload(form));
  },
  async delete(attributeId) {
    return adminCatalogService.deleteAttribute(attributeId);
  },
  async createValue(attributeId, value) {
    return adminCatalogService.createAttributeOption(attributeId, toAttributeOptionPayload(value));
  },
  async updateValue(attributeId, valueId, value) {
    return adminCatalogService.updateAttributeOption(attributeId, valueId, toAttributeOptionPayload(value));
  },
  async deleteValue(attributeId, valueId) {
    return adminCatalogService.deleteAttributeOption(attributeId, valueId);
  },
};

export default productAttributeService;
