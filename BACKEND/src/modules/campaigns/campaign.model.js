/**
 * Campaign (marketing) model.
 *
 * FILE: src/modules/campaigns/campaign.model.js
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 Campaign (marketing) entity:
 *   "campaign_name, source, medium, campaign_type, budget, spend,
 *    start_date, end_date, status, leads_generated, bookings, revenue"
 *
 * SOURCE: MASTER_SPEC §B11:
 *   "budget/spend/leads/bookings/revenue/ROAS; CSV"
 *
 * SOURCE: FRONTEND_SPEC §12 table columns:
 *   Campaign | Source | Type | Status | Budget | Leads | Bookings | Revenue | Link
 *
 * NAMING: snake_case — matches Lead, Booking, Call, Qualification models.
 * TIMESTAMPS: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false
 * EXPORT: named export — matches all other model patterns
 *
 * COLLECTION: campaigns
 */

import mongoose from 'mongoose';
import {
  CAMPAIGN_STATUS,
  CAMPAIGN_STATUS_VALUES,
  CAMPAIGN_TYPE_VALUES,
  CAMPAIGN_SOURCE_VALUES,
  CAMPAIGN_MEDIUM_VALUES,
} from './campaign.constants.js';

const { Schema } = mongoose;

const campaignSchema = new Schema(
  {
    // ── Tenant scope ──────────────────────────────────────────────────────────
    tenant_id: {
      type:     String,
      required: [true, 'tenant_id is required'],
      index:    true,
    },

    // ── Campaign identity ─────────────────────────────────────────────────────

    /**
     * campaign_name — unique campaign identifier / slug.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.campaign_name
     * FRONTEND_SPEC §12 modal placeholder: "e.g. summer_webinar"
     * Shown in Campaign column of table and in bar chart x-axis.
     */
    campaign_name: {
      type:     String,
      required: [true, 'campaign_name is required'],
      trim:     true,
      maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    },

    /**
     * source — traffic source for this campaign.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.source
     * FRONTEND_SPEC §12 Source column + modal Source dropdown
     */
    source: {
      type:  String,
      enum:  CAMPAIGN_SOURCE_VALUES,
      required: [true, 'source is required'],
      index: true,
    },

    /**
     * medium — traffic medium.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.medium
     * FRONTEND_SPEC §12 modal Medium dropdown (shows "paid")
     */
    medium: {
      type:    String,
      enum:    CAMPAIGN_MEDIUM_VALUES,
      default: 'paid',
    },

    /**
     * campaign_type — type of marketing activity.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.campaign_type
     * FRONTEND_SPEC §12 Type column + modal Type field
     * Values: Paid Ads, Retargeting, Email, ABM, Organic, Referral...
     */
    campaign_type: {
      type:     String,
      enum:     CAMPAIGN_TYPE_VALUES,
      required: [true, 'campaign_type is required'],
    },

    /**
     * status — current state of the campaign.
     * SOURCE: MASTER_SPEC §I2 CampaignStatus (9 values)
     * FRONTEND_SPEC §12 Status column with coloured badges
     */
    status: {
      type:    String,
      enum:    CAMPAIGN_STATUS_VALUES,
      default: CAMPAIGN_STATUS.DRAFT,
      index:   true,
    },

    // ── Budget & Financials ───────────────────────────────────────────────────

    /**
     * budget — planned total spend for this campaign (USD).
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.budget
     * FRONTEND_SPEC §12 Budget column shows "$5,000", "$11,000" etc.
     */
    budget: {
      type:    Number,
      default: 0,
      min:     0,
    },

    /**
     * spend — actual spend so far (USD).
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.spend
     * MASTER_SPEC §B11 "budget/spend/leads/bookings/revenue/ROAS"
     */
    spend: {
      type:    Number,
      default: 0,
      min:     0,
    },

    /**
     * revenue — attributed revenue from this campaign (USD).
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.revenue
     * FRONTEND_SPEC §12 Revenue column shows "$94,000", "$17,000" etc.
     * Also drives "Revenue by Campaign" bar chart.
     */
    revenue: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Performance Metrics ───────────────────────────────────────────────────

    /**
     * leads_generated — count of leads attributed to this campaign.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.leads_generated
     * FRONTEND_SPEC §12 Leads column shows "299", "145" etc.
     */
    leads_generated: {
      type:    Number,
      default: 0,
      min:     0,
    },

    /**
     * bookings — count of bookings attributed to this campaign.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.bookings
     * FRONTEND_SPEC §12 Bookings column shows "53", "26" etc.
     */
    bookings: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Dates ─────────────────────────────────────────────────────────────────

    /**
     * start_date / end_date — campaign date range.
     * SOURCE: DEVELOPER_HANDOFF.md Campaign.start_date, end_date
     */
    start_date: { type: String, default: null }, // YYYY-MM-DD
    end_date:   { type: String, default: null }, // YYYY-MM-DD

    // ── UTM Tracking Link ─────────────────────────────────────────────────────

    /**
     * utm_tracking_link — auto-generated UTM capture URL.
     * SOURCE: MASTER_SPEC §B11 "UTM tracking-link generator (copyable, feeds /capture)"
     * FORMAT: /capture?source=<source>&utm_source=<source>&utm_medium=<medium>&utm_campaign=<name>
     * Generated by campaign.service.js generateUtmLink() on create.
     * Shown in LINK column of table (copy icon).
     */
    utm_tracking_link: {
      type:    String,
      default: null,
    },

    // ── Audit ─────────────────────────────────────────────────────────────────
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────

/**
 * roas — Return on Ad Spend = revenue / spend.
 * SOURCE: MASTER_SPEC §B11 "ROAS"
 * FRONTEND_SPEC §12 KPI card "Blended ROAS: 9.7x"
 */
campaignSchema.virtual('roas').get(function () {
  if (!this.spend || this.spend === 0) return 0;
  return Math.round((this.revenue / this.spend) * 10) / 10;
});

// ── Indexes ───────────────────────────────────────────────────────────────────
campaignSchema.index({ tenant_id: 1, status: 1 });
campaignSchema.index({ tenant_id: 1, source: 1 });
campaignSchema.index({ tenant_id: 1, created_at: -1 });

// Named export — matches Lead, Call, Booking, Qualification patterns
export const Campaign = mongoose.model('Campaign', campaignSchema, 'campaigns');