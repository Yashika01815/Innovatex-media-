import mongoose from 'mongoose';
import {
  SEQUENCE_STATUS,
  SEQUENCE_STATUS_VALUES,
  SEQUENCE_TYPE_VALUES,
  TRIGGER_TYPE,
  TRIGGER_TYPE_VALUES,
  DELAY_UNIT_VALUES,
  ENROLLMENT_STATUS,
  ENROLLMENT_STATUS_VALUES,
  STEP_EXECUTION_STATUS,
} from './nurtures.constants.js';

const { Schema } = mongoose;

// ── Step sub-schema (embedded in Sequence) ────────────────────────────────────

const stepSchema = new Schema(
  {
    stepNumber:     { type: Number, required: true, min: 1 },
    delayValue:     { type: Number, required: true, min: 0 },
    delayUnit:      { type: String, enum: DELAY_UNIT_VALUES, required: true },
    templateId:     { type: Schema.Types.ObjectId, ref: 'WhatsAppTemplate', required: true },
    templateName:   { type: String, default: '' },
    approvalStatus: { type: String, default: '' },   // snapshot at validation time
    conditions:     { type: Schema.Types.Mixed, default: {} },
    isActive:       { type: Boolean, default: true },
  },
  { _id: false },
);

// ── Sequence audit entry ───────────────────────────────────────────────────────
const auditEntrySchema = new Schema(
  {
    fromStatus:  { type: String, default: null },
    toStatus:    { type: String, required: true },
    action:      { type: String, required: true },
    performedBy: { type: String, default: null },
    performedAt: { type: Date,   default: Date.now },
    comment:     { type: String, default: '' },
  },
  { _id: false },
);

// ── Sequence (the nurture blueprint) ──────────────────────────────────────────

const nurtureSequenceSchema = new Schema(
  {
    tenantId:    { type: String, required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type:        { type: String, enum: SEQUENCE_TYPE_VALUES, required: true },
    status:      { type: String, enum: SEQUENCE_STATUS_VALUES, default: SEQUENCE_STATUS.DRAFT },
    triggerType: { type: String, enum: TRIGGER_TYPE_VALUES, default: TRIGGER_TYPE.MANUAL },
    totalSteps:  { type: Number, default: 0, min: 0 },
    steps:       { type: [stepSchema], default: [] },

    // Enrollment counters (denormalised for fast reads).
    enrollmentCount:          { type: Number, default: 0, min: 0 },
    activeEnrollmentCount:    { type: Number, default: 0, min: 0 },
    completedEnrollmentCount: { type: Number, default: 0, min: 0 },
    failedEnrollmentCount:    { type: Number, default: 0, min: 0 },
    cancelledEnrollmentCount: { type: Number, default: 0, min: 0 },

    auditLog:  { type: [auditEntrySchema], default: [] },
    isActive:  { type: Boolean, default: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

nurtureSequenceSchema.index({ tenantId: 1, status: 1 });
nurtureSequenceSchema.index({ tenantId: 1, type: 1 });
nurtureSequenceSchema.index({ tenantId: 1, triggerType: 1 });
nurtureSequenceSchema.index({ tenantId: 1, createdBy: 1 });
nurtureSequenceSchema.index({ tenantId: 1, createdAt: -1 });

export const NurtureSequence = mongoose.model('NurtureSequence', nurtureSequenceSchema);

// ── Execution history entry (embedded in Enrollment) ──────────────────────────

const executionHistorySchema = new Schema(
  {
    stepNumber:        { type: Number, required: true },
    templateId:        { type: Schema.Types.ObjectId, ref: 'WhatsAppTemplate', default: null },
    executedAt:        { type: Date, default: Date.now },
    status:            { type: String, enum: Object.values(STEP_EXECUTION_STATUS), required: true },
    providerMessageId: { type: String, default: null },
    error:             { type: String, default: null },
  },
  { _id: false },
);

// ── Enrollment audit entry ─────────────────────────────────────────────────────
const enrollmentAuditSchema = new Schema(
  {
    fromStatus:  { type: String, default: null },
    toStatus:    { type: String, required: true },
    action:      { type: String, required: true },
    performedBy: { type: String, default: null },
    performedAt: { type: Date,   default: Date.now },
    comment:     { type: String, default: '' },
  },
  { _id: false },
);

// ── Enrollment (one lead's progress through a sequence) ───────────────────────

const nurtureEnrollmentSchema = new Schema(
  {
    tenantId:   { type: String, required: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'NurtureSequence', required: true },
    leadId:     { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    contactId:  { type: Schema.Types.ObjectId, ref: 'WhatsAppContact', default: null },

    currentStep:      { type: Number, default: 1, min: 1 },
    status:           { type: String, enum: ENROLLMENT_STATUS_VALUES, default: ENROLLMENT_STATUS.ACTIVE },

    enrolledAt:       { type: Date, default: Date.now },
    lastExecutedAt:   { type: Date, default: null },
    completedAt:      { type: Date, default: null },
    nextExecutionAt:  { type: Date, default: null },

    executionHistory: { type: [executionHistorySchema], default: [] },
    auditLog:         { type: [enrollmentAuditSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

nurtureEnrollmentSchema.index({ tenantId: 1, sequenceId: 1 });
nurtureEnrollmentSchema.index({ tenantId: 1, leadId: 1 });
nurtureEnrollmentSchema.index({ tenantId: 1, contactId: 1 });
nurtureEnrollmentSchema.index({ tenantId: 1, status: 1 });
nurtureEnrollmentSchema.index({ tenantId: 1, nextExecutionAt: 1, status: 1 });  // scheduler index

export const NurtureEnrollment = mongoose.model('NurtureEnrollment', nurtureEnrollmentSchema);
