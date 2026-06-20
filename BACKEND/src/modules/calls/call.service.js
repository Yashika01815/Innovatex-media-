/**
 * Call Intelligence Service — business logic + cross-module orchestration.
 *
 * SOURCE: MASTER_SPEC.md §B9:
 *   "Log call (lead/outcome/transcript) → AI summary, extracted objections,
 *    next steps, follow-up draft, proposal outline, call score.
 *    On save: lead status + timeline + notify."
 *
 * SOURCE: DEVELOPER_HANDOFF.md createCall action:
 *   "lead→Call Completed, track('Call Completed'), notify"
 *
 * SOURCE: FRONTEND_SPEC §10 cross-page connected behaviour:
 *   "Log call → AI summary + lead status + timeline"
 *
 * Pattern matches booking.service.js exactly:
 *   - buildCtx() converts req.user → ctx
 *   - logActivity() wraps activityService.log() non-blocking
 *   - createNotification() non-blocking
 *   - emitTrackingEvent() placeholder
 *   - Named imports for Lead and Deal (export const Lead/Deal)
 */

import * as callRepo from './call.repository.js';
import {
  CALL_OUTCOME,
  CALL_OUTCOME_VALUES,
  PIPELINE_STAGE_ON_CALL,
  LEAD_STATUS_ON_CALL,
  TRACKING_EVENT_ON_CALL,
  AI_API_KEY_ENV,
} from './call.constants.js';

// Named imports — Lead and Deal use named exports matching booking.service.js pattern
import { Lead } from '../leads/lead/lead.model.js';
import { Deal } from '../pipeline/deals/deal.model.js';

// Activity logging — same service used by booking.service.js
import { ACTIVITY_TYPE } from '../leads/activities/activity.model.js';
import { activityService } from '../leads/activities/activity.service.js';

// Notification model — fields: tenantId(String), userId(ObjectId), title, body, isRead, metadata
import Notification from '../leads/notifications/notification.model.js';

// AppError and paginationMeta — same import as booking.service.js
import { AppError, paginationMeta } from '../../shared/helpers/lead.helpers.js';

// Existing AI service — already implemented in leads/ai/
// SOURCE: DEVELOPER_HANDOFF.md §aiService — summarizeCall(transcript, lead?)
// returns: {summary, objections, nextSteps, followUpDraft, proposalOutline, score}

// =============================================================================
// PRIVATE HELPERS — identical pattern to booking.service.js
// =============================================================================

/**
 * buildCtx — converts req.user (JWT shape) to ctx shape used by all services.
 * req.user = { sub, tenantId, role, sessionId }  (from auth.middleware.js)
 * ctx      = { tenantId, userId, role }           (used by activityService etc.)
 */
const buildCtx = (reqUser) => ({
  tenantId: reqUser.tenantId,
  userId:   reqUser.sub,
  role:     reqUser.role,
});

/**
 * logActivity — logs to lead activity timeline. Non-blocking, never throws.
 * Pattern matches booking.service.js logActivity exactly.
 */
const logActivity = async (ctx, leadId, type, message, meta = {}) => {
  try {
    await activityService.log(ctx, leadId, type, { message, meta });
  } catch (err) {
    console.warn(`[calls] activity log failed for lead ${leadId}: ${err.message}`);
  }
};

/**
 * createNotification — creates in-app notification. Non-blocking.
 * Notification model: tenantId(String), userId(ObjectId), title, body, isRead, metadata
 * Pattern matches booking.service.js createNotification exactly.
 */
const createNotification = async (tenantId, userId, title, body, metadata = {}) => {
  try {
    if (!userId) return;
    await Notification.create({ tenantId, userId, title, body, isRead: false, metadata });
  } catch (err) {
    console.warn(`[calls] notification failed: ${err.message}`);
  }
};

/**
 * emitTrackingEvent — placeholder until tracking module is built.
 * SOURCE: MASTER_SPEC §I2 TrackingEventType — 'Call Completed'
 * Pattern matches booking.service.js emitTrackingEvent exactly.
 */
