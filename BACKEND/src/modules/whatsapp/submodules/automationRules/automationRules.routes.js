/**
 * WhatsApp Automation Rules — routes.
 *
 * Mounted at: whatsappRouter.use('/automation-rules', automationRulesRoutes)
 * → all endpoints live under /api/whatsapp/automation-rules/...
 *
 * Rule: static sub-paths (no :id) declared before /:id resource routes.
 */
import { Router } from 'express';
import { authenticate } from '../../../../shared/middlewares/auth.middleware.js';
import { requireRole }  from '../../../../shared/middlewares/role.middleware.js';
import { withContext }  from '../../../../shared/helpers/lead.helpers.js';
import { ROLE_MIN }     from './automationRules.constants.js';
import { automationRulesController } from './automationRules.controller.js';
import {
  validateCreateRule,
  validateUpdateRule,
  validateListRules,
  validateIdParam,
  validateRun,
} from './automationRules.validator.js';

const router = Router();

// withContext ensures tenantId from headers is available in buildCtx fallback.
router.use(withContext);

// ── Collection routes ──────────────────────────────────────────────────────────
router.post('/',
  authenticate, requireRole(ROLE_MIN.CREATE),
  validateCreateRule, automationRulesController.create,
);

router.get('/',
  authenticate, requireRole(ROLE_MIN.READ),
  validateListRules, automationRulesController.list,
);

// ── Resource routes (:id) ──────────────────────────────────────────────────────
router.get('/:id',
  authenticate, requireRole(ROLE_MIN.READ),
  validateIdParam, automationRulesController.get,
);

router.patch('/:id',
  authenticate, requireRole(ROLE_MIN.UPDATE),
  validateUpdateRule, automationRulesController.update,
);

router.delete('/:id',
  authenticate, requireRole(ROLE_MIN.DELETE),
  validateIdParam, automationRulesController.remove,
);

router.post('/:id/duplicate',
  authenticate, requireRole(ROLE_MIN.CREATE),
  validateIdParam, automationRulesController.duplicate,
);

router.post('/:id/toggle',
  authenticate, requireRole(ROLE_MIN.TOGGLE),
  validateIdParam, automationRulesController.toggle,
);

router.post('/:id/run',
  authenticate, requireRole(ROLE_MIN.RUN),
  validateRun, automationRulesController.run,
);

router.get('/:id/history',
  authenticate, requireRole(ROLE_MIN.HISTORY),
  validateIdParam, automationRulesController.history,
);

export default router;
