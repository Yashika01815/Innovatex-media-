import { LeadNote } from './note.model.js';

export const noteRepository = {
  create(data) {
    return LeadNote.create(data);
  },

  findByLead(tenantId, leadId) {
    return LeadNote.find({ tenant_id: tenantId, lead_id: leadId }).sort({
      created_at: -1,
    });
  },

  countByLead(tenantId, leadId) {
    return LeadNote.countDocuments({ tenant_id: tenantId, lead_id: leadId });
  },
};
