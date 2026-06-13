import { DeliveryLog } from './delivery-log.model.js';

export const deliveryLogRepository = {
  create(data) {
    return DeliveryLog.create(data);
  },

  findByConversation(tenantId, conversationId) {
    return DeliveryLog.find({
      tenant_id: tenantId,
      conversation_id: conversationId,
    }).sort({ created_at: -1 });
  },

  findByMessage(tenantId, messageId) {
    return DeliveryLog.find({ tenant_id: tenantId, message_id: messageId }).sort({
      created_at: -1,
    });
  },

  updateById(tenantId, id, patch) {
    return DeliveryLog.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: patch },
      { new: true },
    );
  },
};