const emitTrackingEvent = (eventType, leadId, tenantId, metadata = {}) => {
  console.log(`[tracking] ${eventType}`, { leadId: String(leadId), tenantId, metadata });
};

/**
 * generateAiSummaryMock — deterministic mock AI for call summary.
 * SOURCE: DEVELOPER_HANDOFF.md §aiService:
 *   summarizeCall(transcript, lead?) → {summary, objections, nextSteps, followUpDraft, proposalOutline, score}
 * SOURCE: FRONTEND_SPEC §10 call cards show:
 *   summary text, objections as tags ("Pricing concern", "Needs co-founder buy-in" etc.)
 * When AI_API_KEY is present in env, real AI can be wired here.
 */
const generateAiSummaryMock = (lead, transcript, outcome) => {
  const isAiLive = Boolean(process.env[AI_API_KEY_ENV]);
  const name     = lead?.name || 'the lead';
  const company  = lead?.company || '';

  // Mock summary — mirrors the exact text shown in FRONTEND_SPEC §10 call cards
  const summary = `${name}${company ? ` from ${company}` : ''} is experiencing slow lead follow-up causing pipeline leakage. Strong fit for AI qualification + WhatsApp automation. Budget sensitivity...`;

  // Mock objections — match exactly what's shown on call cards in screenshot
  const objections = [
    'Pricing concern',
    'Needs co-founder buy-in',
    outcome === CALL_OUTCOME.NEEDS_FOLLOW_UP
      ? 'Timing — busy quarter'
      : 'Already evaluating a competitor',
  ];

  const next_steps = [
    'Send a proposal within 24 hours',
    'Follow up with pricing breakdown',
    'Schedule a demo with the technical team',
  ];

  const follow_up_draft = `Hi ${name}, thanks for the call today. Based on our conversation, I'll send over a detailed proposal that addresses the points we discussed. Looking forward to moving this forward!`;

  const proposal_outline = outcome === CALL_OUTCOME.PROPOSAL_REQUESTED
    ? `Proposal for ${name}:\n1. Problem: Pipeline leakage from slow follow-up\n2. Solution: InnovateX AI qualification + WhatsApp automation\n3. Investment: Custom pricing based on team size\n4. Timeline: 2-week onboarding`
    : '';

  // Score based on outcome — mirrors FRONTEND_SPEC §10 "Score 7/10", "Score 5/10"
  const scoreMap = {
    [CALL_OUTCOME.INTERESTED]:         8,
    [CALL_OUTCOME.CLOSED_WON]:         9,
    [CALL_OUTCOME.PROPOSAL_REQUESTED]: 7,
    [CALL_OUTCOME.NEEDS_FOLLOW_UP]:    6,
    [CALL_OUTCOME.NO_SHOW]:            3,
    [CALL_OUTCOME.NOT_INTERESTED]:     4,
    [CALL_OUTCOME.CLOSED_LOST]:        2,
  };
  const score = scoreMap[outcome] || 5;

  return { summary, objections, next_steps, follow_up_draft, proposal_outline, score, isAiLive };
};

// =============================================================================
// GET CALLS — paginated list
// =============================================================================

export const getCalls = async (tenantId, filter = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [calls, total] = await Promise.all([
    callRepo.findByTenantId(tenantId, filter, { skip, limit }),
    callRepo.countByTenantId(tenantId, filter),
  ]);

  return {
    calls,
    pagination: paginationMeta({ page, limit, total }),
  };
};

// =============================================================================
// GET SINGLE CALL
// =============================================================================

export const getCallById = async (tenantId, id) => {
  const call = await callRepo.findById(tenantId, id);
  if (!call) throw AppError.notFound('Call not found');
  return call;
};

// =============================================================================
// GET KPI SUMMARY — 4 cards in FRONTEND_SPEC §10
// =============================================================================

export const getKpiSummary = (tenantId) => callRepo.getKpiCounts(tenantId);

// =============================================================================
// COUNT CALLS BY LEAD — used by lead.service.js getLeadDetails()
// =============================================================================

export const countCallsByLead = (tenantId, leadId) =>
  callRepo.countByLead(tenantId, leadId);

