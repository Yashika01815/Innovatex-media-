import { Lead } from './lead.model.js';

/**
 * Lead Repository — the only place that touches the Lead collection.
 * No business rules, no events. All reads are tenant-scoped.
 */
export const leadRepository = {
  create(data) {
    return Lead.create(data);
  },

  insertMany(docs) {
    return Lead.insertMany(docs);
  },

  findById(tenantId, id) {
    return Lead.findOne({ _id: id, tenant_id: tenantId });
  },

  findOne(tenantId, query = {}) {
    return Lead.findOne({ tenant_id: tenantId, ...query });
  },

  find(tenantId, filter = {}, { sort = { created_at: -1 }, skip = 0, limit = 20 } = {}) {
    return Lead.find({ tenant_id: tenantId, ...filter })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  count(tenantId, filter = {}) {
    return Lead.countDocuments({ tenant_id: tenantId, ...filter });
  },

  updateById(tenantId, id, patch) {
    return Lead.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: patch },
      { new: true, runValidators: true },
    );
  },

  archiveById(tenantId, id) {
    return Lead.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: { archived: true } },
      { new: true },
    );
  },

  findByEmail(tenantId, email) {
    if (!email) return null;
    return Lead.findOne({
      tenant_id: tenantId,
      email: String(email).toLowerCase(),
      archived: false,
    });
  },

  findByPhone(tenantId, phone) {
    if (!phone) return null;
    return Lead.findOne({ tenant_id: tenantId, phone, archived: false });
  },

  /** Aggregate lead counts grouped by owner (for least-loaded assignment). */
  countByOwner(tenantId) {
    return Lead.aggregate([
      { $match: { tenant_id: tenantId, archived: false } },
      { $group: { _id: '$assigned_user_id', count: { $sum: 1 } } },
    ]);
  },
};
