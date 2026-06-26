/**
 * WhatsApp Automation Rules — model.
 *
 * Two logical entities in one file (consistent with nurtures.model.js pattern):
 *   AutomationRule         — the rule blueprint
 *   AutomationRuleHistory  — one execution record per run
 *
 * The history is in a SEPARATE collection (not embedded) so it can be
 * independently queried, paginated, and archived without loading the rule.
 */
import mongoose from 'mongoose';
import {
  RULE_STATUS,
  RULE_STATUS_VALUES,
  TRIGGER_TYPE_VALUES,
  CONDITION_OPERATOR_VALUES,
  CONDITION_LOGIC,
  CONDITION_LOGIC_VALUES,
  ACTION_TYPE_VALUES,
  EXECUTION_MODE,
  EXECUTION_MODE_VALUES,
  DELAY_UNIT_VALUES,
  EXECUTION_STATUS,
  PRIORITY_MIN,
  PRIORITY_MAX,
} from './automationRules.constants.js';

const { Schema } = mongoose;

// ── Condition sub-schema ───────────────────────────────────────────────────────
const conditionSchema = new Schema(
  {
    field:    { type: String, required: true },          // e.g. "lead.score"
    operator: { type: String, enum: CONDITION_OPERATOR_VALUES, required: true },
    value:    { type: Schema.Types.Mixed, default: null },// the comparison value
    label:    { type: String, default: '' },              // human-readable label
  },
  { _id: false },
);

// ── Action parameter schema ────────────────────────────────────────────────────
// Each action carries type-specific params in a free-form object so the engine
// can dispatch to any future integration without schema migrations.
const actionSchema = new Schema(
  {
    order:       { type: Number, required: true, min: 1 },
    type:        { type: String, enum: ACTION_TYPE_VALUES, required: true },
    params:      { type: Schema.Types.Mixed, default: {} },
    // WAIT action — delay before the next action.
    delayValue:  { type: Number, default: 0, min: 0 },
    delayUnit:   { type: String, enum: DELAY_UNIT_VALUES, default: 'minutes' },
    description: { type: String, default: '' },
  },
  { _id: false },
);

// ── Delay config (top-level rule delay before first action) ───────────────────
const delaySchema = new Schema(
  {
    value: { type: Number, default: 0, min: 0 },
    unit:  { type: String, enum: DELAY_UNIT_VALUES, default: 'minutes' },
  },
  { _id: false },
);

// ── Trigger config ─────────────────────────────────────────────────────────────
const triggerSchema = new Schema(
  {
    type:   { type: String, enum: TRIGGER_TYPE_VALUES, required: true },
    params: { type: Schema.Types.Mixed, default: {} }, // event-specific metadata
  },
  { _id: false },
);

// ── AutomationRule ─────────────────────────────────────────────────────────────
const automationRuleSchema = new Schema(
  {
    tenantId:    { type: String, required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    trigger:    { type: triggerSchema, required: true },
    conditions: { type: [conditionSchema], default: [] },
    conditionLogic: {
      type:    String,
      enum:    CONDITION_LOGIC_VALUES,
      default: CONDITION_LOGIC.AND,
    },
    actions: { type: [actionSchema], default: [] },

    status: {
      type:    String,
      enum:    RULE_STATUS_VALUES,
      default: RULE_STATUS.DRAFT,
    },

    priority: {
      type:    Number,
      default: 50,
      min:     PRIORITY_MIN,
      max:     PRIORITY_MAX,
    },

    executionMode: {
      type:    String,
      enum:    EXECUTION_MODE_VALUES,
      default: EXECUTION_MODE.IMMEDIATELY,
    },

    delay: { type: delaySchema, default: () => ({ value: 0, unit: 'minutes' }) },

    /** Soft-delete flag — isActive=false = deleted from list views. */
    isActive: { type: Boolean, default: true },

    /** Denormalised execution counter (fast read on list views). */
    executionCount:  { type: Number, default: 0, min: 0 },
    lastExecutedAt:  { type: Date, default: null },

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

automationRuleSchema.index({ tenantId: 1, isActive: 1 });
automationRuleSchema.index({ tenantId: 1, status: 1 });
automationRuleSchema.index({ tenantId: 1, 'trigger.type': 1 });
automationRuleSchema.index({ tenantId: 1, priority: -1 });
automationRuleSchema.index({ tenantId: 1, createdAt: -1 });

export const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);

// ── AutomationRuleHistory ──────────────────────────────────────────────────────
// Separate collection so history can grow indefinitely without bloating the rule doc.

const actionLogSchema = new Schema(
  {
    order:   { type: Number },
    type:    { type: String },
    status:  { type: String, enum: Object.values(EXECUTION_STATUS) },
    message: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
  },
  { _id: false },
);

const automationRuleHistorySchema = new Schema(
  {
    automationId: { type: Schema.Types.ObjectId, ref: 'AutomationRule', required: true },
    tenantId:     { type: String, required: true },

    trigger:    { type: String, default: '' },
    leadId:     { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    contactId:  { type: Schema.Types.ObjectId, ref: 'WhatsAppContact', default: null },
    campaignId: { type: Schema.Types.ObjectId, ref: 'WhatsAppCampaign', default: null },

    status:          { type: String, enum: Object.values(EXECUTION_STATUS), required: true },
    actionsExecuted: { type: Number, default: 0 },
    actionLogs:      { type: [actionLogSchema], default: [] },

    startedAt:   { type: Date, required: true },
    completedAt: { type: Date, default: null },
    duration:    { type: Number, default: 0 },  // ms

    error: { type: String, default: null },
    logs:  { type: [String], default: [] },
  },
  { timestamps: false, versionKey: false },
);

automationRuleHistorySchema.index({ automationId: 1, tenantId: 1 });
automationRuleHistorySchema.index({ tenantId: 1, startedAt: -1 });
automationRuleHistorySchema.index({ tenantId: 1, status: 1 });

export const AutomationRuleHistory = mongoose.model('AutomationRuleHistory', automationRuleHistorySchema);
