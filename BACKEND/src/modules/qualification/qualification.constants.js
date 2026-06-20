/**
 * AI Qualification domain constants.
 *
 * SOURCE: MASTER_SPEC.md §B5, §I2
 *         DEVELOPER_HANDOFF.md — qualifyLead action + aiService.qualifyLead()
 *         FRONTEND_SPEC.md §6 AI Qualification page
 *
 * Pattern matches booking.constants.js and call.constants.js exactly.
 */

/**
 * QUALIFICATION_ROUTE — what to do after applying a qualification result.
 * SOURCE: FRONTEND_SPEC §6 "apply & route (booking / nurture / sales)"
 */
export const QUALIFICATION_ROUTE = Object.freeze({
  BOOK_CALL:    'book_call',    // Hot leads → book immediately
  ADD_NURTURE:  'add_nurture',  // Warm leads → nurture sequence
  SALES_REVIEW: 'sales_review', // Cold leads → manual review
});

/**
 * QUALITY_GRADE — lead quality classification from AI assessment.
 * SOURCE: DEVELOPER_HANDOFF.md aiService.qualifyLead() → quality field
 * SOURCE: FRONTEND_SPEC §6 — quality shown in AI assessment panel
 */
export const QUALITY_GRADE = Object.freeze({
  A: 'A', // fitScore >= 8
  B: 'B', // fitScore >= 5
  C: 'C', // fitScore < 5
});

/**
 * BUYING_INTENT — buyer intent level from discovery answers.
 * SOURCE: DEVELOPER_HANDOFF.md aiService.qualifyLead() → buyingIntent field
 */
export const BUYING_INTENT = Object.freeze({
  HIGH:   'high',
  MEDIUM: 'medium',
  LOW:    'low',
});

/**
 * TRACKING_EVENT_ON_QUALIFY — event emitted when qualification is applied.
 * SOURCE: MASTER_SPEC.md §I2 TrackingEventType (18 types) — 'AI Qualified'
 *         DEVELOPER_HANDOFF.md qualifyLead → "track('AI Qualified')"
 */
export const TRACKING_EVENT_ON_QUALIFY = 'AI Qualified';

/**
 * LEAD_STATUS_ON_QUALIFY — lead status set when qualification is applied.
 * SOURCE: DEVELOPER_HANDOFF.md qualifyLead → "updates score/temp/status"
 *         lead.constants.js → LEAD_STATUS.QUALIFIED = 'Qualified'
 */
export const LEAD_STATUS_ON_QUALIFY = 'Qualified';

/**
 * PIPELINE_STAGE_ON_QUALIFY — deal stage set when qualification is applied.
 * SOURCE: deal.constants.js → DEAL_STAGE.QUALIFIED = 'Qualified'
 * Only applied when lead was New or Contacted (not already further in pipeline).
 */
export const PIPELINE_STAGE_ON_QUALIFY = 'Qualified';