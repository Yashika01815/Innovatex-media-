/**
 * WhatsApp Analytics — routes.
 *
 * Mounted at: whatsappRouter.use('/analytics', whatsappAnalyticsRoutes)
 * → all endpoints live under /api/whatsapp/analytics/...
 *
 * All endpoints are read-only GETs requiring at least sales_user.
 * Every path is static (no :id), so ordering is not ambiguous, but the more
 * specific paths are listed explicitly for clarity.
 */
import { Router } from 'express';
import { authenticate } from '../../../../shared/middlewares/auth.middleware.js';
import { requireRole }  from '../../../../shared/middlewares/role.middleware.js';
import { withContext }  from '../../../../shared/helpers/lead.helpers.js';
import { ROLE_MIN }     from './whatsappAnalytics.constants.js';
import { whatsappAnalyticsController } from './whatsappAnalytics.controller.js';
import {
  validateAnalyticsQuery,
  validateTrendsQuery,
  validateExportQuery,
} from './whatsappAnalytics.validator.js';

const router = Router();

router.use(withContext);

router.get('/dashboard',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.dashboard,
);

router.get('/messages',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.messages,
);

router.get('/conversations',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.conversations,
);

router.get('/campaigns',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.campaigns,
);

router.get('/broadcasts',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.broadcasts,
);

router.get('/templates',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.templates,
);

router.get('/ai',
  authenticate, requireRole(ROLE_MIN.VIEW),
  whatsappAnalyticsController.ai,
);

router.get('/automations',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.automations,
);

router.get('/nurtures',
  authenticate, requireRole(ROLE_MIN.VIEW),
  whatsappAnalyticsController.nurtures,
);

router.get('/consent',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.consent,
);

router.get('/delivery',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.delivery,
);

router.get('/agents',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateAnalyticsQuery, whatsappAnalyticsController.agents,
);

router.get('/trends',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateTrendsQuery, whatsappAnalyticsController.trends,
);

router.get('/export',
  authenticate, requireRole(ROLE_MIN.VIEW),
  validateExportQuery, whatsappAnalyticsController.export,
);

export default router;
