import { activityRepository } from './activity.repository.js';
import { ACTIVITY_TYPE } from './activity.model.js';

/**
 * Activity timeline service. Other modules call `log()` whenever a lead
 * changes; the drawer/timeline endpoints call `getTimeline()`.
 */
export const activityService = {
  ACTIVITY_TYPE,

  /** Record a timeline event. Never throws into the caller's main flow. */
  async log(ctx, leadId, type, { message = '', meta = {} } = {}) {
    return activityRepository.create({
      tenant_id: ctx.tenantId,
      lead_id: leadId,
      type,
      message,
      meta,
      actor: ctx.userId,
    });
  },

  async getTimeline(ctx, leadId) {
    return activityRepository.findByLead(ctx.tenantId, leadId);
  },

  /**
   * Record an activity for a non-lead entity (e.g. a WhatsApp template).
   * Tenant-scoped; never throws into the caller's main flow.
   */
  async logEntity(ctx, { entityType, entityId, leadId = null }, type, { message = '', meta = {} } = {}) {
    return activityRepository.create({
      tenant_id: ctx.tenantId,
      lead_id: leadId,
      entity_type: entityType,
      entity_id: entityId != null ? String(entityId) : null,
      type,
      message,
      meta,
      actor: ctx.userId,
    });
  },

  async count(ctx, leadId) {
    return activityRepository.countByLead(ctx.tenantId, leadId);
  },
};
