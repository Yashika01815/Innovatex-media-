/**
 * Reports controller — thin HTTP layer only.
 *
 * FILE: src/modules/reports/report.controller.js
 *
 * ENDPOINTS (9 tabs, MASTER_SPEC.md §B13):
 *   GET /api/reports/lead
 *   GET /api/reports/pipeline
 *   GET /api/reports/attribution
 *   GET /api/reports/whatsapp
 *   GET /api/reports/campaign
 *   GET /api/reports/revenue
 *   GET /api/reports/sales-activity
 *   GET /api/reports/nurture
 *   GET /api/reports/ai-qualification
 *   GET /api/reports/export?tab=<tab>   — CSV export data (flat JSON rows)
 */

import * as reportService from './report.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getLeadReport = asyncHandler(async (req, res) => {
  const data = await reportService.getLeadReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'Lead report fetched successfully');
});

export const getPipelineReport = asyncHandler(async (req, res) => {
  const data = await reportService.getPipelineReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'Pipeline report fetched successfully');
});

export const getAttributionReport = asyncHandler(async (req, res) => {
  const data = await reportService.getAttributionReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'Attribution report fetched successfully');
});

export const getWhatsAppReport = asyncHandler(async (req, res) => {
  const data = await reportService.getWhatsAppReport(req.user, req.query);
  return sendSuccess(res, data, 'WhatsApp report fetched successfully');
});

export const getCampaignReport = asyncHandler(async (req, res) => {
  const data = await reportService.getCampaignReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'Campaign report fetched successfully');
});

export const getRevenueReport = asyncHandler(async (req, res) => {
  const data = await reportService.getRevenueReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'Revenue report fetched successfully');
});

export const getSalesActivityReport = asyncHandler(async (req, res) => {
  const data = await reportService.getSalesActivityReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'Sales activity report fetched successfully');
});

export const getNurtureReport = asyncHandler(async (req, res) => {
  const data = await reportService.getNurtureReport(req.user);
  return sendSuccess(res, data, 'Nurture report fetched successfully');
});

export const getAiQualificationReport = asyncHandler(async (req, res) => {
  const data = await reportService.getAiQualificationReport(req.user.tenantId, req.query);
  return sendSuccess(res, data, 'AI qualification report fetched successfully');
});

/**
 * exportReport — GET /api/reports/export?tab=<tab>
 * Returns flat rows as JSON for the frontend to convert to CSV — same
 * convention as attribution.controller.exportCsv.
 */
export const exportReport = asyncHandler(async (req, res) => {
  const { tab } = req.query;
  const rows = await reportService.getExportData(req.user.tenantId, req.user, tab, req.query);
  return sendSuccess(res, rows, 'Export data fetched');
});
