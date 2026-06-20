/**
 * AI Qualification controller — thin HTTP layer only.
 * No business logic. Pattern matches booking.controller.js and call.controller.js.
 */

import * as qualService from './qualification.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * runQualification — POST /api/qualification/run
 * Runs AI assessment on a lead. Returns result for review (not applied yet).
 * SOURCE: FRONTEND_SPEC §6 "Run AI Qualification" button
 */
export const runQualification = asyncHandler(async (req, res) => {
  const qualification = await qualService.runQualification(
    req.body.lead_id,
    req.body.answers,
    req.user
  );
  return sendCreated(res, { qualification }, 'AI qualification completed');
});

/**
 * applyResult — POST /api/qualification/:id/apply
 * Applies qualification result to the lead — updates score/temperature/status.
 * SOURCE: FRONTEND_SPEC §6 "apply & route (booking / nurture / sales)"
 */
export const applyResult = asyncHandler(async (req, res) => {
  const result = await qualService.applyResult(req.params.id, req.user);
  return sendSuccess(
    res,
    { qualification: result.qualification, lead: result.lead },
    'Qualification applied to lead successfully'
  );
});

/**
 * overrideScore — PATCH /api/qualification/:id/override
 * Human manually adjusts the AI score.
 * SOURCE: FRONTEND_SPEC §6 "Human override supported"
 */
export const overrideScore = asyncHandler(async (req, res) => {
  const qualification = await qualService.overrideScore(
    req.params.id,
    req.body.override_score,
    req.user
  );
  return sendSuccess(res, { qualification }, 'Score overridden successfully');
});

/**
 * getQualifications — GET /api/qualification
 * Paginated list of qualification records for this tenant.
 */
export const getQualifications = asyncHandler(async (req, res) => {
  const filter = {
    applied:     req.query.applied !== undefined
                   ? req.query.applied === 'true'
                   : undefined,
    temperature: req.query.temperature,
    lead_id:     req.query.lead_id,
  };
  const options = {
    page:  parseInt(req.query.page)  || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await qualService.getQualifications(req.user.tenantId, filter, options);
  return sendPaginated(
    res,
    result.qualifications,
    result.pagination,
    'Qualifications fetched successfully'
  );
});

/**
 * getQualification — GET /api/qualification/:id
 */
export const getQualification = asyncHandler(async (req, res) => {
  const qualification = await qualService.getQualificationById(
    req.user.tenantId,
    req.params.id
  );
  return sendSuccess(res, { qualification }, 'Qualification fetched successfully');
});

/**
 * getByLead — GET /api/qualification/lead/:leadId
 * All qualification history for a specific lead.
 */
export const getByLead = asyncHandler(async (req, res) => {
  const qualifications = await qualService.getQualificationsByLead(
    req.user.tenantId,
    req.params.leadId
  );
  return sendSuccess(res, { qualifications }, 'Lead qualifications fetched successfully');
});

/**
 * getLatestForLead — GET /api/qualification/lead/:leadId/latest
 * Most recent qualification result for a lead.
 * Used by lead detail drawer to show current AI assessment.
 * SOURCE: FRONTEND_SPEC §4 lead drawer — "recommended next action (AI)"
 */
export const getLatestForLead = asyncHandler(async (req, res) => {
  const qualification = await qualService.getLatestForLead(
    req.user.tenantId,
    req.params.leadId
  );
  return sendSuccess(res, { qualification }, 'Latest qualification fetched successfully');
});