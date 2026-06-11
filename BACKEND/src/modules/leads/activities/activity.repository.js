import { LeadActivity } from './activity.model.js';

export const activityRepository = {
  create(data) {
    return LeadActivity.create(data);
  },

  findByLead(tenantId, leadId) {
    return LeadActivity.find({ tenant_id: tenantId, lead_id: leadId }).sort({
      created_at: -1,
    });
  },

  countByLead(tenantId, leadId) {
    return LeadActivity.countDocuments({
      tenant_id: tenantId,
      lead_id: leadId,
    });
  },
};
