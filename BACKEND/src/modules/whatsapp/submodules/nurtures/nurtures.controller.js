/**
 * WhatsApp Nurtures — controller.
 * Thin HTTP layer. All business logic lives in nurturesService.
 */
import asyncHandler from '../../../../utils/asyncHandler.js';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../../../utils/responses.js';
import { nurturesService } from './nurtures.service.js';

function buildCtx(req) {
  const user     = req.user    || {};
  const fallback = req.context || {};
  const tenantId = user.tenantId || fallback.tenantId;
  if (!tenantId) throw new AppError(401, 'Missing tenant context');
  return {
    tenantId,
    userId: user.sub || user.id || user._id || fallback.userId || null,
    role:   user.role || fallback.role || null,
  };
}

export const nurturesController = {
  // ── Sequence ─────────────────────────────────────────────────────────────

  // POST /api/whatsapp/nurtures
  create: asyncHandler(async (req, res) => {
    const sequence = await nurturesService.createSequence(buildCtx(req), req.body);
    return sendCreated(res, sequence, 'Nurture sequence created');
  }),

  // GET /api/whatsapp/nurtures
  list: asyncHandler(async (req, res) => {
    const { data, pagination } = await nurturesService.listSequences(buildCtx(req), req.query);
    return sendPaginated(res, data, pagination);
  }),

  // GET /api/whatsapp/nurtures/:id
  get: asyncHandler(async (req, res) => {
    const sequence = await nurturesService.getSequence(buildCtx(req), req.params.id);
    return sendSuccess(res, sequence);
  }),

  // PATCH /api/whatsapp/nurtures/:id
  update: asyncHandler(async (req, res) => {
    const sequence = await nurturesService.updateSequence(buildCtx(req), req.params.id, req.body);
    return sendSuccess(res, sequence, 'Nurture sequence updated');
  }),

  // DELETE /api/whatsapp/nurtures/:id
  remove: asyncHandler(async (req, res) => {
    const result = await nurturesService.deleteSequence(buildCtx(req), req.params.id);
    return sendSuccess(res, result, 'Nurture sequence deleted');
  }),

  // POST /api/whatsapp/nurtures/:id/activate
  activate: asyncHandler(async (req, res) => {
    const sequence = await nurturesService.activateSequence(
      buildCtx(req), req.params.id, { comment: req.body.comment },
    );
    return sendSuccess(res, sequence, 'Nurture sequence activated');
  }),

  // POST /api/whatsapp/nurtures/:id/pause
  pause: asyncHandler(async (req, res) => {
    const sequence = await nurturesService.pauseSequence(
      buildCtx(req), req.params.id, { comment: req.body.comment },
    );
    return sendSuccess(res, sequence, 'Nurture sequence paused');
  }),

  // POST /api/whatsapp/nurtures/:id/archive
  archive: asyncHandler(async (req, res) => {
    const sequence = await nurturesService.archiveSequence(
      buildCtx(req), req.params.id, { comment: req.body.comment },
    );
    return sendSuccess(res, sequence, 'Nurture sequence archived');
  }),

  // ── Enrollment ────────────────────────────────────────────────────────────

  // POST /api/whatsapp/nurtures/:id/enroll
  enroll: asyncHandler(async (req, res) => {
    const enrollment = await nurturesService.enrollLead(
      buildCtx(req), req.params.id,
      { leadId: req.body.leadId, contactId: req.body.contactId },
    );
    return sendCreated(res, enrollment, 'Lead enrolled in nurture sequence');
  }),

  // GET /api/whatsapp/nurtures/enrollments
  listEnrollments: asyncHandler(async (req, res) => {
    const { data, pagination } = await nurturesService.listEnrollments(buildCtx(req), req.query);
    return sendPaginated(res, data, pagination);
  }),

  // GET /api/whatsapp/nurtures/enrollments/:id
  getEnrollment: asyncHandler(async (req, res) => {
    const enrollment = await nurturesService.getEnrollment(buildCtx(req), req.params.id);
    return sendSuccess(res, enrollment);
  }),

  // POST /api/whatsapp/nurtures/enrollments/:id/pause
  pauseEnrollment: asyncHandler(async (req, res) => {
    const enrollment = await nurturesService.pauseEnrollment(
      buildCtx(req), req.params.id, { comment: req.body.comment },
    );
    return sendSuccess(res, enrollment, 'Enrollment paused');
  }),

  // POST /api/whatsapp/nurtures/enrollments/:id/resume
  resumeEnrollment: asyncHandler(async (req, res) => {
    const enrollment = await nurturesService.resumeEnrollment(
      buildCtx(req), req.params.id, { comment: req.body.comment },
    );
    return sendSuccess(res, enrollment, 'Enrollment resumed');
  }),

  // POST /api/whatsapp/nurtures/enrollments/:id/cancel
  cancelEnrollment: asyncHandler(async (req, res) => {
    const enrollment = await nurturesService.cancelEnrollment(
      buildCtx(req), req.params.id, { comment: req.body.comment },
    );
    return sendSuccess(res, enrollment, 'Enrollment cancelled');
  }),
};
