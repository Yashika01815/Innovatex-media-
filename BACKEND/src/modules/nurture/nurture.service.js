/**
 * =============================================================================
 * InnovateX Revenue OS — Nurture Service
 * =============================================================================
 *
 * FILE: src/modules/nurture/nurture.service.js
 *
 * Contains ALL business logic:
 *   - Sequence CRUD (create, read, list, update, delete)
 *   - Toggle active/paused (draft -> active -> paused -> active ...)
 *   - assignSequence — enroll a lead, increment enrolled_count, fire a
 *     'Nurture Step Sent' tracking event. Matches DEVELOPER_HANDOFF.md §17
 *     exactly: "assignSequence(seqId, leadId) -> creates enrollment,
 *     enrolled_count++, track('Nurture Step Sent')"
 *   - Enrollment listing/lookup
 *   - KPI summary for the page header
 *
 * Tracking-event emission uses the SAME fire-and-forget pattern already
 * established in call.service.js:
 *   const emitTrackingEvent = async (eventType, leadId, tenantId, metadata) =>
 *     createTrackingEvent({...}).catch(() => {});
 *
 * AppError usage matches call.service.js / booking.service.js exactly:
 * static factories from lead.helpers.js.
 */

import * as nurtureRepo from './nurture.repository.js';
import { AppError, paginationMeta, normalizePaging } from '../../shared/helpers/lead.helpers.js';
import { createTrackingEvent } from '../attribution/attribution.service.js';
import { TRACKING_EVENT_TYPE } from '../attribution/attribution.constants.js';
import { Lead } from '../leads/lead/lead.model.js';
import {
  SEQUENCE_STATUS,
  SEQUENCE_STATUS_VALUES,
  ENROLLMENT_STATUS,
  NURTURE_CHANNEL_VALUES,
  MAX_STEPS_PER_SEQUENCE,
} from './nurture.constants.js';

// =============================================================================
// TRACKING EVENT — fire-and-forget, mirrors call.service.js's emitTrackingEvent
// =============================================================================

const emitTrackingEvent = async (eventType, leadId, tenantId, metadata = {}) => {
  await createTrackingEvent({
    tenant_id: tenantId,
    event_type: eventType,
    lead_id: leadId,
    ...metadata,
  }).catch(() => {});
};

// =============================================================================
// STEP VALIDATION
// =============================================================================

const validateSteps = (steps) => {
  if (!Array.isArray(steps)) return;
  if (steps.length > MAX_STEPS_PER_SEQUENCE) {
    throw AppError.badRequest('A sequence cannot have more than ' + MAX_STEPS_PER_SEQUENCE + ' steps');
  }
  for (const step of steps) {
    if (!NURTURE_CHANNEL_VALUES.includes(step.channel)) {
      throw AppError.badRequest('Invalid step channel: ' + step.channel);
    }
    if (typeof step.order !== 'number' || step.order < 1) {
      throw AppError.badRequest('Each step must have a positive order number');
    }
    if (typeof step.delay_days !== 'number' || step.delay_days < 0) {
      throw AppError.badRequest('Each step must have a non-negative delay_days');
    }
  }
};

// =============================================================================
// SEQUENCE CRUD
// =============================================================================

export const createSequence = async (tenantId, userId, data) => {
  if (!data || !data.name) {
    throw AppError.badRequest('name is required');
  }
  validateSteps(data.steps);

  const sequence = await nurtureRepo.createSequence({
    tenant_id: tenantId,
    name: data.name,
    description: data.description || '',
    steps: data.steps || [],
    status: SEQUENCE_STATUS.DRAFT,
    enrolled_count: 0,
    trigger: data.trigger || '',
    created_by: userId,
    updated_by: userId,
  });

  return sequence;
};

export const getSequence = async (tenantId, id) => {
  const sequence = await nurtureRepo.findSequenceById(tenantId, id);
  if (!sequence) throw AppError.notFound('Nurture sequence not found');
  return sequence;
};

export const listSequences = async (tenantId, filter, options) => {
  const { page, limit, skip } = normalizePaging(options || {});
  const [sequences, total] = await Promise.all([
    nurtureRepo.listSequences(tenantId, filter || {}, { skip, limit }),
    nurtureRepo.countSequences(tenantId, filter || {}),
  ]);
  return { sequences, pagination: paginationMeta({ page, limit, total }) };
};

