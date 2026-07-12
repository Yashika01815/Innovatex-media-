/**
 * Dashboard routes.
 *
 * FILE: src/modules/dashboard/dashboard.routes.js
 *
 * ROUTE MAP:
 *   GET /api/dashboard          — full dashboard (all data in one call)
 *   GET /api/dashboard/kpis     — 12 KPI cards only (for refresh)
 *   GET /api/dashboard/charts   — all chart datasets
 *   GET /api/dashboard/activity — recent activity feed
 *   GET /api/dashboard/top-campaigns — top 4 campaigns by revenue
 *   GET /api/dashboard/leakage  — revenue leakage alerts
 *   GET /api/dashboard/briefing — weekly AI briefing
 *
 * Register in app.js:
 *   import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
 *   app.use('/api/dashboard', dashboardRoutes);
 */

import { Router }      from 'express';
import * as controller from './dashboard.controller.js';
import { authenticate }  from '../../shared/middlewares/auth.middleware.js';
import { resolveTenant } from '../../shared/middlewares/tenant.middleware.js';

const router = Router();

// Auth on ALL dashboard routes
router.use(authenticate);
router.use(resolveTenant);

// Full dashboard — single call on page load
router.get('/',               controller.getDashboard);

// Individual endpoints — for refresh/polling
router.get('/kpis',           controller.getKpis);
router.get('/charts',         controller.getCharts);
router.get('/activity',       controller.getRecentActivity);
router.get('/top-campaigns',  controller.getTopCampaigns);
router.get('/leakage',        controller.getLeakageAlerts);
router.get('/briefing',       controller.getWeeklyBriefing);

export default router;