/**
 * AI Qualification Repository — only place that touches the qualifications collection.
 * No business rules, no events. All queries are tenant-scoped.
 *
 * Pattern matches booking.repository.js and call.repository.js exactly:
 *   - tenantId is always first argument
 *   - Queries always include { tenant_id: tenantId }
 *   - Returns raw Mongoose documents
 */

import { Qualification } from './qualification.model.js';

/** findById — single qualification scoped to tenant, with lead populated. */
export const findById = (tenantId, id) =>
  Qualification.findOne({ _id: id, tenant_id: tenantId })
    .populate('lead_id', 'name email company source qualification_score lead_temperature status');

/**
 * findByTenantId — paginated list with filters.
 */
export const findByTenantId = (
  tenantId,
  filter = {},
  { sort = { created_at: -1 }, skip = 0, limit = 20 } = {}
) => {
  const query = { tenant_id: tenantId };
  if (filter.applied   !== undefined) query.applied     = filter.applied;
  if (filter.temperature)             query.temperature  = filter.temperature;
  if (filter.lead_id)                 query.lead_id      = filter.lead_id;

  return Qualification.find(query)
    .populate('lead_id', 'name email company source qualification_score lead_temperature status')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/** countByTenantId — total count for pagination. */
export const countByTenantId = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.applied    !== undefined) query.applied     = filter.applied;
  if (filter.temperature)              query.temperature  = filter.temperature;
  if (filter.lead_id)                  query.lead_id      = filter.lead_id;
  return Qualification.countDocuments(query);
};

/**
 * findByLead — all qualification records for a lead, newest first.
 * Used in lead detail drawer history.
 */
export const findByLead = (tenantId, leadId) =>
  Qualification.find({ tenant_id: tenantId, lead_id: leadId })
    .sort({ created_at: -1 });

/**
 * findLatestByLead — most recent qualification result for a lead.
 * Used to show current assessment in lead drawer.
 * SOURCE: FRONTEND_SPEC §4 lead drawer — shows current AI assessment
 */
export const findLatestByLead = (tenantId, leadId) =>
  Qualification.findOne({ tenant_id: tenantId, lead_id: leadId })
    .sort({ created_at: -1 });

/** countByLead — total qualifications run for a lead. */
export const countByLead = (tenantId, leadId) =>
  Qualification.countDocuments({ tenant_id: tenantId, lead_id: leadId });

/** create — creates a new qualification record. */
export const create = (data) => Qualification.create(data);

/** updateById — partial update scoped to tenant, returns updated document. */
export const updateById = (tenantId, id, patch) =>
  Qualification.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true }
  );