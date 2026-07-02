/**
 * WhatsApp Settings — repository.
 *
 * The only layer that touches the WhatsAppSettings collection.
 * Every query is tenant-scoped. No business logic, no formatting,
 * no credential stripping (that happens in the service).
 */
import { WhatsAppSettings } from './whatsappSettings.model.js';

export const whatsappSettingsRepository = {
  create(data) {
    return WhatsAppSettings.create(data);
  },

  findByTenant(tenantId) {
    return WhatsAppSettings.findOne({ tenantId });
  },

  /**
   * Apply a partial update using dot-notation $set so nested sub-objects
   * are merged field-by-field instead of being replaced wholesale.
   */
  update(tenantId, setOps) {
    return WhatsAppSettings.findOneAndUpdate(
      { tenantId },
      { $set: setOps },
      { new: true, runValidators: true },
    );
  },

  /**
   * Upsert — create if missing, otherwise update. Used by create-settings
   * to guarantee a single document per tenant even under race conditions.
   */
  upsert(tenantId, setOnInsert, setOps = {}) {
    return WhatsAppSettings.findOneAndUpdate(
      { tenantId },
      { $setOnInsert: setOnInsert, $set: setOps },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  },

  deleteByTenant(tenantId) {
    return WhatsAppSettings.findOneAndDelete({ tenantId });
  },
};
