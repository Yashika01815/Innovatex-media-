/**
 * WhatsApp AI Reply Assistant — routes.
 *
 * Mounted at: whatsappRouter.use('/ai', aiReplyAssistantRoutes)
 * → all endpoints live under /api/whatsapp/ai/...
 *
 * Static AI endpoints declared BEFORE /:id prompt routes
 * to avoid Express treating path segments as :id params.
 */
import { Router } from 'express';
import { authenticate } from '../../../../shared/middlewares/auth.middleware.js';
import { requireRole }  from '../../../../shared/middlewares/role.middleware.js';
import { withContext }  from '../../../../shared/helpers/lead.helpers.js';
import { ROLE_MIN }     from './aiReplyAssistant.constants.js';
import { aiReplyAssistantController } from './aiReplyAssistant.controller.js';
import {
  validateCreatePrompt,
  validateUpdatePrompt,
  validateListPrompts,
  validateIdParam,
  validateGenerate,
  validateRewrite,
  validateSummarize,
  validateSuggestions,
  validateSaveTemplate,
  validateSavePrompt,
} from './aiReplyAssistant.validator.js';

const router = Router();

// Apply withContext so tenantId is available to buildCtx from headers too.
router.use(withContext);

// ── Static AI generation endpoints (declared BEFORE /prompts/:id) ─────────────

router.post('/generate',
  authenticate, requireRole(ROLE_MIN.GENERATE),
  validateGenerate, aiReplyAssistantController.generate,
);

router.post('/rewrite',
  authenticate, requireRole(ROLE_MIN.REWRITE),
  validateRewrite, aiReplyAssistantController.rewrite,
);

router.post('/summarize',
  authenticate, requireRole(ROLE_MIN.SUMMARIZE),
  validateSummarize, aiReplyAssistantController.summarize,
);

router.post('/suggestions',
  authenticate, requireRole(ROLE_MIN.SUGGESTIONS),
  validateSuggestions, aiReplyAssistantController.suggestions,
);

router.post('/save-template',
  authenticate, requireRole(ROLE_MIN.SAVE_TEMPLATE),
  validateSaveTemplate, aiReplyAssistantController.saveTemplate,
);

router.post('/save-prompt',
  authenticate, requireRole(ROLE_MIN.SAVE_PROMPT),
  validateSavePrompt, aiReplyAssistantController.savePrompt,
);

// ── Prompt collection routes ───────────────────────────────────────────────────

router.post('/prompts',
  authenticate, requireRole(ROLE_MIN.CREATE_PROMPT),
  validateCreatePrompt, aiReplyAssistantController.createPrompt,
);

router.get('/prompts',
  authenticate, requireRole(ROLE_MIN.READ_PROMPT),
  validateListPrompts, aiReplyAssistantController.listPrompts,
);

// ── Prompt resource routes (/:id AFTER collection routes) ──────────────────────

router.get('/prompts/:id',
  authenticate, requireRole(ROLE_MIN.READ_PROMPT),
  validateIdParam, aiReplyAssistantController.getPrompt,
);

router.patch('/prompts/:id',
  authenticate, requireRole(ROLE_MIN.UPDATE_PROMPT),
  validateUpdatePrompt, aiReplyAssistantController.updatePrompt,
);

router.delete('/prompts/:id',
  authenticate, requireRole(ROLE_MIN.DELETE_PROMPT),
  validateIdParam, aiReplyAssistantController.deletePrompt,
);

router.post('/prompts/:id/duplicate',
  authenticate, requireRole(ROLE_MIN.CREATE_PROMPT),
  validateIdParam, aiReplyAssistantController.duplicatePrompt,
);

router.post('/prompts/:id/toggle',
  authenticate, requireRole(ROLE_MIN.UPDATE_PROMPT),
  validateIdParam, aiReplyAssistantController.togglePrompt,
);

router.post('/prompts/:id/use',
  authenticate, requireRole(ROLE_MIN.READ_PROMPT),
  validateIdParam, aiReplyAssistantController.usePrompt,
);

export default router;