export const updateSequence = async (tenantId, id, userId, patch) => {
  const existing = await nurtureRepo.findSequenceById(tenantId, id);
  if (!existing) throw AppError.notFound('Nurture sequence not found');

  if (patch && patch.steps) validateSteps(patch.steps);
  if (patch && patch.status && !SEQUENCE_STATUS_VALUES.includes(patch.status)) {
    throw AppError.badRequest('Invalid status');
  }

  const updated = await nurtureRepo.updateSequence(
    tenantId, id, Object.assign({}, patch, { updated_by: userId })
  );
  return updated;
};

export const deleteSequence = async (tenantId, id) => {
  const existing = await nurtureRepo.findSequenceById(tenantId, id);
  if (!existing) throw AppError.notFound('Nurture sequence not found');
  await nurtureRepo.removeSequence(tenantId, id);
  return { id, deleted: true };
};

// =============================================================================
// TOGGLE — activate/pause, FRONTEND_SPEC §8 "activate/pause"
// =============================================================================

export const toggleSequence = async (tenantId, id, userId) => {
  const existing = await nurtureRepo.findSequenceById(tenantId, id);
  if (!existing) throw AppError.notFound('Nurture sequence not found');

  // draft/paused -> active; active -> paused
  const newStatus = existing.status === SEQUENCE_STATUS.ACTIVE
    ? SEQUENCE_STATUS.PAUSED
    : SEQUENCE_STATUS.ACTIVE;

  return nurtureRepo.setSequenceStatus(tenantId, id, newStatus, userId);
};

// =============================================================================
// ASSIGN SEQUENCE — enroll a lead
// SOURCE: DEVELOPER_HANDOFF.md §17 exactly:
//   "assignSequence(seqId, leadId) -> creates enrollment, enrolled_count++,
//    track('Nurture Step Sent')"
// =============================================================================

export const assignSequence = async (tenantId, userId, sequenceId, leadId) => {
  const sequence = await nurtureRepo.findSequenceById(tenantId, sequenceId);
  if (!sequence) throw AppError.notFound('Nurture sequence not found');

  if (sequence.status !== SEQUENCE_STATUS.ACTIVE) {
    throw AppError.badRequest('Only active sequences accept new enrollments');
  }

  const lead = await Lead.findOne({ _id: leadId, tenant_id: tenantId, archived: false });
  if (!lead) throw AppError.notFound('Lead not found in this workspace');

  const existingEnrollment = await nurtureRepo.findActiveEnrollment(tenantId, sequenceId, leadId);
  if (existingEnrollment) {
    throw AppError.badRequest('Lead is already actively enrolled in this sequence');
  }

  const enrollment = await nurtureRepo.createEnrollment({
    tenant_id: tenantId,
    sequence_id: sequenceId,
    lead_id: leadId,
    current_step: 0,
    status: ENROLLMENT_STATUS.ACTIVE,
    steps_sent: [],
    created_by: userId,
  });

  await nurtureRepo.incrementEnrolledCount(tenantId, sequenceId);

  // Fire-and-forget tracking event - matches booking/call precedent exactly.
  await emitTrackingEvent(TRACKING_EVENT_TYPE.NURTURE_STEP_SENT, leadId, tenantId, {
    metadata: { sequence_id: String(sequenceId), sequence_name: sequence.name },
  });

  return enrollment;
};

// =============================================================================
// ENROLLMENTS
// =============================================================================

export const getEnrollment = async (tenantId, id) => {
  const enrollment = await nurtureRepo.findEnrollmentById(tenantId, id);
  if (!enrollment) throw AppError.notFound('Enrollment not found');
  return enrollment;
};

export const listEnrollments = async (tenantId, filter, options) => {
  const { page, limit, skip } = normalizePaging(options || {});
  const [enrollments, total] = await Promise.all([
    nurtureRepo.listEnrollments(tenantId, filter || {}, { skip, limit }),
    nurtureRepo.countEnrollments(tenantId, filter || {}),
  ]);
  return { enrollments, pagination: paginationMeta({ page, limit, total }) };
};

// =============================================================================
// KPIs
// =============================================================================

export const getKpiSummary = async (tenantId) => {
  const counts = await nurtureRepo.getKpiCounts(tenantId);
  return {
    totalSequences: counts.total,
    activeSequences: counts.active,
    pausedOrDraftSequences: counts.total - counts.active,
    totalEnrollments: counts.totalEnrollments,
  };
};
