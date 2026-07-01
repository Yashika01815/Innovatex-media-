/**
 * WhatsApp AI Reply Assistant — controller.
 *
 * Thin HTTP layer. All business logic lives in aiReplyAssistantService.
 * Follows the exact buildCtx + sendSuccess/sendCreated/sendPaginated pattern
 * used by campaigns.controller.js and templateApproval.controller.js.
 */
import asyncHandler from '../../../../utils/asyncHandler.js';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../../../utils/responses.js';
import { aiReplyAssistantService } from './aiReplyAssistant.service.js';

/**
 * Resolve request context.
 * Priority (matches getContext in lead.helpers.js so tenantId is consistent):
 *   1. req.user from JWT (authenticate middleware)
 *   2. x-tenant-id / x-user-id / x-user-role headers (dev / withContext)
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
  return {
    tenantId: req.context?.tenantId || req.header('x-tenant-id') || DEFAULT_TENANT_ID,
    userId:   req.context?.userId   || req.header('x-user-id')   || null,
    role:     req.context?.role     || req.header('x-user-role') || 'tenant_owner',
  };
}

export const aiReplyAssistantController = {
  // ── Prompt CRUD ─────────────────────────────────────────────────────────────

  // POST /api/whatsapp/ai/prompts
  createPrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.createPrompt(buildCtx(req), req.body);
    return sendCreated(res, prompt, 'Prompt created');
  }),

  // GET /api/whatsapp/ai/prompts
  listPrompts: asyncHandler(async (req, res) => {
    const { data, pagination } = await aiReplyAssistantService.listPrompts(buildCtx(req), req.query);
    return sendPaginated(res, data, pagination);
  }),

  // GET /api/whatsapp/ai/prompts/:id
  getPrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.getPrompt(buildCtx(req), req.params.id);
    return sendSuccess(res, prompt);
  }),

  // PATCH /api/whatsapp/ai/prompts/:id
  updatePrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.updatePrompt(buildCtx(req), req.params.id, req.body);
    return sendSuccess(res, prompt, 'Prompt updated');
  }),

  // DELETE /api/whatsapp/ai/prompts/:id
  deletePrompt: asyncHandler(async (req, res) => {
    const result = await aiReplyAssistantService.deletePrompt(buildCtx(req), req.params.id);
    return sendSuccess(res, result, 'Prompt deleted');
  }),

  // POST /api/whatsapp/ai/prompts/:id/duplicate
  duplicatePrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.duplicatePrompt(buildCtx(req), req.params.id);
    return sendCreated(res, prompt, 'Prompt duplicated');
  }),

  // POST /api/whatsapp/ai/prompts/:id/toggle
  togglePrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.togglePrompt(buildCtx(req), req.params.id);
    return sendSuccess(res, prompt, `Prompt ${prompt.isActive ? 'activated' : 'deactivated'}`);
  }),

  // POST /api/whatsapp/ai/prompts/:id/use
  usePrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.usePrompt(buildCtx(req), req.params.id);
    return sendSuccess(res, prompt, 'Usage recorded');
  }),

  // ── AI endpoints ─────────────────────────────────────────────────────────────

  // POST /api/whatsapp/ai/generate
  generate: asyncHandler(async (req, res) => {
    const result = await aiReplyAssistantService.generateReply(buildCtx(req), {
      conversation: req.body.conversation,
      lead:         req.body.lead,
      goal:         req.body.goal,
      tone:         req.body.tone,
      language:     req.body.language,
      variables:    req.body.variables,
    });
    return sendSuccess(res, result, 'Reply generated');
  }),

  // POST /api/whatsapp/ai/rewrite
  rewrite: asyncHandler(async (req, res) => {
    const result = await aiReplyAssistantService.rewriteText(buildCtx(req), {
      text:      req.body.text,
      style:     req.body.style,
      variables: req.body.variables,
    });
    return sendSuccess(res, result, 'Reply rewritten');
  }),

  // POST /api/whatsapp/ai/summarize
  summarize: asyncHandler(async (req, res) => {
    const result = await aiReplyAssistantService.summarizeConversation(buildCtx(req), {
      conversation: req.body.conversation,
      lead:         req.body.lead,
    });
    return sendSuccess(res, result, 'Conversation summarized');
  }),

  // POST /api/whatsapp/ai/suggestions
  suggestions: asyncHandler(async (req, res) => {
    const result = await aiReplyAssistantService.generateSuggestions(buildCtx(req), {
      conversation: req.body.conversation,
      lead:         req.body.lead,
      variables:    req.body.variables,
    });
    return sendSuccess(res, result, 'Suggestions generated');
  }),

  // POST /api/whatsapp/ai/save-template
  saveTemplate: asyncHandler(async (req, res) => {
    const template = await aiReplyAssistantService.saveAsTemplate(buildCtx(req), {
      generatedReply: req.body.generatedReply,
      templateData:   req.body.templateData || {},
    });
    return sendCreated(res, template, 'Template created from AI reply');
  }),

  // POST /api/whatsapp/ai/save-prompt
  savePrompt: asyncHandler(async (req, res) => {
    const prompt = await aiReplyAssistantService.saveAsPrompt(buildCtx(req), {
      text:         req.body.text,
      title:        req.body.title,
      category:     req.body.category,
      tone:         req.body.tone,
      languageCode: req.body.languageCode,
      description:  req.body.description,
    });
    return sendCreated(res, prompt, 'Prompt saved');
  }),
};
