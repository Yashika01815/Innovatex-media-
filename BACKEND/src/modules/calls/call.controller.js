/**
 * Call Intelligence controller — thin HTTP layer only.
 * No business logic. Pattern matches booking.controller.js exactly.
 */

import * as callService from './call.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * getCalls — GET /api/calls
 * Returns paginated call list with filters.
 * Renders call cards on FRONTEND_SPEC §10.
 */
export const getCalls = asyncHandler(async (req, res) => {
  const filter = {
    outcome:          req.query.outcome,
    assigned_user_id: req.query.assigned_user_id,
    date_from:        req.query.date_from,
    date_to:          req.query.date_to,
  };
  const options = {
    page:  parseInt(req.query.page)  || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await callService.getCalls(req.user.tenantId, filter, options);
  return sendPaginated(res, result.calls, result.pagination, 'Calls fetched successfully');
});

/**
 * getKpis — GET /api/calls/kpis
 * Returns { total, proposalsRequested, closedWon, avgCallScore }
 * SOURCE: FRONTEND_SPEC §10 — 4 KPI cards:
 *   Total Calls | Proposals Requested | Closed Won | Avg Call Score
 */
export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await callService.getKpiSummary(req.user.tenantId);
  return sendSuccess(res, kpis, 'KPIs fetched successfully');
});

/**
 * getCall — GET /api/calls/:id
 */
export const getCall = asyncHandler(async (req, res) => {
  const call = await callService.getCallById(req.user.tenantId, req.params.id);
  return sendSuccess(res, { call }, 'Call fetched successfully');
});

/**
 * createCall — POST /api/calls
 * Log Call modal: lead_id, outcome, transcript → save + AI summary.
 * SOURCE: FRONTEND_SPEC §10 "Log Call & Generate AI Summary" modal
 * Triggers: lead→Call Completed, deal→'Call Completed', activity log, notification.
 */
export const createCall = asyncHandler(async (req, res) => {
  const call = await callService.createCall(req.body, req.user);
  return sendCreated(res, { call }, 'Call logged successfully');
});

/**
 * updateCall — PATCH /api/calls/:id
 * Update call fields after creation (manual corrections).
 */
export const updateCall = asyncHandler(async (req, res) => {
  const updated = await callService.updateCall(
    req.user.tenantId,
    req.params.id,
    req.body,
    req.user
  );
  return sendSuccess(res, { call: updated }, 'Call updated successfully');
});

/**
 * regenerateAiSummary — POST /api/calls/:id/ai-summary
 * Re-runs AI on the call transcript to refresh summary, objections, next steps.
 * SOURCE: FRONTEND_SPEC §10 "Generate AI summary" button
 */
export const regenerateAiSummary = asyncHandler(async (req, res) => {
  const updated = await callService.regenerateAiSummary(
    req.user.tenantId,
    req.params.id,
    req.user
  );
  return sendSuccess(res, { call: updated }, 'AI summary generated successfully');
});

/**
 * getCallsByLead — GET /api/calls/lead/:leadId
 * All calls for a specific lead — used in lead detail drawer linked counts.
 * SOURCE: FRONTEND_SPEC §4 lead drawer "linked record counts (calls)"
 */
export const getCallsByLead = asyncHandler(async (req, res) => {
  const calls = await callService.getCallsByLead(
    req.user.tenantId,
    req.params.leadId
  );
  return sendSuccess(res, { calls }, 'Lead calls fetched successfully');
});