/**
 * =============================================================================
 * InnovateX Revenue OS — Automation Model
 * =============================================================================
 *
 * FILE: src/modules/automations/automation.model.js
 *
 * NAMING: snake_case, timestamps: created_at/updated_at, versionKey: false —
 * matches Lead/Deal/Call/Booking/Payment/Campaign exactly.
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6:
 *   "name, trigger, condition, action, status('active'|'inactive'), last_run,
 *    created_by, run_count, logs[{at,result}]"
 */

import mongoose from 'mongoose';
import {
  TRIGGER_TYPE_VALUES,
  CONDITION_OPERATOR_VALUES,
  ACTION_TYPE_VALUES,
  AUTOMATION_STATUS_VALUES,
  AUTOMATION_STATUS,
  TRIGGERED_BY_VALUES,
  TRIGGERED_BY,
} from './automation.constants.js';

const { Schema } = mongoose;

// ── WHEN: trigger ───────────────────────────────────────────────────────────────
const triggerSchema = new Schema(
  {
    type:   { type: String, enum: TRIGGER_TYPE_VALUES, required: true },
    params: { type: Schema.Types.Mixed, default: {} }, // e.g. { source: 'WhatsApp' }
  },
  { _id: false },
);

// ── IF: condition (optional — no condition = the action always runs) ──────────
const conditionSchema = new Schema(
  {
    field:    { type: String, default: null },   // e.g. "lead.qualification_score"
    operator: { type: String, enum: [...CONDITION_OPERATOR_VALUES, null], default: null },
    value:    { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

// ── THEN: action ────────────────────────────────────────────────────────────────
const actionSchema = new Schema(
  {
    type:   { type: String, enum: ACTION_TYPE_VALUES, required: true },
    params: { type: Schema.Types.Mixed, default: {} }, // e.g. { templateId, userId, tag }
  },
  { _id: false },
);

// ── Run log entry — append-only ────────────────────────────────────────────────
const logEntrySchema = new Schema(
  {
    at:          { type: Date, default: Date.now },
    result:      { type: String, default: '' },       // human-readable outcome
    success:     { type: Boolean, default: true },
    triggeredBy: { type: String, enum: TRIGGERED_BY_VALUES, default: TRIGGERED_BY.MANUAL },
    leadId:      { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
  },
  { _id: false },
);

const automationSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },

    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '' },

    trigger:   { type: triggerSchema, required: true },
    condition: { type: conditionSchema, default: () => ({}) },
    action:    { type: actionSchema, required: true },

    status: {
      type:    String,
      enum:    AUTOMATION_STATUS_VALUES,
      default: AUTOMATION_STATUS.INACTIVE,
      index:   true,
    },

    last_run:  { type: Date, default: null },
    run_count: { type: Number, default: 0, min: 0 },
    logs:      { type: [logEntrySchema], default: [] },

    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

automationSchema.index({ tenant_id: 1, status: 1 });
automationSchema.index({ tenant_id: 1, 'trigger.type': 1 });
automationSchema.index({ tenant_id: 1, created_at: -1 });

export const Automation = mongoose.model('Automation', automationSchema);
