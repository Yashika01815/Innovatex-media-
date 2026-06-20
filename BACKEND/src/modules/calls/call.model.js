/**
 * Call Intelligence — Mongoose model.
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord entity:
 *   "lead_id, deal_id, duration_minutes, transcript, summary, objections[],
 *    next_steps[], outcome(CallOutcome), score, assigned_user_id, call_date"
 *
 * SOURCE: FRONTEND_SPEC §10:
 *   KPI cards: Total Calls | Proposals Requested | Closed Won | Avg Call Score
 *   Call card: name, date·duration·owner, outcome badge, score, summary, objections[]
 *   Log modal: Lead dropdown | Outcome dropdown | Transcript textarea | Generate AI summary
 *
 * NAMING: snake_case throughout — matches Lead, Deal, Booking models exactly.
 * TIMESTAMPS: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false
 * EXPORT: named export — matches Lead and Booking export patterns
 *
 * COLLECTION: calls
 */

import mongoose from 'mongoose';
import { CALL_OUTCOME, CALL_OUTCOME_VALUES } from './call.constants.js';

const { Schema } = mongoose;

const callSchema = new Schema(
  {
    // ── Tenant scope ──────────────────────────────────────────────────────────
    // Type String — matches lead.model.js and deal.model.js (both use String)
    tenant_id: {
      type:     String,
      required: [true, 'tenant_id is required'],
      index:    true,
    },

    // ── Core relations ────────────────────────────────────────────────────────

    /**
     * lead_id — the lead this call belongs to.
     * On create: lead.status → 'Call Completed' (in call.service.js)
     * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord.lead_id
     */
    lead_id: {
      type:     Schema.Types.ObjectId,
      ref:      'Lead',
      required: [true, 'lead_id is required'],
      index:    true,
    },

    /**
     * deal_id — linked pipeline deal.
     * Set after deal is advanced to 'Call Completed' in call.service.js.
     * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord.deal_id
     */
    deal_id: {
      type:    Schema.Types.ObjectId,
      ref:     'Deal',
      default: null,
    },

    /**
     * assigned_user_id — the sales rep who took the call.
     * Shown as owner on the call card (FRONTEND_SPEC §10).
     * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord.assigned_user_id
     */
    assigned_user_id: {
      type:    String,
      default: null,
      index:   true,
    },

    // ── Call details ──────────────────────────────────────────────────────────

    /**
     * outcome — result of the call.
     * SOURCE: MASTER_SPEC §I2 CallOutcome (7 values)
     * Shown as outcome badge on call card (FRONTEND_SPEC §10)
     * Selected in the Log Call modal dropdown.
     */
    outcome: {
      type:     String,
      enum:     CALL_OUTCOME_VALUES,
      required: [true, 'outcome is required'],
      index:    true,
    },

    /**
     * call_date — date of the call stored as YYYY-MM-DD string.
     * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord.call_date
     * Shown on call card: "Jun 1, 2026" (FRONTEND_SPEC §10)
     */
    call_date: {
      type:     String,
      required: [true, 'call_date is required'],
      match:    [/^\d{4}-\d{2}-\d{2}$/, 'call_date must be YYYY-MM-DD'],
    },

    /**
     * duration_minutes — call length in minutes.
     * Shown on call card: "23min" (FRONTEND_SPEC §10)
     * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord.duration_minutes
     */
    duration_minutes: {
      type:    Number,
      default: 0,
      min:     0,
    },

    /**
     * transcript — raw call transcript pasted by the sales rep.
     * SOURCE: FRONTEND_SPEC §10 modal — "Paste or type the call transcript..."
     * Used by AI summary generation.
     */
    transcript: {
      type:    String,
      default: '',
      trim:    true,
    },

    // ── AI-generated fields ───────────────────────────────────────────────────
    // All populated by generateAiSummary() in call.service.js
    // SOURCE: MASTER_SPEC §B9 "AI summary, extracted objections, next steps,
    //         follow-up draft, proposal outline, call score"
    // SOURCE: DEVELOPER_HANDOFF.md aiService.summarizeCall() returns:
    //         {summary, objections, nextSteps, followUpDraft, proposalOutline, score}

    /**
     * summary — AI-generated summary of the call.
     * Shown on call card body (FRONTEND_SPEC §10).
     */
    summary: {
      type:    String,
      default: '',
      trim:    true,
    },

    /**
     * objections — AI-extracted objections from the transcript.
     * Shown as tags on call card (FRONTEND_SPEC §10):
     * "Pricing concern", "Needs co-founder buy-in", "Already evaluating a competitor"
     */
    objections: {
      type:    [String],
      default: [],
    },

    /**
     * next_steps — AI-generated next steps.
     */
    next_steps: {
      type:    [String],
      default: [],
    },

    /**
     * follow_up_draft — AI-generated follow-up message draft.
     */
    follow_up_draft: {
      type:    String,
      default: '',
      trim:    true,
    },

    /**
     * proposal_outline — AI-generated proposal outline.
     * Populated when outcome is 'Proposal Requested'.
     */
    proposal_outline: {
      type:    String,
      default: '',
      trim:    true,
    },

    /**
     * score — AI-generated call quality score (0–10).
     * Shown on call card: "Score 7/10" (FRONTEND_SPEC §10)
     * SOURCE: DEVELOPER_HANDOFF.md §6 CallRecord.score
     */
    score: {
      type:    Number,
      default: 0,
      min:     0,
      max:     10,
    },

    /**
     * ai_generated — whether AI summary has been generated.
     * false = summary manually entered or not yet generated.
     * true  = summary generated via generateAiSummary().
     */
    ai_generated: {
      type:    Boolean,
      default: false,
    },

    // ── Attribution ───────────────────────────────────────────────────────────
    // Copied from lead at time of call creation for attribution reporting.
    source:   { type: String, default: null, trim: true },
    campaign: { type: String, default: null, trim: true },

    // ── Audit ─────────────────────────────────────────────────────────────────
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  {
    // Match timestamp convention used by Lead, Deal, and Booking models
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// ── Indexes — match repository access patterns ────────────────────────────────
callSchema.index({ tenant_id: 1, outcome: 1 });
callSchema.index({ tenant_id: 1, lead_id: 1 });
callSchema.index({ tenant_id: 1, call_date: -1 });
callSchema.index({ tenant_id: 1, assigned_user_id: 1 });

// Named export — matches Lead and Booking model export patterns
export const Call = mongoose.model('Call', callSchema);