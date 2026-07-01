/**
 * Campaign Repository — only place that touches the campaigns collection.
 *
 * FILE: src/modules/campaigns/campaign.repository.js
 *
 * Pattern matches booking.repository.js exactly:
 *   - tenantId always first argument
 *   - All queries include { tenant_id: tenantId }
 *   - Returns raw Mongoose documents
 */

import { Campaign } from './campaign.model.js';

// =============================================================================
// FIND SINGLE
// =============================================================================

export const findById = (tenantId, id) =>
  Campaign.findOne({ _id: id, tenant_id: tenantId });

// =============================================================================
// FIND LIST — paginated with filters
// =============================================================================

/**
 * findByTenantId — paginated campaign list.
 * Filters: status, source, campaign_type
 */
export const findByTenantId = (
  tenantId,
  filter = {},
  { sort = { created_at: -1 }, skip = 0, limit = 20 } = {}
) => {
  const query = { tenant_id: tenantId };
  if (filter.status)        query.status        = filter.status;
  if (filter.source)        query.source        = filter.source;
  if (filter.campaign_type) query.campaign_type = filter.campaign_type;

  return Campaign.find(query).sort(sort).skip(skip).limit(limit);
};

export const countByTenantId = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.status)        query.status        = filter.status;
  if (filter.source)        query.source        = filter.source;
  if (filter.campaign_type) query.campaign_type = filter.campaign_type;
  return Campaign.countDocuments(query);
};

// =============================================================================
// KPI COUNTS — for KPI cards
// =============================================================================

/**
 * getKpiCounts — aggregate for the 4 KPI cards.
 * SOURCE: FRONTEND_SPEC §12 KPI row:
 *   Campaigns | Total Spend | Total Revenue | Blended ROAS
 */
export const getKpiCounts = async (tenantId) => {
  const [count, agg] = await Promise.all([
    Campaign.countDocuments({ tenant_id: tenantId }),
    Campaign.aggregate([
      { $match: { tenant_id: tenantId } },
      {
        $group: {
          _id:           null,
          totalSpend:    { $sum: '$spend' },
          totalRevenue:  { $sum: '$revenue' },
          totalBudget:   { $sum: '$budget' },
          totalLeads:    { $sum: '$leads_generated' },
          totalBookings: { $sum: '$bookings' },
        },
      },
    ]),
  ]);

  const totals      = agg[0] || {};
  const totalSpend   = totals.totalSpend   || 0;
  const totalRevenue = totals.totalRevenue || 0;
  const blendedRoas  = totalSpend > 0
    ? Math.round((totalRevenue / totalSpend) * 10) / 10
    : 0;

  return {
    totalCampaigns: count,
    totalSpend,
    totalRevenue,
    blendedRoas,
    totalBudget:    totals.totalBudget   || 0,
    totalLeads:     totals.totalLeads    || 0,
    totalBookings:  totals.totalBookings || 0,
  };
};

// =============================================================================
// REVENUE BY CAMPAIGN — for the bar chart
// =============================================================================

/**
 * getRevenueByCampaign — revenue per campaign for the bar chart.
 * SOURCE: FRONTEND_SPEC §12 "Revenue by Campaign" bar chart
 */
export const getRevenueByCampaign = (tenantId) =>
  Campaign.find({ tenant_id: tenantId }, {
    campaign_name: 1,
    revenue:       1,
    spend:         1,
    leads_generated: 1,
    bookings:      1,
    status:        1,
  }).sort({ revenue: -1 });

// =============================================================================
// CREATE
// =============================================================================

export const create = (data) => Campaign.create(data);

// =============================================================================
// UPDATE
// =============================================================================

export const updateById = (tenantId, id, patch) =>
  Campaign.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true }
  );

// =============================================================================
// DELETE (soft via status = 'Failed')
// =============================================================================

export const deleteById = (tenantId, id) =>
  Campaign.findOneAndDelete({ _id: id, tenant_id: tenantId });

// =============================================================================
// INCREMENT METRICS — atomic updates from leads/bookings/payments
// =============================================================================

/**
 * incrementMetric — atomically increments a campaign metric.
 * Called when a lead, booking, or payment is attributed to a campaign.
 *
 * @param {string} tenantId
 * @param {string} campaignName — matches campaign_name field
 * @param {string} field        — 'leads_generated' | 'bookings' | 'revenue' | 'spend'
 * @param {number} delta        — amount to add (positive or negative)
 */
export const incrementMetric = (tenantId, campaignName, field, delta = 1) =>
  Campaign.findOneAndUpdate(
    { tenant_id: tenantId, campaign_name: campaignName },
    { $inc: { [field]: delta } },
    { new: true }
  );