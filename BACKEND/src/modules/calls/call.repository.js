/**
 * Call Intelligence Repository — the only place that touches the calls collection.
 * No business rules, no events. All queries are tenant-scoped.
 *
 * Pattern matches booking.repository.js exactly:
 *   - tenantId is always first argument
 *   - Queries always include { tenant_id: tenantId }
 *   - Returns raw Mongoose documents
 */

import { Call } from './call.model.js';
import { CALL_OUTCOME } from './call.constants.js';

/** findById — single call scoped to tenant, with lead and deal populated. */
export const findById = (tenantId, id) =>
  Call.findOne({ _id: id, tenant_id: tenantId })
    .populate('lead_id',  'name email source company')
    .populate('deal_id',  'stage value');

/**
 * findByTenantId — paginated call list with filters.
 * Filters align with FRONTEND_SPEC §10 call cards.
 */
export const findByTenantId = (
  tenantId,
  filter = {},
  { sort = { call_date: -1, created_at: -1 }, skip = 0, limit = 20 } = {}
) => {
  const query = { tenant_id: tenantId };

  if (filter.outcome)          query.outcome          = filter.outcome;
  if (filter.assigned_user_id) query.assigned_user_id = filter.assigned_user_id;
  if (filter.date_from || filter.date_to) {
    query.call_date = {};
    if (filter.date_from) query.call_date.$gte = filter.date_from;
    if (filter.date_to)   query.call_date.$lte = filter.date_to;
  }

  return Call.find(query)
    .populate('lead_id', 'name email source company')
    .populate('deal_id', 'stage value')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/** countByTenantId — total count for pagination. */
export const countByTenantId = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.outcome)          query.outcome          = filter.outcome;
  if (filter.assigned_user_id) query.assigned_user_id = filter.assigned_user_id;
  return Call.countDocuments(query);
};

/**
 * findByLead — all calls for a specific lead.
 * Used in lead detail drawer (FRONTEND_SPEC §4 linked record counts).
 */
export const findByLead = (tenantId, leadId) =>
  Call.find({ tenant_id: tenantId, lead_id: leadId })
    .sort({ call_date: -1, created_at: -1 });

/** countByLead — call count for a lead (for lead.service.js getLeadDetails). */
export const countByLead = (tenantId, leadId) =>
  Call.countDocuments({ tenant_id: tenantId, lead_id: leadId });

/**
 * getKpiCounts — aggregate counts for the 4 KPI cards.
 * SOURCE: FRONTEND_SPEC §10 — Total Calls | Proposals Requested | Closed Won | Avg Call Score
 */
export const getKpiCounts = async (tenantId) => {
  const [total, proposalsRequested, closedWon, scoreAgg] = await Promise.all([
    Call.countDocuments({ tenant_id: tenantId }),
    Call.countDocuments({ tenant_id: tenantId, outcome: CALL_OUTCOME.PROPOSAL_REQUESTED }),
    Call.countDocuments({ tenant_id: tenantId, outcome: CALL_OUTCOME.CLOSED_WON }),
    Call.aggregate([
      { $match: { tenant_id: tenantId, score: { $gt: 0 } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } },
    ]),
  ]);

  const avgCallScore = scoreAgg.length > 0
    ? Math.round(scoreAgg[0].avgScore * 10) / 10
    : 0;

  return { total, proposalsRequested, closedWon, avgCallScore };
};

/** create — creates a new call document. */
export const create = (data) => Call.create(data);

/** updateById — partial update scoped to tenant, returns updated document. */
export const updateById = (tenantId, id, patch) =>
  Call.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true }
  );