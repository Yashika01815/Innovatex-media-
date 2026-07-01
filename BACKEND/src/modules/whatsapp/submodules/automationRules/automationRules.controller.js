/**
 * WhatsApp Automation Rules — controller.
 *
 * Thin HTTP layer. All business logic lives in automationRulesService.
 * Follows the exact buildCtx + response-helper pattern used by
 * campaigns.controller.js and aiReplyAssistant.controller.js.
 */
import asyncHandler from '../../../../utils/asyncHandler.js';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../../../utils/responses.js';
import { automationRulesService } from './automationRules.service.js';

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant_demo';

function buildCtx(req) {
  if (req.user?.tenantId) {
    return {
      tenantId: req.user.tenantId,
      userId:   req.user.sub || req.user.id || req.user._id || null,
      role:     req.user.role || null,
    };
  }
  return {
    tenantId: req.context?.tenantId || req.header('x-tenant-id') || DEFAULT_TENANT_ID,
    userId:   req.context?.userId   || req.header('x-user-id')   || null,
    role:     req.context?.role     || req.header('x-user-role') || 'tenant_owner',
  };
}

export const automationRulesController = {
  // POST /api/whatsapp/automation-rules
  create: asyncHandler(async (req, res) => {
    const rule = await automationRulesService.createRule(buildCtx(req), req.body);
    return sendCreated(res, rule, 'Automation rule created');
  }),

  // GET /api/whatsapp/automation-rules
  list: asyncHandler(async (req, res) => {
    const { data, pagination } = await automationRulesService.listRules(buildCtx(req), req.query);
    return sendPaginated(res, data, pagination);
  }),

  // GET /api/whatsapp/automation-rules/:id
  get: asyncHandler(async (req, res) => {
    const rule = await automationRulesService.getRule(buildCtx(req), req.params.id);
    return sendSuccess(res, rule);
  }),

  // PATCH /api/whatsapp/automation-rules/:id
  update: asyncHandler(async (req, res) => {
    const rule = await automationRulesService.updateRule(buildCtx(req), req.params.id, req.body);
    return sendSuccess(res, rule, 'Automation rule updated');
  }),

  // DELETE /api/whatsapp/automation-rules/:id
  remove: asyncHandler(async (req, res) => {
    const result = await automationRulesService.deleteRule(buildCtx(req), req.params.id);
    return sendSuccess(res, result, 'Automation rule deleted');
  }),

  // POST /api/whatsapp/automation-rules/:id/duplicate
  duplicate: asyncHandler(async (req, res) => {
    const rule = await automationRulesService.duplicateRule(buildCtx(req), req.params.id);
    return sendCreated(res, rule, 'Automation rule duplicated');
  }),

  // POST /api/whatsapp/automation-rules/:id/toggle
  toggle: asyncHandler(async (req, res) => {
    const rule = await automationRulesService.toggleRule(buildCtx(req), req.params.id);
    return sendSuccess(res, rule, `Automation rule ${rule.status === 'ACTIVE' ? 'activated' : 'paused'}`);
  }),

  // POST /api/whatsapp/automation-rules/:id/run
  run: asyncHandler(async (req, res) => {
    const result = await automationRulesService.runRule(buildCtx(req), req.params.id, req.body);
    return sendSuccess(res, result, 'Automation rule executed');
  }),

  // GET /api/whatsapp/automation-rules/:id/history
  history: asyncHandler(async (req, res) => {
    const { data, pagination } = await automationRulesService.getHistory(buildCtx(req), req.params.id, req.query);
    return sendPaginated(res, data, pagination);
  }),
};
