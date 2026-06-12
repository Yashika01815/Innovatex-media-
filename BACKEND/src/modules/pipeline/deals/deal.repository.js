import { Deal } from './deal.model.js';

/**
 * Deal Repository — the ONLY layer that touches the Deal collection.
 * No business rules, no events. All queries are tenant-scoped.
 */
export const dealRepository = {
  create(data) {
    return Deal.create(data);
  },

  findById(tenantId, id) {
    return Deal.findOne({ _id: id, tenant_id: tenantId });
  },

  find(tenantId, filter = {}, { sort = { created_at: -1 }, skip = 0, limit = 20 } = {}) {
    return Deal.find({ tenant_id: tenantId, ...filter })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  count(tenantId, filter = {}) {
    return Deal.countDocuments({ tenant_id: tenantId, ...filter });
  },

  findByLead(tenantId, leadId) {
    return Deal.find({ tenant_id: tenantId, lead_id: leadId }).sort({
      created_at: -1,
    });
  },

  updateById(tenantId, id, patch) {
    return Deal.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: patch },
      { new: true, runValidators: true },
    );
  },

  archiveById(tenantId, id) {
    return Deal.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: { archived: true } },
      { new: true },
    );
  },

  /**
   * Per-stage breakdown for analytics + board counts.
   * @returns {Promise<Array<{ _id: string, count: number, value: number }>>}
   */
  stageBreakdown(tenantId) {
    return Deal.aggregate([
      { $match: { tenant_id: tenantId, archived: false } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          value: { $sum: '$value' },
        },
      },
    ]);
  },
};