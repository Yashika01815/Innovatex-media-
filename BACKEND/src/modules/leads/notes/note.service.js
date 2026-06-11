import { noteRepository } from './note.repository.js';
import { activityService } from '../activities/activity.service.js';
import { ACTIVITY_TYPE } from '../activities/activity.model.js';

/**
 * Notes service. Adding a note also writes a timeline activity so the
 * drawer's "full activity timeline" reflects it.
 */
export const noteService = {
  async addNote(ctx, leadId, text) {
    const note = await noteRepository.create({
      tenant_id: ctx.tenantId,
      lead_id: leadId,
      text,
      author: ctx.userId,
    });

    await activityService.log(ctx, leadId, ACTIVITY_TYPE.NOTE_ADDED, {
      message: 'Note added',
    });

    return note;
  },

  getNotes(ctx, leadId) {
    return noteRepository.findByLead(ctx.tenantId, leadId);
  },

  count(ctx, leadId) {
    return noteRepository.countByLead(ctx.tenantId, leadId);
  },
};
