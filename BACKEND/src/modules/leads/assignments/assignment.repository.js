import { leadRepository } from '../lead/lead.repository.js';

/**
 * Assignment data access. Reuses the lead repository for writes and an
 * aggregate for load-balancing.
 */
export const assignmentRepository = {
  setOwner(tenantId, leadId, userId) {
    return leadRepository.updateById(tenantId, leadId, {
      assigned_user_id: userId,
    });
  },

  /** Map of userId → active lead count (for least-loaded assignment). */
  async loadByOwner(tenantId) {
    const rows = await leadRepository.countByOwner(tenantId);
    const map = {};
    for (const r of rows) {
      if (r._id) map[r._id] = r.count;
    }
    return map;
  },
};
