/**
 * WhatsApp Automation Rules — repository.
 *
 * The only layer that touches AutomationRule and AutomationRuleHistory.
 * Every query is tenant-scoped. No business logic, no formatting.
 */
import { AutomationRule, AutomationRuleHistory } from './automationRules.model.js';
import { RULE_STATUS } from './automationRules.constants.js';

// ── AutomationRule ─────────────────────────────────────────────────────────────

export const automationRulesRepository = {
  createRule(data) {
    return AutomationRule.create(data);
  },

  findById(tenantId, id) {
    return AutomationRule.findOne({ _id: id, tenantId });
  },

  listRules(tenantId, filter = {}, { sort = { priority: -1, createdAt: -1 }, skip = 0, limit = 20 } = {}) {
    return AutomationRule.find({ tenantId, ...filter }).sort(sort).skip(skip).limit(limit);
  },

  countRules(tenantId, filter = {}) {
    return AutomationRule.countDocuments({ tenantId, ...filter });
  },

  /**
   * Fetch all ACTIVE rules for a given trigger type — used by the execution engine
   * when a real event fires. Ordered by priority descending.
   */
  findActiveByTrigger(tenantId, triggerType) {
    return AutomationRule.find({
      tenantId,
      'trigger.type': triggerType,
      status: RULE_STATUS.ACTIVE,
      isActive: true,
    }).sort({ priority: -1 });
  },

  updateRule(tenantId, id, patch) {
    return AutomationRule.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: patch },
      { new: true, runValidators: true },
    );
  },

  /**
   * Soft delete — sets isActive=false, status=ARCHIVED.
   * The document is never removed from the collection.
   */
  softDeleteRule(tenantId, id) {
    return AutomationRule.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { isActive: false, status: RULE_STATUS.ARCHIVED } },
      { new: true },
    );
  },

  toggleRule(tenantId, id, status, isActive) {
    return AutomationRule.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { status, isActive } },
      { new: true },
    );
  },

  incrementExecutionCount(tenantId, id, now) {
    return AutomationRule.findOneAndUpdate(
      { _id: id, tenantId },
      { $inc: { executionCount: 1 }, $set: { lastExecutedAt: now } },
      { new: true },
    );
  },

  // ── Execution history ────────────────────────────────────────────────────────

  saveHistory(data) {
    return AutomationRuleHistory.create(data);
  },

  listHistory(tenantId, automationId, { sort = { startedAt: -1 }, skip = 0, limit = 20 } = {}) {
    return AutomationRuleHistory.find({ tenantId, automationId }).sort(sort).skip(skip).limit(limit);
  },

  countHistory(tenantId, automationId) {
    return AutomationRuleHistory.countDocuments({ tenantId, automationId });
  },
};
