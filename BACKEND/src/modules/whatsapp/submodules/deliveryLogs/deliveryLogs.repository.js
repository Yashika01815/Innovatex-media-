/**
 * WhatsApp Delivery Logs — repository.
 *
 * Only DB operations. Tenant-scoped. No business logic.
 */
import { DeliveryLog } from './deliveryLogs.model.js';

export const deliveryLogsRepository = {
  createLog(data) {
    return DeliveryLog.create(data);
  },

  findById(tenantId, id) {
    return DeliveryLog.findOne({ _id: id, tenantId });
  },

  findByProviderMessageId(tenantId, providerMessageId) {
    return DeliveryLog.findOne({ tenantId, providerMessageId });
  },

  listLogs(tenantId, filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 20 } = {}) {
    return DeliveryLog.find({ tenantId, ...filter }).sort(sort).skip(skip).limit(limit);
  },

  countLogs(tenantId, filter = {}) {
    return DeliveryLog.countDocuments({ tenantId, ...filter });
  },

  /**
   * Update status + any extra $set fields, and optionally append a webhook event.
   */
  updateStatus(tenantId, id, { set = {}, webhookEvent } = {}) {
    const update = { $set: set };
    if (webhookEvent) update.$push = { webhookEvents: webhookEvent };
    return DeliveryLog.findOneAndUpdate(
      { _id: id, tenantId },
      update,
      { new: true, runValidators: true },
    );
  },

  incrementRetry(tenantId, id, set = {}) {
    return DeliveryLog.findOneAndUpdate(
      { _id: id, tenantId },
      { $inc: { retryCount: 1 }, $set: set },
      { new: true },
    );
  },

  /**
   * Append a webhook event and apply derived field updates atomically.
   */
  applyWebhook(tenantId, id, { set = {}, webhookEvent }) {
    const update = { $set: set };
    if (webhookEvent) update.$push = { webhookEvents: webhookEvent };
    return DeliveryLog.findOneAndUpdate(
      { _id: id, tenantId },
      update,
      { new: true },
    );
  },

  /**
   * Aggregate delivery statistics for a tenant (optionally filtered).
   * Returns a map of status → count.
   */
  async aggregateStats(tenantId, matchFilter = {}) {
    const rows = await DeliveryLog.aggregate([
      { $match: { tenantId, ...matchFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          retrySum: { $sum: '$retryCount' },
        },
      },
    ]);
    return rows;
  },
};
