/**
 * WhatsApp Delivery Logs — controller.
 *
 * Thin HTTP layer. All business logic lives in deliveryLogsService.
 * Same buildCtx + response-helper pattern as campaigns / automationRules.
 */
import asyncHandler from '../../../../utils/asyncHandler.js';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../../../utils/responses.js';
import { deliveryLogsService } from './deliveryLogs.service.js';

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

export const deliveryLogsController = {
  // POST /api/whatsapp/delivery-logs
  create: asyncHandler(async (req, res) => {
    const log = await deliveryLogsService.createLog(buildCtx(req), req.body);
    return sendCreated(res, log, 'Delivery log created');
  }),

  // GET /api/whatsapp/delivery-logs
  list: asyncHandler(async (req, res) => {
    const { data, pagination } = await deliveryLogsService.listLogs(buildCtx(req), req.query);
    return sendPaginated(res, data, pagination);
  }),

  // GET /api/whatsapp/delivery-logs/stats
  stats: asyncHandler(async (req, res) => {
    const result = await deliveryLogsService.getStats(buildCtx(req), req.query);
    return sendSuccess(res, result);
  }),

  // GET /api/whatsapp/delivery-logs/:id
  get: asyncHandler(async (req, res) => {
    const log = await deliveryLogsService.getLog(buildCtx(req), req.params.id);
    return sendSuccess(res, log);
  }),

  // PATCH /api/whatsapp/delivery-logs/:id/status
  updateStatus: asyncHandler(async (req, res) => {
    const log = await deliveryLogsService.updateStatus(buildCtx(req), req.params.id, {
      status:        req.body.status,
      failureReason: req.body.failureReason,
      failureCode:   req.body.failureCode,
    });
    return sendSuccess(res, log, 'Delivery status updated');
  }),

  // POST /api/whatsapp/delivery-logs/:id/retry
  retry: asyncHandler(async (req, res) => {
    const log = await deliveryLogsService.retry(buildCtx(req), req.params.id);
    return sendSuccess(res, log, 'Message queued for retry');
  }),

  // POST /api/whatsapp/delivery-logs/webhook  (no auth — provider callback)
  webhook: asyncHandler(async (req, res) => {
    const log = await deliveryLogsService.processWebhook(req.body);
    return sendSuccess(res, log, 'Webhook processed');
  }),
};
