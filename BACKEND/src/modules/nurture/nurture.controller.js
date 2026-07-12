/**
 * Nurture controller — thin HTTP layer only.
 * No business logic. Pattern matches call.controller.js / booking.controller.js.
 *
 * FILE: src/modules/nurture/nurture.controller.js
 */

import * as nurtureService from './nurture.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * getKpis — GET /api/nurture/kpis
 * SOURCE: FRONTEND_SPEC.md §8 "Design: KPI row + sequence cards with step lists."
 */
export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await nurtureService.getKpiSummary(req.user.tenantId);
  return sendSuccess(res, kpis, 'Nurture KPIs fetched successfully');
});

/**
 * createSequence — POST /api/nurture
 */
export const createSequence = asyncHandler(async (req, res) => {
  const sequence = await nurtureService.createSequence(req.user.tenantId, req.user.sub, req.body);
  return sendCreated(res, sequence, 'Nurture sequence created successfully');
});

/**
 * getSequences — GET /api/nurture
 * Supports: status, search, page, limit.
 */
export const getSequences = asyncHandler(async (req, res) => {
  const filter = {
    status: req.query.status,
    search: req.query.search,
  };
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await nurtureService.listSequences(req.user.tenantId, filter, options);
  return sendPaginated(res, result.sequences, result.pagination, 'Nurture sequences fetched successfully');
});

/**
 * getSequence — GET /api/nurture/:id
 */
export const getSequence = asyncHandler(async (req, res) => {
  const sequence = await nurtureService.getSequence(req.user.tenantId, req.params.id);
  return sendSuccess(res, sequence, 'Nurture sequence fetched successfully');
});

/**
 * updateSequence — PATCH /api/nurture/:id
 */
export const updateSequence = asyncHandler(async (req, res) => {
  const sequence = await nurtureService.updateSequence(
    req.user.tenantId, req.params.id, req.user.sub, req.body
  );
  return sendSuccess(res, sequence, 'Nurture sequence updated successfully');
});

/**
 * deleteSequence — DELETE /api/nurture/:id
 */
export const deleteSequence = asyncHandler(async (req, res) => {
  const result = await nurtureService.deleteSequence(req.user.tenantId, req.params.id);
  return sendSuccess(res, result, 'Nurture sequence deleted successfully');
});

/**
 * toggleSequence — POST /api/nurture/:id/toggle
 * SOURCE: DEVELOPER_HANDOFF.md §17 "toggleSequence".
 */
export const toggleSequence = asyncHandler(async (req, res) => {
  const sequence = await nurtureService.toggleSequence(req.user.tenantId, req.params.id, req.user.sub);
  return sendSuccess(res, sequence, 'Nurture sequence status toggled');
});

/**
 * assignSequence — POST /api/nurture/:id/assign
 * SOURCE: DEVELOPER_HANDOFF.md §17
 *   "assignSequence(seqId, leadId) -> creates enrollment, enrolled_count++,
 *    track('Nurture Step Sent')"
 */
export const assignSequence = asyncHandler(async (req, res) => {
  const enrollment = await nurtureService.assignSequence(
    req.user.tenantId, req.user.sub, req.params.id, req.body.leadId
  );
  return sendCreated(res, enrollment, 'Lead enrolled in nurture sequence');
});

/**
 * getEnrollments — GET /api/nurture/enrollments
 * Supports: sequence_id, lead_id, status, page, limit.
 */
export const getEnrollments = asyncHandler(async (req, res) => {
  const filter = {
    sequence_id: req.query.sequence_id,
    lead_id: req.query.lead_id,
    status: req.query.status,
  };
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await nurtureService.listEnrollments(req.user.tenantId, filter, options);
  return sendPaginated(res, result.enrollments, result.pagination, 'Enrollments fetched successfully');
});

/**
 * getEnrollment — GET /api/nurture/enrollments/:id
 */
export const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await nurtureService.getEnrollment(req.user.tenantId, req.params.id);
  return sendSuccess(res, enrollment, 'Enrollment fetched successfully');
});
