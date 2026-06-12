import { leadRepository } from './lead.repository.js';
import { duplicateService } from '../duplicate-detection/duplicate.service.js';
import { scoringService } from '../../leads/scoring/scoring.service.js'
import { activityService } from '../activities/activity.service.js';
import { ACTIVITY_TYPE } from '../activities/activity.model.js';
import { noteService } from '../notes/note.service.js';
import { recommendationService } from '../ai/recommendation.service.js';
import { buildSearch } from '../../leads/search/search.service.js';
import { leadEvents } from '../../../shared/events/lead.events.js';
import { toLeadDTO, toLeadListDTOs } from '../../../shared/mappers/lead.mappers.js';
import { AppError, paginationMeta } from '../../../shared/helpers/lead.helpers.js';
import { LEAD_STATUS } from './lead.constants.js';

/**
 * Lead Service — business logic + cross-module orchestration.
 * Controllers call this; this calls repositories and sibling services.
 * `ctx` = { tenantId, userId, role }.
 */
export const leadService = {
  // ---- CRUD --------------------------------------------------------------

  async createLead(ctx, data, { skipDuplicateCheck = false } = {}) {
    if (!skipDuplicateCheck) {
      await duplicateService.assertNoDuplicate(ctx.tenantId, {
        email: data.email,
        phone: data.phone,
      });
    }

    // Auto-score on creation.
    const { score, temperature } = scoringService.scoreLead(data);
    const payload = {
      ...data,
      tenant_id: ctx.tenantId,
      qualification_score: data.qualification_score ?? score,
      lead_temperature: data.lead_temperature ?? temperature,
    };

    const lead = await leadRepository.create(payload);

    await activityService.log(ctx, lead._id, ACTIVITY_TYPE.LEAD_CREATED, {
      message: `Lead "${lead.name || lead.email || lead.phone}" created`,
    });

    leadEvents.created({
      tenantId: ctx.tenantId,
      leadId: String(lead._id),
      lead: toLeadDTO(lead),
      actor: ctx.userId,
    });

    return lead;
  },

  async getLead(ctx, id) {
    const lead = await leadRepository.findById(ctx.tenantId, id);
    if (!lead) throw AppError.notFound('Lead not found');
    return lead;
  },

  async getLeads(ctx, query) {
    const { filter, sort, page, limit, skip } = buildSearch(query);

    const [items, total] = await Promise.all([
      leadRepository.find(ctx.tenantId, filter, { sort, skip, limit }),
      leadRepository.count(ctx.tenantId, filter),
    ]);

    return {
      data: toLeadListDTOs(items),
      pagination: paginationMeta({ page, limit, total }),
    };
  },

  async updateLead(ctx, id, patch) {
    const existing = await leadRepository.findById(ctx.tenantId, id);
    if (!existing) throw AppError.notFound('Lead not found');

    // Re-score if a scoring-relevant field changed.
    const merged = { ...existing.toObject(), ...patch };
    if (patch.qualification_score === undefined) {
      const { score, temperature } = scoringService.scoreLead(merged);
      patch.qualification_score = score;
      if (patch.lead_temperature === undefined) {
        patch.lead_temperature = temperature;
      }
    }

    const updated = await leadRepository.updateById(ctx.tenantId, id, patch);

    const fields = Object.keys(patch);

    let activityType = ACTIVITY_TYPE.LEAD_UPDATED;
    let activityMessage = 'Lead updated';

    if (fields.includes('status')) {
      activityType = 'Lead Status Updated';
      activityMessage = `Lead status changed to ${patch.status}`;
    }

    await activityService.log(ctx, id, activityType, {
      message: activityMessage,
      meta: { fields },
    });

    if (
      patch.assigned_user_id !== undefined &&
      patch.assigned_user_id !== existing.assigned_user_id
    ) {
      await activityService.log(ctx, id, ACTIVITY_TYPE.LEAD_ASSIGNED, {
        message: `Lead assigned to ${patch.assigned_user_id || 'unassigned'}`,
        meta: { from: existing.assigned_user_id, to: patch.assigned_user_id },
      });
    }

    if (
      patch.status === LEAD_STATUS.QUALIFIED &&
      existing.status !== LEAD_STATUS.QUALIFIED
    ) {
      await activityService.log(ctx, id, ACTIVITY_TYPE.LEAD_QUALIFIED, {
        message: 'Lead qualified',
      });
    }

    leadEvents.updated({
      tenantId: ctx.tenantId,
      leadId: id,
      lead: toLeadDTO(updated),
      actor: ctx.userId,
      changed: Object.keys(patch),
    });

    return updated;
  },

  async archiveLead(ctx, id) {
    const existing = await leadRepository.findById(ctx.tenantId, id);
    if (!existing) throw AppError.notFound('Lead not found');

    const archived = await leadRepository.archiveById(ctx.tenantId, id);

    await activityService.log(ctx, id, ACTIVITY_TYPE.LEAD_ARCHIVED, {
      message: 'Lead archived',
    });

    leadEvents.archived({
      tenantId: ctx.tenantId,
      leadId: id,
      lead: toLeadDTO(archived),
      actor: ctx.userId,
    });

    return archived;
  },

  // ---- Detail drawer -----------------------------------------------------

  async getLeadDetails(ctx, id) {
    const lead = await this.getLead(ctx, id);
    const [notes, timeline, noteCount, activityCount] = await Promise.all([
      noteService.getNotes(ctx, id),
      activityService.getTimeline(ctx, id),
      noteService.count(ctx, id),
      activityService.count(ctx, id),
    ]);

    return {
      lead: toLeadDTO(lead),
      notes,
      timeline,
      recommendation: recommendationService.forLead(lead.toObject()),
      // Linked counts — stubbed until those modules exist.
      counts: {
        deals: 0,
        bookings: 0,
        calls: 0,
        payments: 0,
        notes: noteCount,
        activities: activityCount,
      },
    };
  },
};