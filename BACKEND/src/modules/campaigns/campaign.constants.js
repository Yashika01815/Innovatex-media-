/**
 * Campaign (marketing) domain constants.
 *
 * FILE: src/modules/campaigns/campaign.constants.js
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 Campaign (marketing) entity:
 *   "campaign_name, source, medium, campaign_type, budget, spend,
 *    start_date, end_date, status, leads_generated, bookings, revenue"
 *
 * SOURCE: MASTER_SPEC.md §B11:
 *   "Create campaign; UTM tracking-link generator (copyable, feeds /capture);
 *    budget/spend/leads/bookings/revenue/ROAS; CSV"
 *
 * SOURCE: MASTER_SPEC.md §I2 CampaignStatus(9):
 *   Draft, Pending Approval, Approved, Scheduled, Sending, Sent, Paused, Completed, Failed
 *
 * SOURCE: FRONTEND_SPEC §12 — New Campaign modal fields visible in screenshot:
 *   Campaign Name | Source | Type | Medium | Budget
 *   Table columns: Campaign | Source | Type | Status | Budget | Leads | Bookings | Revenue | Link
 */

/**
 * CAMPAIGN_STATUS — 9 values from MASTER_SPEC.md §I2 CampaignStatus.
 * NOTE: These are the WhatsApp campaign statuses from spec.
 * Marketing campaigns (this module) use a simpler subset.
 */
export const CAMPAIGN_STATUS = Object.freeze({
  DRAFT:            'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED:         'Approved',
  SCHEDULED:        'Scheduled',
  SENDING:          'Sending',
  SENT:             'Sent',
  PAUSED:           'Paused',
  COMPLETED:        'Completed',
  FAILED:           'Failed',
});
export const CAMPAIGN_STATUS_VALUES = Object.freeze(Object.values(CAMPAIGN_STATUS));

/**
 * CAMPAIGN_TYPE — from frontend screenshot: Paid Ads, Retargeting, Email, ABM, Organic, Referral
 * SOURCE: FRONTEND_SPEC §12 Type column values visible in table
 */
export const CAMPAIGN_TYPE = Object.freeze({
  PAID_ADS:    'Paid Ads',
  RETARGETING: 'Retargeting',
  EMAIL:       'Email',
  ABM:         'ABM',
  ORGANIC:     'Organic',
  REFERRAL:    'Referral',
  SOCIAL:      'Social',
  WEBINAR:     'Webinar',
  CONTENT:     'Content',
});
export const CAMPAIGN_TYPE_VALUES = Object.freeze(Object.values(CAMPAIGN_TYPE));

/**
 * CAMPAIGN_SOURCE — sources visible in frontend screenshot table
 * SOURCE: FRONTEND_SPEC §12 Source column: Cold Outreach, Webinar, Organic, YouTube, LinkedIn
 */
export const CAMPAIGN_SOURCE = Object.freeze({
  META_ADS:      'Meta Ads',
  GOOGLE_ADS:    'Google Ads',
  YOUTUBE:       'YouTube',
  LINKEDIN:      'LinkedIn',
  ORGANIC:       'Organic',
  COLD_OUTREACH: 'Cold Outreach',
  WEBINAR:       'Webinar',
  REFERRAL:      'Referral',
  WHATSAPP:      'WhatsApp',
  EMAIL:         'Email',
});
export const CAMPAIGN_SOURCE_VALUES = Object.freeze(Object.values(CAMPAIGN_SOURCE));

/**
 * CAMPAIGN_MEDIUM — from New Campaign modal dropdown in frontend screenshot
 * SOURCE: FRONTEND_SPEC §12 modal — Medium dropdown shows "paid"
 */
export const CAMPAIGN_MEDIUM = Object.freeze({
  PAID:     'paid',
  ORGANIC:  'organic',
  EMAIL:    'email',
  SOCIAL:   'social',
  REFERRAL: 'referral',
  DIRECT:   'direct',
});
export const CAMPAIGN_MEDIUM_VALUES = Object.freeze(Object.values(CAMPAIGN_MEDIUM));

/**
 * UTM_CAPTURE_BASE — base URL for the UTM tracking link generator.
 * SOURCE: MASTER_SPEC §B11 "UTM tracking-link generator (/capture?source=&utm_source=...)"
 * SOURCE: DEVELOPER_HANDOFF.md campaign tracking link format
 * Resolved at runtime from CLIENT_URL env var.
 */
export const UTM_CAPTURE_PATH = '/capture';