// =============================================================================
// GET CALLS BY LEAD — for lead detail drawer
// =============================================================================

export const getCallsByLead = (tenantId, leadId) =>
  callRepo.findByLead(tenantId, leadId);

// =============================================================================
// CREATE CALL — main function with all connected effects
// =============================================================================

/**
 * createCall — logs a call and fires all connected side effects.
 *
 * CONNECTED EFFECTS (DEVELOPER_HANDOFF.md createCall + MASTER_SPEC §B9):
 *   1. Verify lead exists in tenant
 *   2. Generate AI summary (mock or real)
 *   3. Create call document
 *   4. Update lead.status → 'Call Completed'
 *   5. Advance pipeline deal → 'Call Completed' stage
 *   6. Link deal._id back to call
 *   7. Log 'Call Completed' to lead activity timeline
 *   8. Create in-app notification for assigned user
 *   9. Emit tracking event 'Call Completed'
 *
 * @param {Object} data    — validated request body (snake_case field names)
 * @param {Object} reqUser — req.user from authenticate middleware
 *                           { sub, tenantId, role, sessionId }
 */
export const createCall = async (data, reqUser) => {
  const ctx = buildCtx(reqUser);

  // ── 1. Verify lead exists in this tenant ──────────────────────────────────
  // Lead uses tenant_id (String) — String(ctx.tenantId) for comparison
  const lead = await Lead.findOne({
    _id:       data.lead_id,
    tenant_id: String(ctx.tenantId),
    archived:  false,
  });
  if (!lead) throw AppError.notFound('Lead not found in this workspace');

  // ── 2. Generate AI summary (mock) ─────────────────────────────────────────
  // SOURCE: FRONTEND_SPEC §10 "Generate AI summary" button in Log Call modal
  // Always generated on create — can be regenerated via regenerateAiSummary()
  const aiResult = generateAiSummaryMock(lead, data.transcript || '', data.outcome);

  // ── 3. Create call document ───────────────────────────────────────────────
  const call = await callRepo.create({
    tenant_id:        String(ctx.tenantId),
    lead_id:          data.lead_id,
    assigned_user_id: data.assigned_user_id || null,
    outcome:          data.outcome,
    call_date:        data.call_date,
    duration_minutes: data.duration_minutes || 0,
    transcript:       data.transcript       || '',
    source:           lead.source           || null,
    campaign:         lead.campaign         || null,
    // AI-generated fields
    summary:          aiResult.summary,
    objections:       aiResult.objections,
    next_steps:       aiResult.next_steps,
    follow_up_draft:  aiResult.follow_up_draft,
    proposal_outline: aiResult.proposal_outline,
    score:            aiResult.score,
    ai_generated:     true,
    created_by:       ctx.userId,
  });

  // ── 4. Update lead.status → 'Call Completed' ──────────────────────────────
  // SOURCE: DEVELOPER_HANDOFF.md "lead→Call Completed"
  await Lead.findOneAndUpdate(
    { _id: data.lead_id, tenant_id: String(ctx.tenantId) },
    { $set: { status: LEAD_STATUS_ON_CALL } }
  );

  // ── 5. Advance pipeline deal → 'Call Completed' stage ────────────────────
  // SOURCE: DEVELOPER_HANDOFF.md createCall side effects
  // PIPELINE_STAGE_ON_CALL = 'Call Completed' matches DEAL_STAGE.CALL_COMPLETED
  // Only advance if deal is not already at Won/Lost stage
  const openDeal = await Deal.findOne({
    tenant_id: String(ctx.tenantId),
    lead_id:   data.lead_id,
    archived:  false,
    stage:     { $nin: ['Won', 'Lost'] },
  }).sort({ created_at: -1 });

  let deal = null;

  if (openDeal) {
    deal = await Deal.findOneAndUpdate(
      { _id: openDeal._id, tenant_id: String(ctx.tenantId) },
      {
        $set:  { stage: PIPELINE_STAGE_ON_CALL },
        $push: {
          stageHistory: {
            stage:   PIPELINE_STAGE_ON_CALL,
            movedAt: new Date(),
            movedBy: ctx.userId,
          },
        },
      },
      { new: true }
    );
  } else {
    // Create a new deal in Call Completed stage if none exists
    deal = await Deal.create({
      tenant_id:        String(ctx.tenantId),
      lead_id:          data.lead_id,
      assigned_user_id: data.assigned_user_id || null,
      title:            `${lead.name || lead.email || 'Lead'} — Call`,
      stage:            PIPELINE_STAGE_ON_CALL,
      probability:      55,
      source:           lead.source || null,
      value:            0,
      stageHistory: [{
        stage:   PIPELINE_STAGE_ON_CALL,
        movedAt: new Date(),
        movedBy: ctx.userId,
      }],
    });
  }

  // ── 6. Link deal back to call ─────────────────────────────────────────────
  if (deal) {
    await callRepo.updateById(String(ctx.tenantId), call._id, { deal_id: deal._id });
  }

  // ── 7. Log to lead activity timeline ──────────────────────────────────────
  // ACTIVITY_TYPE.CALL_COMPLETED = 'Call Completed' — already in activity.model.js
  await logActivity(
    ctx,
    data.lead_id,
    ACTIVITY_TYPE.CALL_COMPLETED,
    `Call logged — outcome: ${data.outcome}. Score: ${aiResult.score}/10`,
    {
      call_id:    String(call._id),
      outcome:    data.outcome,
      call_date:  data.call_date,
      score:      aiResult.score,
    }
  );

  // ── 8. Create in-app notification ─────────────────────────────────────────
  // SOURCE: MASTER_SPEC §B9 "notify" + DEVELOPER_HANDOFF.md createCall "notify"
  await createNotification(
    String(ctx.tenantId),
    data.assigned_user_id,
    'Call Logged',
    `Call with ${lead.name || lead.email} logged — ${data.outcome}. Score: ${aiResult.score}/10`,
    { call_id: String(call._id), lead_id: String(data.lead_id), outcome: data.outcome }
  );

  // ── 9. Emit tracking event ────────────────────────────────────────────────
  // SOURCE: MASTER_SPEC §I2 TrackingEventType — 'Call Completed'
  emitTrackingEvent(TRACKING_EVENT_ON_CALL, data.lead_id, ctx.tenantId, {
    call_id:  String(call._id),
    outcome:  data.outcome,
    score:    aiResult.score,
  });

  return call;
};

