/**
 * WhatsApp Nurtures — repository.
 *
 * Two collections: NurtureSequence and NurtureEnrollment.
 * Every query is tenant-scoped. Status transitions are atomic.
 */
import { NurtureSequence, NurtureEnrollment } from './nurtures.model.js';
import { SEQUENCE_STATUS, ENROLLMENT_STATUS } from './nurtures.constants.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function seqTransition(tenantId, id, set, auditEntry) {
  return NurtureSequence.findOneAndUpdate(
    { _id: id, tenantId },
    { $set: set, $push: { auditLog: auditEntry } },
    { new: true, runValidators: true },
  );
}

function enrollTransition(tenantId, id, set, auditEntry) {
  return NurtureEnrollment.findOneAndUpdate(
    { _id: id, tenantId },
    { $set: set, $push: { auditLog: auditEntry } },
    { new: true, runValidators: true },
  );
}

// ── Sequence repository ────────────────────────────────────────────────────────

export const nurturesRepository = {
  // ── Sequence CRUD ──────────────────────────────────────────────────────────

  createSequence(data) {
    return NurtureSequence.create(data);
  },

  findById(tenantId, id) {
    return NurtureSequence.findOne({ _id: id, tenantId });
  },

  listSequences(tenantId, filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 20 } = {}) {
    return NurtureSequence.find({ tenantId, ...filter }).sort(sort).skip(skip).limit(limit);
  },

  countSequences(tenantId, filter = {}) {
    return NurtureSequence.countDocuments({ tenantId, ...filter });
  },

  updateSequence(tenantId, id, patch) {
    return NurtureSequence.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: patch },
      { new: true, runValidators: true },
    );
  },

  deleteSequence(tenantId, id) {
    return NurtureSequence.findOneAndDelete({ _id: id, tenantId });
  },

  // ── Sequence lifecycle ─────────────────────────────────────────────────────

  activateSequence(tenantId, id, { performedBy, auditEntry }) {
    return seqTransition(tenantId, id, {
      status: SEQUENCE_STATUS.ACTIVE, isActive: true, updatedBy: performedBy,
    }, auditEntry);
  },

  pauseSequence(tenantId, id, { performedBy, auditEntry }) {
    return seqTransition(tenantId, id, {
      status: SEQUENCE_STATUS.PAUSED, updatedBy: performedBy,
    }, auditEntry);
  },

  archiveSequence(tenantId, id, { performedBy, auditEntry }) {
    return seqTransition(tenantId, id, {
      status: SEQUENCE_STATUS.ARCHIVED, isActive: false, updatedBy: performedBy,
    }, auditEntry);
  },

  // Increment denormalised counters when enrollment status changes.
  incrementEnrollmentCounter(tenantId, id, field, delta = 1) {
    return NurtureSequence.findOneAndUpdate(
      { _id: id, tenantId },
      { $inc: { [field]: delta, enrollmentCount: field === 'activeEnrollmentCount' && delta > 0 ? 1 : 0 } },
      { new: true },
    );
  },

  // ── Enrollment repository ──────────────────────────────────────────────────

  createEnrollment(data) {
    return NurtureEnrollment.create(data);
  },

  findEnrollmentById(tenantId, id) {
    return NurtureEnrollment.findOne({ _id: id, tenantId });
  },

  findActiveEnrollmentByLeadAndSequence(tenantId, sequenceId, leadId) {
    return NurtureEnrollment.findOne({
      tenantId,
      sequenceId,
      leadId,
      status: ENROLLMENT_STATUS.ACTIVE,
    });
  },

  listEnrollments(tenantId, filter = {}, { sort = { enrolledAt: -1 }, skip = 0, limit = 20 } = {}) {
    return NurtureEnrollment.find({ tenantId, ...filter }).sort(sort).skip(skip).limit(limit);
  },

  countEnrollments(tenantId, filter = {}) {
    return NurtureEnrollment.countDocuments({ tenantId, ...filter });
  },

  pauseEnrollment(tenantId, id, { performedBy, auditEntry }) {
    return enrollTransition(tenantId, id, {
      status: ENROLLMENT_STATUS.PAUSED,
    }, auditEntry);
  },

  resumeEnrollment(tenantId, id, { performedBy, nextExecutionAt, auditEntry }) {
    return enrollTransition(tenantId, id, {
      status: ENROLLMENT_STATUS.ACTIVE, nextExecutionAt,
    }, auditEntry);
  },

  cancelEnrollment(tenantId, id, { performedBy, auditEntry }) {
    return enrollTransition(tenantId, id, {
      status: ENROLLMENT_STATUS.CANCELLED,
    }, auditEntry);
  },

  completeEnrollment(tenantId, id, { performedBy, now, auditEntry }) {
    return enrollTransition(tenantId, id, {
      status: ENROLLMENT_STATUS.COMPLETED, completedAt: now,
    }, auditEntry);
  },

  advanceEnrollmentStep(tenantId, id, { nextStep, nextExecutionAt, historyEntry, now }) {
    return NurtureEnrollment.findOneAndUpdate(
      { _id: id, tenantId },
      {
        $set: { currentStep: nextStep, nextExecutionAt, lastExecutedAt: now },
        $push: { executionHistory: historyEntry },
      },
      { new: true },
    );
  },
};
