import { deliveryLogRepository } from './delivery-log.repository.js';

function toDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

export const deliveryLogService = {
  /** Record a delivery-log entry for a message. */
  async record(ctx, data) {
    const log = await deliveryLogRepository.create({
      tenant_id: ctx.tenantId,
      ...data,
    });
    return toDTO(log);
  },

  async getByConversation(ctx, conversationId) {
    const logs = await deliveryLogRepository.findByConversation(
      ctx.tenantId,
      conversationId,
    );
    return logs.map(toDTO);
  },
};
