/**
 * =============================================================================
 * InnovateX Revenue OS — Automation Repository
 * =============================================================================
 *
 * FILE: src/modules/automations/automation.repository.js
 *
 * Pattern matches booking.repository.js / attribution.repository.js exactly:
 *   - tenantId always first argument
 *   - All queries include { tenant_id: tenantId }
 *   - Returns raw Mongoose documents
 *   - No business logic, no validation, no formatting
 */

import { Automation } from './automation.model.js';
import { MAX_LOGS_STORED } from './automation.constants.js';

// =============================================================================
// CREATE
// =============================================================================

export const create = (data) => Automation.create(data);

// =============================================================================
// READ
// =============================================================================

export const findById = (tenantId, id) =>
  Automation.findOne({ _id: id, tenant_id: tenantId });

export const list = (tenantId, filter = {}, { skip = 0, limit = 20 } = {}) => {
  const query = buildQuery(tenantId, filter);
  return Automation.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
};

export const count = (tenantId, filter = {}) =>
  Automation.countDocuments(buildQuery(tenantId, filter));

/** Active automations matching a trigger type — used by the future dispatch() engine. */
export const findActiveByTrigger = (tenantId, triggerType) =>
  Automation.find({
    tenant_id: tenantId,
    'trigger.type': triggerType,
    status: 'active',
  });

// =============================================================================
// KPIs
// =============================================================================

export const getKpiCounts = async (tenantId) => {
  const [totals, statusAgg] = await Promise.all([
    Automation.aggregate([
      { $match: { tenant_id: tenantId } },
      { $group: { _id: null, total: { $sum: 1 }, totalRuns: { $sum: '$run_count' } } },
    ]),
    Automation.countDocuments({ tenant_id: tenantId, status: 'active' }),
  ]);

  return {
    total:     totals[0]?.total || 0,
    active:    statusAgg,
    totalRuns: totals[0]?.totalRuns || 0,
  };
};

// =============================================================================
// UPDATE
// =============================================================================

export const update = (tenantId, id, patch) =>
  Automation.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true },
  );

export const setStatus = (tenantId, id, status, updatedBy) =>
  Automation.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: { status, updated_by: updatedBy } },
    { new: true },
  );

/**
 * recordRun — appends a log entry, increments run_count, stamps last_run.
 * Trims the logs array to MAX_LOGS_STORED (oldest entries drop off first)
 * so a long-lived automation's document doesn't grow unbounded.
 */
export const recordRun = (tenantId, id, logEntry) =>
  Automation.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    {
      $inc: { run_count: 1 },
      $set: { last_run: logEntry.at },
      $push: {
        logs: {
          $each: [logEntry],
          $slice: -MAX_LOGS_STORED,
        },
      },
    },
    { new: true },
  );

// =============================================================================
// DELETE
// =============================================================================

export const remove = (tenantId, id) =>
  Automation.findOneAndDelete({ _id: id, tenant_id: tenantId });

// =============================================================================
// PRIVATE: BUILD QUERY
// =============================================================================

const buildQuery = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.status)  query.status = filter.status;
  if (filter.trigger) query['trigger.type'] = filter.trigger;
  if (filter.search) {
    query.name = { $regex: filter.search, $options: 'i' };
  }
  return query;
};
