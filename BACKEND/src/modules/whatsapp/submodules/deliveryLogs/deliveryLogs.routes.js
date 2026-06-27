/**
 * WhatsApp Delivery Logs — routes.
 *
 * Mounted at: whatsappRouter.use('/delivery-logs', deliveryLogsRoutes)
 * → all endpoints live under /api/whatsapp/delivery-logs/...
 *
 * Order matters:
 *   1. /webhook  and  /stats  (static — declared BEFORE /:id)
 *   2. collection  /
 *   3. resource    /:id  and  /:id/...
 */
import { Router } from 'express';
import { authenticate } from '../../../../shared/middlewares/auth.middleware.js';
import { requireRole }  from '../../../../shared/middlewares/role.middleware.js';
import { withContext }  from '../../../../shared/helpers/lead.helpers.js';
import { ROLE_MIN }     from './deliveryLogs.constants.js';
import { deliveryLogsController } from './deliveryLogs.controller.js';
import {
  validateCreateLog,
  validateListLogs,
  validateIdParam,
  validateUpdateStatus,
  validateWebhook,
  validateStats,
} from './deliveryLogs.validator.js';

const router = Router();

// ── Provider webhook (NO auth — verify provider signature in production) ──────
router.post('/webhook',
  validateWebhook,
  deliveryLogsController.webhook,
);

// withContext for the authenticated routes below.
router.use(withContext);

// ── Static authenticated routes (before /:id) ─────────────────────────────────
router.get('/stats',
  authenticate, requireRole(ROLE_MIN.STATS),
  validateStats, deliveryLogsController.stats,
);

// ── Collection ─────────────────────────────────────────────────────────────────
router.post('/',
  authenticate, requireRole(ROLE_MIN.CREATE),
  validateCreateLog, deliveryLogsController.create,
);

router.get('/',
  authenticate, requireRole(ROLE_MIN.READ),
  validateListLogs, deliveryLogsController.list,
);

// ── Resource (:id) ─────────────────────────────────────────────────────────────
router.get('/:id',
  authenticate, requireRole(ROLE_MIN.READ),
  validateIdParam, deliveryLogsController.get,
);

router.patch('/:id/status',
  authenticate, requireRole(ROLE_MIN.UPDATE_STATUS),
  validateUpdateStatus, deliveryLogsController.updateStatus,
);

router.post('/:id/retry',
  authenticate, requireRole(ROLE_MIN.RETRY),
  validateIdParam, deliveryLogsController.retry,
);

export default router;
