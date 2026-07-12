/**
 * =============================================================================
 * InnovateX Revenue OS — Nurture Engine Model
 * =============================================================================
 *
 * FILE: src/modules/nurture/nurture.model.js
 *
 * Two collections, one file. Uses this codebase's TOP-LEVEL naming
 * (snake_case fields, created_at/updated_at, versionKey: false) — matches
 * Lead/Deal/Call/Booking/Payment/Campaign/Automation exactly.
 *
 * NurtureSequence 1-* NurtureEnrollment *-1 Lead   (MASTER_SPEC.md ERD)
 */

import mongoose from 'mongoose';
import {
  SEQUENCE_STATUS_VALUES,
  SEQUENCE_STATUS,
  NURTURE_CHANNEL_VALUES,
  ENROLLMENT_STATUS_VALUES,
  ENROLLMENT_STATUS,
} from './nurture.constants.js';

const { Schema } = mongoose;

// =============================================================================
// NurtureSequence
// =============================================================================

/** NurtureStep - one message/task in the sequence. */
const nurtureStepSchema = new Schema(
  {
    order:      { type: Number, required: true, min: 1 },
    channel:    { type: String, enum: NURTURE_CHANNEL_VALUES, required: true },
    delay_days: { type: Number, required: true, min: 0 },
    message:    { type: String, trim: true, default: '' },
  },
  { _id: true },
);

const nurtureSequenceSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },

    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '' },

    steps: { type: [nurtureStepSchema], default: [] },

    status: {
      type:    String,
      enum:    SEQUENCE_STATUS_VALUES,
      default: SEQUENCE_STATUS.DRAFT,
      index:   true,
    },

    enrolled_count: { type: Number, default: 0, min: 0 },

    trigger: { type: String, trim: true, default: '' },

    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

nurtureSequenceSchema.index({ tenant_id: 1, status: 1 });
nurtureSequenceSchema.index({ tenant_id: 1, created_at: -1 });

// Registered as 'CrmNurtureSequence' (not 'NurtureSequence') to avoid an
// OverwriteModelError — the WhatsApp-only nurtures submodule
// (src/modules/whatsapp/submodules/nurtures/) already registers a Mongoose
// model literally named 'NurtureSequence'. Both modules load via app.js, so
// they must not share a model name. The JS export name below is unchanged
// so nothing else in this module needs to change.
export const NurtureSequence = mongoose.model('CrmNurtureSequence', nurtureSequenceSchema);

// =============================================================================
// NurtureEnrollment
// =============================================================================

const stepSentSchema = new Schema(
  {
    step_id: { type: Schema.Types.ObjectId, required: true },
    order:   { type: Number, required: true },
    channel: { type: String, enum: NURTURE_CHANNEL_VALUES, required: true },
    sent_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const nurtureEnrollmentSchema = new Schema(
  {
    tenant_id:    { type: String, required: true, index: true },
    sequence_id:  { type: Schema.Types.ObjectId, ref: 'CrmNurtureSequence', required: true, index: true },
    lead_id:      { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },

    current_step: { type: Number, default: 0, min: 0 },

    status: {
      type:    String,
      enum:    ENROLLMENT_STATUS_VALUES,
      default: ENROLLMENT_STATUS.ACTIVE,
    },

    steps_sent: { type: [stepSentSchema], default: [] },

    created_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

nurtureEnrollmentSchema.index({ tenant_id: 1, sequence_id: 1 });
nurtureEnrollmentSchema.index({ tenant_id: 1, lead_id: 1 });
nurtureEnrollmentSchema.index({ tenant_id: 1, status: 1 });

// Same collision-avoidance as NurtureSequence above — registered as
// 'CrmNurtureEnrollment', not 'NurtureEnrollment'.
export const NurtureEnrollment = mongoose.model('CrmNurtureEnrollment', nurtureEnrollmentSchema);