/**
 * WhatsApp Template Approval — controller.
 *
 * Thin HTTP layer. All business logic lives in templateApprovalService.
 * Follows the same buildCtx + sendSuccess pattern as contacts.controller.js
 * and templates.controller.js.
 */
import asyncHandler from '../../../../utils/asyncHandler.js';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess } from '../../../../utils/responses.js';
import { templateApprovalService } from './templateApproval.service.js';

/**
 * Resolve request context.
 *
 * Priority (mirrors getContext in lead.helpers.js so tenantId always matches
 * what was stored when the template was created):
 *   1. req.user from JWT (authenticate middleware)
 *   2. x-tenant-id / x-user-id / x-user-role headers (dev/testing)
 *   3. DEFAULT_TENANT_ID env fallback
 */
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant_demo';

function buildCtx(req) {
  if (req.user?.tenantId) {
    return {
      tenantId: req.user.tenantId,
      userId:   req.user.sub || req.user.id || req.user._id || null,
      role:     req.user.role || null,
    };
  }
  // Header-based fallback — matches withContext / getContext used by templates module.
  const tenantId = req.header('x-tenant-id') || DEFAULT_TENANT_ID;
  return {
    tenantId,
    userId: req.header('x-user-id') || null,
    role:   req.header('x-user-role') || 'tenant_owner',
  };
}

export const templateApprovalController = {
  // POST /api/whatsapp/templates/:id/submit-review
  submitForReview: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.submitForReview(
      buildCtx(req),
      req.params.id,
      { comment: req.body.comment },
    );
    return sendSuccess(res, template, 'Template submitted for internal review');
  }),

  // POST /api/whatsapp/templates/:id/request-changes
  requestChanges: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.requestChanges(
      buildCtx(req),
      req.params.id,
      { comment: req.body.comment },
    );
    return sendSuccess(res, template, 'Changes requested on template');
  }),

  // POST /api/whatsapp/templates/:id/approve
  approve: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.approveInternally(
      buildCtx(req),
      req.params.id,
      { comment: req.body.comment },
    );
    return sendSuccess(res, template, 'Template internally approved');
  }),

  // POST /api/whatsapp/templates/:id/reject
  reject: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.rejectInternally(
      buildCtx(req),
      req.params.id,
      { comment: req.body.comment },
    );
    return sendSuccess(res, template, 'Template rejected');
  }),

  // POST /api/whatsapp/templates/:id/submit-provider
  submitToProvider: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.submitToProvider(
      buildCtx(req),
      req.params.id,
    );
    return sendSuccess(res, template, 'Template submitted to provider');
  }),

  // GET /api/whatsapp/templates/:id/timeline
  getTimeline: asyncHandler(async (req, res) => {
    const timeline = await templateApprovalService.getTimeline(
      buildCtx(req),
      req.params.id,
    );
    return sendSuccess(res, timeline);
  }),

  // ── Provider webhooks (no user context) ───────────────────────────────
  // POST /api/whatsapp/template-approval/provider/approved
  webhookApproved: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.providerApproved(req.body);
    return sendSuccess(res, template, 'Webhook: template provider-approved');
  }),

  // POST /api/whatsapp/template-approval/provider/rejected
  webhookRejected: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.providerRejected(req.body);
    return sendSuccess(res, template, 'Webhook: template provider-rejected');
  }),

  // POST /api/whatsapp/template-approval/provider/paused
  webhookPaused: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.providerPaused(req.body);
    return sendSuccess(res, template, 'Webhook: template paused');
  }),

  // POST /api/whatsapp/template-approval/provider/disabled
  webhookDisabled: asyncHandler(async (req, res) => {
    const template = await templateApprovalService.providerDisabled(req.body);
    return sendSuccess(res, template, 'Webhook: template disabled');
  }),
};