/**
 * WhatsApp Analytics — controller.
 *
 * Thin HTTP layer. All business logic lives in whatsappAnalyticsService.
 * Uses asyncHandler + sendSuccess, the same buildCtx pattern as every
 * other WhatsApp submodule. The export endpoint streams CSV when requested.
 */
import asyncHandler from '../../../../utils/asyncHandler.js';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess } from '../../../../utils/responses.js';
import { whatsappAnalyticsService } from './whatsappAnalytics.service.js';

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

export const whatsappAnalyticsController = {
  // GET /api/whatsapp/analytics/dashboard
  dashboard: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getDashboard(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/messages
  messages: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getMessageAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/conversations
  conversations: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getConversationAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/campaigns
  campaigns: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getCampaignAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/broadcasts
  broadcasts: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getBroadcastAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/templates
  templates: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getTemplateAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/ai
  ai: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getAIAnalytics(buildCtx(req));
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/automations
  automations: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getAutomationAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/nurtures
  nurtures: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getNurtureAnalytics(buildCtx(req));
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/consent
  consent: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getConsentAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/delivery
  delivery: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getDeliveryAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/agents
  agents: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getAgentAnalytics(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/trends
  trends: asyncHandler(async (req, res) => {
    const data = await whatsappAnalyticsService.getTrends(buildCtx(req), req.query);
    return sendSuccess(res, data, 'Analytics fetched successfully');
  }),

  // GET /api/whatsapp/analytics/export
  export: asyncHandler(async (req, res) => {
    const result = await whatsappAnalyticsService.getExport(buildCtx(req), req.query);
    if (result.format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.content);
    }
    return sendSuccess(res, result.content, 'Analytics fetched successfully');
  }),
};