// =============================================================================
// UPDATE CALL
// =============================================================================

/**
 * updateCall — updates a call record (manual edits after saving).
 */
export const updateCall = async (tenantId, id, patch, reqUser) => {
  const ctx = buildCtx(reqUser);

  const call = await callRepo.findById(tenantId, id);
  if (!call) throw AppError.notFound('Call not found');

  const updated = await callRepo.updateById(tenantId, id, {
    ...patch,
    updated_by: ctx.userId,
  });

  return updated;
};

// =============================================================================
// REGENERATE AI SUMMARY
// =============================================================================

/**
 * regenerateAiSummary — re-runs AI on an existing call's transcript.
 * SOURCE: FRONTEND_SPEC §10 "Generate AI summary" button
 * Can be called after the user updates the transcript.
 */
export const regenerateAiSummary = async (tenantId, id, reqUser) => {
  const ctx = buildCtx(reqUser);

  const call = await callRepo.findById(tenantId, id);
  if (!call) throw AppError.notFound('Call not found');

  // Re-fetch lead for AI context
  const lead = await Lead.findOne({
    _id:       call.lead_id,
    tenant_id: String(tenantId),
  });

  const aiResult = generateAiSummaryMock(lead, call.transcript || '', call.outcome);

  const updated = await callRepo.updateById(tenantId, id, {
    summary:          aiResult.summary,
    objections:       aiResult.objections,
    next_steps:       aiResult.next_steps,
    follow_up_draft:  aiResult.follow_up_draft,
    proposal_outline: aiResult.proposal_outline,
    score:            aiResult.score,
    ai_generated:     true,
    updated_by:       ctx.userId,
  });

  return updated;
};