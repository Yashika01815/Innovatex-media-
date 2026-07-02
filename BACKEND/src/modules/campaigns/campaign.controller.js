/**
 * Campaign controller — thin HTTP layer only.
 *
 * FILE: src/modules/campaigns/campaign.controller.js
 * Pattern matches booking.controller.js and call.controller.js exactly.
 *
 * ENDPOINTS:
 *   GET  /api/campaigns/kpis              — 4 KPI cards
 *   GET  /api/campaigns/chart             — Revenue by Campaign bar chart
 *   GET  /api/campaigns/export            — CSV export
 *   GET  /api/campaigns                   — paginated campaign list
 *   POST /api/campaigns                   — create new campaign
 *   GET  /api/campaigns/:id               — single campaign
 *   PATCH /api/campaigns/:id              — update campaign
 *   DELETE /api/campaigns/:id             — delete campaign
 *   POST /api/campaigns/:id/regenerate-link — regenerate UTM link
 */

import * as campaignService from './campaign.service.js';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * getKpis — GET /api/campaigns/kpis
 * SOURCE: FRONTEND_SPEC §12 KPI row:
 *   Campaigns (8) | Total Spend (49.6K) | Total Revenue (479K) | Blended ROAS (9.7x)
 */
export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await campaignService.getKpiSummary(req.user.tenantId);
  return sendSuccess(res, kpis, 'Campaign KPIs fetched');
});

/**
 * getChartData — GET /api/campaigns/chart
 * SOURCE: FRONTEND_SPEC §12 "Revenue by Campaign" bar chart
 * Returns: [{ campaign_name, revenue, spend, leads_generated, bookings, status }]
 */
export const getChartData = asyncHandler(async (req, res) => {
  const data = await campaignService.getRevenueByCampaign(req.user.tenantId);
  return sendSuccess(res, data, 'Campaign chart data fetched');
});

/**
 * exportCsv — GET /api/campaigns/export
 * SOURCE: MASTER_SPEC §B11 "CSV" + FRONTEND_SPEC §12 "Export" button
 */
export const exportCsv = asyncHandler(async (req, res) => {
  const rows = await campaignService.getExportData(req.user.tenantId);
  return sendSuccess(res, rows, 'Campaign export data fetched');
});

/**
 * getCampaigns — GET /api/campaigns
 * Returns paginated campaign list for the All Campaigns table.
 * SOURCE: FRONTEND_SPEC §12 "All Campaigns" table
 */
export const getCampaigns = asyncHandler(async (req, res) => {
  const filter = {
    status:        req.query.status,
    source:        req.query.source,
    campaign_type: req.query.campaign_type,
  };
  const options = {
    page:  parseInt(req.query.page)  || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await campaignService.getCampaigns(
    req.user.tenantId,
    filter,
    options
  );

  return sendPaginated(
    res,
    result.campaigns,
    result.pagination,
    'Campaigns fetched successfully'
  );
});

/**
 * getCampaign — GET /api/campaigns/:id
 */
export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(
    req.user.tenantId,
    req.params.id
  );
  return sendSuccess(res, { campaign }, 'Campaign fetched successfully');
});

/**
 * createCampaign — POST /api/campaigns
 * Creates campaign + auto-generates UTM tracking link.
 * SOURCE: FRONTEND_SPEC §12 "+ New Campaign" button → modal
 * Modal fields: Campaign Name | Source | Type | Medium | Budget
 */
export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign(req.body, req.user);
  return sendCreated(res, { campaign }, 'Campaign created successfully');
});

/**
 * updateCampaign — PATCH /api/campaigns/:id
 * Update campaign fields including status changes.
 */
export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaign(
    req.user.tenantId,
    req.params.id,
    req.body,
    req.user
  );
  return sendSuccess(res, { campaign }, 'Campaign updated successfully');
});

/**
 * deleteCampaign — DELETE /api/campaigns/:id
 */
export const deleteCampaign = asyncHandler(async (req, res) => {
  await campaignService.deleteCampaign(
    req.user.tenantId,
    req.params.id,
    req.user
  );
  return sendNoContent(res);
});

/**
 * regenerateLink — POST /api/campaigns/:id/regenerate-link
 * Regenerates the UTM tracking link.
 * SOURCE: FRONTEND_SPEC §12 LINK column — copy icon
 * SOURCE: MASTER_SPEC §B11 "UTM tracking-link generator (copyable)"
 */
export const regenerateLink = asyncHandler(async (req, res) => {
  const campaign = await campaignService.regenerateUtmLink(
    req.user.tenantId,
    req.params.id,
    req.user
  );
  return sendSuccess(res, { campaign }, 'UTM tracking link regenerated');
});