/**
 * Dashboard controller — thin HTTP layer only.
 *
 * FILE: src/modules/dashboard/dashboard.controller.js
 * Pattern matches all other controllers exactly.
 */

import * as dashboardService from './dashboard.service.js';
import { sendSuccess }       from '../../utils/apiResponse.js';
import asyncHandler          from '../../utils/asyncHandler.js';

/**
 * getDashboard — GET /api/dashboard
 * Returns everything in one call: kpis + charts + sections.
 * SOURCE: FRONTEND_SPEC §3 — full dashboard page initial load
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user.tenantId);
  return sendSuccess(res, data, 'Dashboard data fetched successfully');
});

/**
 * getKpis — GET /api/dashboard/kpis
 * Returns only the 12 KPI card values (for polling/refresh).
 * SOURCE: FRONTEND_SPEC §3 KPI cards row 1, 2, 3
 */
export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await dashboardService.getKpis(req.user.tenantId);
  return sendSuccess(res, kpis, 'Dashboard KPIs fetched');
});

/**
 * getCharts — GET /api/dashboard/charts
 * Returns all chart datasets.
 * SOURCE: FRONTEND_SPEC §3 Charts section
 */
export const getCharts = asyncHandler(async (req, res) => {
  const charts = await dashboardService.getCharts(req.user.tenantId);
  return sendSuccess(res, charts, 'Dashboard charts fetched');
});

/**
 * getRecentActivity — GET /api/dashboard/activity
 * Returns last 10 tracking events for the activity feed.
 * SOURCE: FRONTEND_SPEC §3 "Recent Activity — Live tracking events"
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await dashboardService.getRecentActivity(req.user.tenantId);
  return sendSuccess(res, activity, 'Recent activity fetched');
});

/**
 * getTopCampaigns — GET /api/dashboard/top-campaigns
 * Returns top 4 campaigns by closed revenue.
 * SOURCE: FRONTEND_SPEC §3 "Top Campaigns — By closed revenue"
 */
export const getTopCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await dashboardService.getTopCampaigns(req.user.tenantId);
  return sendSuccess(res, campaigns, 'Top campaigns fetched');
});

/**
 * getLeakageAlerts — GET /api/dashboard/leakage
 * Returns revenue leakage breakdown.
 * SOURCE: FRONTEND_SPEC §3 "Revenue Leakage Alerts"
 */
export const getLeakageAlerts = asyncHandler(async (req, res) => {
  const leakage = await dashboardService.getLeakageAlerts(req.user.tenantId);
  return sendSuccess(res, leakage, 'Revenue leakage alerts fetched');
});

/**
 * getWeeklyBriefing — GET /api/dashboard/briefing
 * Returns AI-generated weekly briefing text.
 * SOURCE: FRONTEND_SPEC §3 "Weekly AI Briefing"
 */
export const getWeeklyBriefing = asyncHandler(async (req, res) => {
  const briefing = await dashboardService.getWeeklyAiBriefing(req.user.tenantId);
  return sendSuccess(res, briefing, 'Weekly AI briefing fetched');
});