/**
 * =============================================================================
 * InnovateX Revenue OS — Reports Constants
 * =============================================================================
 *
 * FILE: src/modules/reports/report.constants.js
 *
 * PURPOSE
 * ───────
 * Central constants for the Reports module — 9 tabbed reports, each with
 * KPIs + charts + table + CSV export, per MASTER_SPEC.md §B13:
 *   "9 tabbed reports (Lead, Pipeline, Attribution, WhatsApp, Campaign,
 *    Revenue, Sales Activity, Nurture, AI Qualification). Each: KPIs + charts
 *    + table + CSV export; date/source filters."
 *
 * NO DATABASE — this module owns no collection. It aggregates data that
 * already lives in Lead, Deal, Call, Booking, Payment, Campaign,
 * Qualification, TrackingEvent, and the WhatsApp submodules.
 * =============================================================================
 */

/** The 9 report tabs, used to validate the ?tab= query param on /export. */
export const REPORT_TAB = Object.freeze({
  LEAD:            'lead',
  PIPELINE:        'pipeline',
  ATTRIBUTION:     'attribution',
  WHATSAPP:        'whatsapp',
  CAMPAIGN:        'campaign',
  REVENUE:         'revenue',
  SALES_ACTIVITY:  'sales-activity',
  NURTURE:         'nurture',
  AI_QUALIFICATION:'ai-qualification',
});
export const REPORT_TAB_VALUES = Object.freeze(Object.values(REPORT_TAB));

/** Re-exported from lead.constants.js so this module doesn't import cross-domain enums at runtime paths that could drift. */
export const LEAD_STATUS_VALUES_REF = Object.freeze([
  'New', 'Contacted', 'Qualified', 'Booked', 'Call Completed',
  'Proposal Sent', 'Won', 'Lost', 'Nurture', 'Ghosted',
]);

/** Deal stages considered "closed" for win-rate calculations. */
export const CLOSED_DEAL_STAGES = Object.freeze(['Won', 'Lost']);
export const WON_DEAL_STAGE  = 'Won';
export const LOST_DEAL_STAGE = 'Lost';

/** Payment statuses considered successful revenue. */
export const REVENUE_PAYMENT_STATUS = 'Paid';
export const REFUNDED_PAYMENT_STATUS = 'Refunded';

/** Trend bucket granularity for time-series charts. */
export const TREND_GRANULARITY = Object.freeze({
  DAILY:   'daily',
  WEEKLY:  'weekly',
  MONTHLY: 'monthly',
});
export const TREND_GRANULARITY_VALUES = Object.freeze(Object.values(TREND_GRANULARITY));

/** Default row limit for report tables (top-N breakdowns). */
export const DEFAULT_TABLE_LIMIT = 20;
export const MAX_TABLE_LIMIT     = 200;
