/**
 * Campaign routes.
 *
 * FILE: src/modules/campaigns/campaign.routes.js
 *
 * ROUTE MAP:
 *   GET    /api/campaigns/kpis              — 4 KPI cards
 *   GET    /api/campaigns/chart             — Revenue by Campaign bar chart
 *   GET    /api/campaigns/export            — CSV export
 *   GET    /api/campaigns                   — list (paginated + filtered)
 *   POST   /api/campaigns                   — create new campaign
 *   GET    /api/campaigns/:id               — single campaign
 *   PATCH  /api/campaigns/:id               — update campaign
 *   DELETE /api/campaigns/:id               — delete campaign
 *   POST   /api/campaigns/:id/regenerate-link — regenerate UTM link
 *
 * Register in app.js:
 *   import campaignRoutes from './modules/campaigns/campaign.routes.js';
 *   app.use('/api/campaigns', campaignRoutes);
 */

import { Router } from 'express';
import * as controller from './campaign.controller.js';
import {
  validateCreateCampaign,
  validateUpdateCampaign,
  validateListQuery,
} from './campaign.validator.js';

import { authenticate }  from '../../shared/middlewares/auth.middleware.js';
import { resolveTenant } from '../../shared/middlewares/tenant.middleware.js';
import { requireRole }   from '../../shared/middlewares/role.middleware.js';

const router = Router();

// Auth on ALL campaign routes
router.use(authenticate);
router.use(resolveTenant);

// ── Static routes BEFORE /:id — prevents Express treating "kpis"/"chart"/"export" as :id
router.get('/kpis',   controller.getKpis);
router.get('/chart',  controller.getChartData);
router.get('/export', controller.exportCsv);

// ── Collection routes
router
  .route('/')
  .get(validateListQuery,                               controller.getCampaigns)
  .post(requireRole('tenant_admin'), validateCreateCampaign, controller.createCampaign);

// ── Resource routes
router.get('/:id',    controller.getCampaign);

router.patch(
  '/:id',
  requireRole('tenant_admin'),
  validateUpdateCampaign,
  controller.updateCampaign
);

router.delete(
  '/:id',
  requireRole('tenant_admin'),
  controller.deleteCampaign
);

router.post(
  '/:id/regenerate-link',
  requireRole('tenant_admin'),
  controller.regenerateLink
);

export default router;