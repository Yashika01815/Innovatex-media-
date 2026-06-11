import { assignmentRepository } from './assignment.repository.js';
import { leadRepository } from '../lead/lead.repository.js';
import { activityService } from '../activities/activity.service.js';
import { ACTIVITY_TYPE } from '../activities/activity.model.js';
import { leadEvents } from '../../../shared/events/lead.events.js';
import { toLeadDTO } from '../../../shared/mappers/lead.mappers.js';
import { AppError } from '../../../shared/helpers/lead.helpers.js';

async function ensureLead(tenantId, leadId) {
  const lead = await leadRepository.findById(tenantId, leadId);
  if (!lead) throw AppError.notFound('Lead not found');
  return lead;
}

export const assignmentService = {
  async assign(ctx, leadId, userId) {
    if (!userId) throw AppError.badRequest('userId is required');
    await ensureLead(ctx.tenantId, leadId);

    const updated = await assignmentRepository.setOwner(
      ctx.tenantId,
      leadId,
      userId,
    );

    await activityService.log(ctx, leadId, ACTIVITY_TYPE.LEAD_ASSIGNED, {
      message: `Lead assigned to ${userId}`,
      meta: { to: userId },
    });
    leadEvents.assigned({
      tenantId: ctx.tenantId,
      leadId,
      lead: toLeadDTO(updated),
      actor: ctx.userId,
      assignedTo: userId,
    });

    return updated;
  },

  async unassign(ctx, leadId) {
    await ensureLead(ctx.tenantId, leadId);
    const updated = await assignmentRepository.setOwner(
      ctx.tenantId,
      leadId,
      null,
    );
    await activityService.log(ctx, leadId, ACTIVITY_TYPE.LEAD_ASSIGNED, {
      message: 'Lead unassigned',
      meta: { to: null },
    });
    leadEvents.assigned({
      tenantId: ctx.tenantId,
      leadId,
      lead: toLeadDTO(updated),
      actor: ctx.userId,
      assignedTo: null,
    });
    return updated;
  },

  async bulkAssign(ctx, leadIds = [], userId) {
    if (!userId) throw AppError.badRequest('userId is required');
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw AppError.badRequest('leadIds must be a non-empty array');
    }
    const results = [];
    for (const id of leadIds) {
      try {
        const lead = await this.assign(ctx, id, userId);
        results.push({ leadId: id, ok: true, lead: toLeadDTO(lead) });
      } catch (err) {
        results.push({ leadId: id, ok: false, error: err.message });
      }
    }
    return results;
  },

  /** Round-robin / least-loaded auto assignment across a candidate pool. */
  async autoAssign(ctx, leadId, candidates = []) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw AppError.badRequest('candidates must be a non-empty array');
    }
    await ensureLead(ctx.tenantId, leadId);

    const load = await assignmentRepository.loadByOwner(ctx.tenantId);
    // Pick the candidate with the fewest active leads.
    let chosen = candidates[0];
    let min = load[chosen] || 0;
    for (const c of candidates) {
      const count = load[c] || 0;
      if (count < min) {
        min = count;
        chosen = c;
      }
    }
    return this.assign(ctx, leadId, chosen);
  },
};
