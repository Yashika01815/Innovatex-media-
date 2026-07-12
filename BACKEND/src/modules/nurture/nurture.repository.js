/**
 * =============================================================================
 * InnovateX Revenue OS — Nurture Repository
 * =============================================================================
 *
 * FILE: src/modules/nurture/nurture.repository.js
 *
 * Pattern matches booking.repository.js / attribution.repository.js exactly:
 *   - tenantId always first argument
 *   - All queries include { tenant_id: tenantId }
 *   - Returns raw Mongoose documents
 *   - No business logic, no validation, no formatting
 */

import { NurtureSequence, NurtureEnrollment } from './nurture.model.js';

// =============================================================================
// SEQUENCE — CREATE
// =============================================================================

export const createSequence = (data) => NurtureSequence.create(data);

// =============================================================================
// SEQUENCE — READ
// =============================================================================

export const findSequenceById = (tenantId, id) =>
  NurtureSequence.findOne({ _id: id, tenant_id: tenantId });

export const listSequences = (tenantId, filter = {}, { skip = 0, limit = 20 } = {}) => {
  const query = buildSequenceQuery(tenantId, filter);
  return NurtureSequence.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
};

export const countSequences = (tenantId, filter = {}) =>
  NurtureSequence.countDocuments(buildSequenceQuery(tenantId, filter));

export const getKpiCounts = async (tenantId) => {
  const [totals, activeCount, enrollmentTotal] = await Promise.all([
    NurtureSequence.countDocuments({ tenant_id: tenantId }),
    NurtureSequence.countDocuments({ tenant_id: tenantId, status: 'active' }),
    NurtureEnrollment.countDocuments({ tenant_id: tenantId }),
  ]);
  return { total: totals, active: activeCount, totalEnrollments: enrollmentTotal };
};

// =============================================================================
// SEQUENCE — UPDATE
// =============================================================================

export const updateSequence = (tenantId, id, patch) =>
  NurtureSequence.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true },
  );

export const setSequenceStatus = (tenantId, id, status, updatedBy) =>
  NurtureSequence.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: { status, updated_by: updatedBy } },
    { new: true },
  );

export const incrementEnrolledCount = (tenantId, id) =>
  NurtureSequence.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $inc: { enrolled_count: 1 } },
    { new: true },
  );

// =============================================================================
// SEQUENCE — DELETE
// =============================================================================

export const removeSequence = (tenantId, id) =>
  NurtureSequence.findOneAndDelete({ _id: id, tenant_id: tenantId });

// =============================================================================
// ENROLLMENT — CREATE
// =============================================================================

export const createEnrollment = (data) => NurtureEnrollment.create(data);

// =============================================================================
// ENROLLMENT — READ
// =============================================================================

export const findEnrollmentById = (tenantId, id) =>
  NurtureEnrollment.findOne({ _id: id, tenant_id: tenantId })
    .populate('lead_id', 'name email phone')
    .populate('sequence_id', 'name status');

export const listEnrollments = (tenantId, filter = {}, { skip = 0, limit = 20 } = {}) => {
  const query = buildEnrollmentQuery(tenantId, filter);
  return NurtureEnrollment.find(query)
    .populate('lead_id', 'name email phone')
    .populate('sequence_id', 'name status')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
};

export const countEnrollments = (tenantId, filter = {}) =>
  NurtureEnrollment.countDocuments(buildEnrollmentQuery(tenantId, filter));

export const findActiveEnrollment = (tenantId, sequenceId, leadId) =>
  NurtureEnrollment.findOne({
    tenant_id:   tenantId,
    sequence_id: sequenceId,
    lead_id:     leadId,
    status:      'active',
  });

// =============================================================================
// PRIVATE: BUILD QUERY
// =============================================================================

const buildSequenceQuery = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.status) query.status = filter.status;
  if (filter.search) query.name = { $regex: filter.search, $options: 'i' };
  return query;
};

const buildEnrollmentQuery = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.sequence_id) query.sequence_id = filter.sequence_id;
  if (filter.lead_id)     query.lead_id     = filter.lead_id;
  if (filter.status)      query.status      = filter.status;
  return query;
};
