/**
 * WhatsApp Automation Rules — service.
 *
 * Contains ALL business logic:
 *   • Rule CRUD (create, read, list, update, soft-delete, duplicate, toggle)
 *   • Trigger validation
 *   • Condition evaluation (AND / OR logic)
 *   • Action execution engine (simulate now; integrate live services later)
 *   • Manual run (simulate)
 *   • Execution history
 *   • Tenant isolation
 *   • Priority ordering
 *
 * ── Pluggable action handlers ─────────────────────────────────────────────────
 * Each ACTION_TYPE maps to a handler function in ACTION_HANDLERS below.
 * To wire a real integration (e.g. templatesService.sendTemplate), replace
 * the corresponding handler — no changes needed in engine, routes, or controller.
 */
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { automationRulesRepository } from './automationRules.repository.js';
import {
  RULE_STATUS,
  RULE_STATUS_VALUES,
  TRIGGER_TYPE_VALUES,
  ACTION_TYPE,
  CONDITION_LOGIC,
  EXECUTION_STATUS,
  TERMINAL_ACTIONS,
  SEARCHABLE_FIELDS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from './automationRules.constants.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

function escapeRegex(s = '') {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(query = {}) {
  const filter = {};
  if (query.status)  filter.status = query.status;
  if (query.trigger) filter['trigger.type'] = query.trigger;

  // Default: only show non-deleted rules unless caller explicitly asks
  if (query.active !== undefined) {
    filter.isActive = query.active === true || query.active === 'true';
  } else {
    filter.isActive = true;
  }

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = SEARCHABLE_FIELDS.map((f) => ({ [f]: rx }));
  }
  return filter;
}

function buildSort(sort) {
  if (!sort) return { priority: -1, createdAt: -1 };
  const desc = sort.startsWith('-');
  const key  = desc ? sort.slice(1) : sort;
  const valid = ['createdAt', 'updatedAt', 'priority', 'executionCount', 'name'];
  return valid.includes(key) ? { [key]: desc ? -1 : 1 } : { priority: -1, createdAt: -1 };
}

function paging(query = {}) {
  const page  = Math.max(Number(query.page)  || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

// ── Condition evaluator ────────────────────────────────────────────────────────

/**
 * Safely read a nested path like "lead.score" from a context object.
 */
function getFieldValue(context = {}, fieldPath = '') {
  return fieldPath.split('.').reduce((obj, key) => (obj != null ? obj[key] : undefined), context);
}

/**
 * Evaluate a single condition against the execution context.
 * Returns true if the condition is satisfied.
 */
function evaluateCondition(condition, context) {
  const actual   = getFieldValue(context, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    case 'EQUALS':       return actual == expected;
    case 'NOT_EQUALS':   return actual != expected;
    case 'GREATER_THAN': return Number(actual) > Number(expected);
    case 'LESS_THAN':    return Number(actual) < Number(expected);
    case 'CONTAINS':     return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'NOT_CONTAINS': return !String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'EXISTS':       return actual !== undefined && actual !== null;
    case 'NOT_EXISTS':   return actual === undefined || actual === null;
    case 'IN':           return Array.isArray(expected) && expected.includes(actual);
    case 'NOT_IN':       return !Array.isArray(expected) || !expected.includes(actual);
    case 'STARTS_WITH':  return String(actual ?? '').startsWith(String(expected ?? ''));
    case 'ENDS_WITH':    return String(actual ?? '').endsWith(String(expected ?? ''));
    default:             return false;
  }
}

/**
 * Evaluate all conditions using AND or OR logic.
 * Empty conditions array → always passes.
 */
function evaluateConditions(conditions = [], logic = CONDITION_LOGIC.AND, context = {}) {
  if (!conditions.length) return { passed: true, reason: 'no conditions — always passes' };

  const results = conditions.map((c) => ({
    field:    c.field,
    operator: c.operator,
    value:    c.value,
    passed:   evaluateCondition(c, context),
  }));

  const passed = logic === CONDITION_LOGIC.OR
    ? results.some((r) => r.passed)
    : results.every((r) => r.passed);

  return { passed, results };
}

// ── Action handlers (pluggable) ────────────────────────────────────────────────
//
// Each handler receives (action, context, logs[]) and returns { success, message }.
// Replace the stub with a real service call when you're ready to integrate.
//
// ctx is the automation execution context:
//   { tenantId, userId, leadId, contactId, campaignId, lead, contact, ... }

const ACTION_HANDLERS = {
  [ACTION_TYPE.SEND_TEMPLATE]: async (action, ctx, logs) => {
    logs.push(`[SEND_TEMPLATE] templateId=${action.params?.templateId} → simulated`);
    // Future: await templatesService.assertUsable(ctx, action.params.templateId);
    //         await messageService.sendTemplate(ctx, action.params);
    return { success: true, message: `Template ${action.params?.templateId || '(none)'} would be sent` };
  },

  [ACTION_TYPE.START_NURTURE]: async (action, ctx, logs) => {
    logs.push(`[START_NURTURE] sequenceId=${action.params?.sequenceId} → simulated`);
    // Future: await nurturesService.enrollLead(ctx, action.params.sequenceId, { leadId: ctx.leadId });
    return { success: true, message: `Nurture ${action.params?.sequenceId || '(none)'} would be started` };
  },

  [ACTION_TYPE.STOP_NURTURE]: async (action, ctx, logs) => {
    logs.push(`[STOP_NURTURE] enrollmentId=${action.params?.enrollmentId} → simulated`);
    return { success: true, message: `Nurture enrollment would be cancelled` };
  },

  [ACTION_TYPE.SEND_BROADCAST]: async (action, ctx, logs) => {
    logs.push(`[SEND_BROADCAST] broadcastId=${action.params?.broadcastId} → simulated`);
    return { success: true, message: `Broadcast ${action.params?.broadcastId || '(none)'} would be sent` };
  },

  [ACTION_TYPE.GENERATE_AI_REPLY]: async (action, ctx, logs) => {
    logs.push(`[GENERATE_AI_REPLY] goal=${action.params?.goal} → simulated`);
    // Future: await aiReplyAssistantService.generateReply(ctx, action.params);
    return { success: true, message: `AI reply would be generated for goal: ${action.params?.goal || 'general'}` };
  },

  [ACTION_TYPE.ASSIGN_USER]: async (action, ctx, logs) => {
    logs.push(`[ASSIGN_USER] userId=${action.params?.userId}`);
    // Future: await leadService.updateLead(ctx, ctx.leadId, { assigned_user_id: action.params.userId });
    return { success: true, message: `Lead would be assigned to user ${action.params?.userId}` };
  },

  [ACTION_TYPE.CHANGE_PIPELINE_STAGE]: async (action, ctx, logs) => {
    logs.push(`[CHANGE_PIPELINE_STAGE] stage=${action.params?.stage}`);
    // Future: await dealService.moveDealStage(ctx, ctx.dealId, action.params.stage);
    return { success: true, message: `Pipeline stage would be changed to ${action.params?.stage}` };
  },

  [ACTION_TYPE.ADD_TAG]: async (action, ctx, logs) => {
    logs.push(`[ADD_TAG] tag=${action.params?.tag}`);
    return { success: true, message: `Tag "${action.params?.tag}" would be added` };
  },

  [ACTION_TYPE.REMOVE_TAG]: async (action, ctx, logs) => {
    logs.push(`[REMOVE_TAG] tag=${action.params?.tag}`);
    return { success: true, message: `Tag "${action.params?.tag}" would be removed` };
  },

  [ACTION_TYPE.CREATE_TASK]: async (action, ctx, logs) => {
    logs.push(`[CREATE_TASK] title=${action.params?.title}`);
    return { success: true, message: `Task "${action.params?.title || 'Untitled'}" would be created` };
  },

  [ACTION_TYPE.CREATE_NOTE]: async (action, ctx, logs) => {
    logs.push(`[CREATE_NOTE] text=${String(action.params?.text || '').slice(0, 50)}`);
    return { success: true, message: `Note would be added to lead` };
  },

  [ACTION_TYPE.NOTIFY_USER]: async (action, ctx, logs) => {
    logs.push(`[NOTIFY_USER] userId=${action.params?.userId} message=${action.params?.message}`);
    return { success: true, message: `User ${action.params?.userId || '(none)'} would be notified` };
  },

  [ACTION_TYPE.SEND_EMAIL]: async (action, ctx, logs) => {
    logs.push(`[SEND_EMAIL] to=${action.params?.to} subject=${action.params?.subject}`);
    // Future: await emailService.send(ctx, action.params);
    return { success: true, message: `Email would be sent to ${action.params?.to || '(recipient)'}` };
  },

  [ACTION_TYPE.CALL_WEBHOOK]: async (action, ctx, logs) => {
    logs.push(`[CALL_WEBHOOK] url=${action.params?.url}`);
    // Future: await fetch(action.params.url, { method: action.params.method || 'POST', ... });
    return { success: true, message: `Webhook ${action.params?.url || '(url)'} would be called` };
  },

  [ACTION_TYPE.WAIT]: async (action, ctx, logs) => {
    const { delayValue = 0, delayUnit = 'minutes' } = action;
    logs.push(`[WAIT] ${delayValue} ${delayUnit} (simulated — skipped in manual run)`);
    return { success: true, message: `Wait of ${delayValue} ${delayUnit} would be applied` };
  },

  [ACTION_TYPE.END_WORKFLOW]: async (action, ctx, logs) => {
    logs.push(`[END_WORKFLOW] sequence terminated`);
    return { success: true, message: `Workflow ended` };
  },
};

// ── Execution engine ───────────────────────────────────────────────────────────

/**
 * Execute a single rule against an execution context.
 * Returns a structured result that is persisted as AutomationRuleHistory.
 *
 * @param {object} rule     - AutomationRule document
 * @param {object} execCtx  - { tenantId, userId, leadId, contactId, campaignId, lead, contact, ... }
 */
async function executeRule(rule, execCtx) {
  const startedAt = new Date();
  const logs      = [];
  const actionLogs = [];
  let actionsExecuted = 0;
  let overallStatus   = EXECUTION_STATUS.SUCCESS;
  let errorMessage    = null;

  // Sort actions by order field.
  const sortedActions = [...(rule.actions || [])].sort((a, b) => a.order - b.order);

  try {
    for (const action of sortedActions) {
      const actionStart = Date.now();
      const handler = ACTION_HANDLERS[action.type];

      if (!handler) {
        logs.push(`[SKIP] no handler for action type: ${action.type}`);
        actionLogs.push({
          order: action.order,
          type:  action.type,
          status: EXECUTION_STATUS.SKIPPED,
          message: 'No handler registered',
          durationMs: 0,
        });
        continue;
      }

      let actionStatus  = EXECUTION_STATUS.SUCCESS;
      let actionMessage = '';

      try {
        const result  = await handler(action, execCtx, logs);
        actionMessage = result.message || '';
        if (!result.success) {
          actionStatus  = EXECUTION_STATUS.FAILED;
          overallStatus = EXECUTION_STATUS.PARTIAL;
        }
      } catch (err) {
        actionStatus  = EXECUTION_STATUS.FAILED;
        overallStatus = EXECUTION_STATUS.PARTIAL;
        actionMessage = err.message || 'Action failed';
        logs.push(`[ERROR] ${action.type}: ${actionMessage}`);
      }

      actionLogs.push({
        order:      action.order,
        type:       action.type,
        status:     actionStatus,
        message:    actionMessage,
        durationMs: Date.now() - actionStart,
      });

      if (actionStatus === EXECUTION_STATUS.SUCCESS) actionsExecuted += 1;

      // Stop on terminal action.
      if (TERMINAL_ACTIONS.includes(action.type)) {
        logs.push(`[STOP] terminal action "${action.type}" — workflow ended`);
        break;
      }
    }
  } catch (fatalErr) {
    overallStatus = EXECUTION_STATUS.FAILED;
    errorMessage  = fatalErr.message || 'Unexpected engine error';
    logs.push(`[FATAL] ${errorMessage}`);
  }

  const completedAt = new Date();
  const duration    = completedAt - startedAt;

  return {
    status:          overallStatus,
    actionsExecuted,
    actionLogs,
    startedAt,
    completedAt,
    duration,
    error:           errorMessage,
    logs,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

export const automationRulesService = {
  // ── Rule CRUD ──────────────────────────────────────────────────────────────

  async createRule(ctx, data) {
    if (!TRIGGER_TYPE_VALUES.includes(data?.trigger?.type)) {
      throw new AppError(400, `trigger.type must be one of: ${TRIGGER_TYPE_VALUES.join(', ')}`);
    }
    const rule = await automationRulesRepository.createRule({
      ...data,
      tenantId:  ctx.tenantId,
      status:    data.status || RULE_STATUS.DRAFT,
      isActive:  true,
      executionCount: 0,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    return toDTO(rule);
  },

  async getRule(ctx, id) {
    const rule = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!rule) throw new AppError(404, 'Automation rule not found');
    return toDTO(rule);
  },

  async listRules(ctx, query) {
    const filter = buildFilter(query);
    const sort   = buildSort(query.sort);
    const { page, limit, skip } = paging(query);
    const [items, total] = await Promise.all([
      automationRulesRepository.listRules(ctx.tenantId, filter, { sort, skip, limit }),
      automationRulesRepository.countRules(ctx.tenantId, filter),
    ]);
    return {
      data: items.map(toDTO),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit) || 0,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async updateRule(ctx, id, patch) {
    const existing = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Automation rule not found');
    if (existing.status === RULE_STATUS.ARCHIVED) {
      throw new AppError(409, 'Archived rules are read-only');
    }
    if (patch?.trigger?.type && !TRIGGER_TYPE_VALUES.includes(patch.trigger.type)) {
      throw new AppError(400, `trigger.type "${patch.trigger.type}" is not valid`);
    }
    patch.updatedBy = ctx.userId;
    const updated = await automationRulesRepository.updateRule(ctx.tenantId, id, patch);
    return toDTO(updated);
  },

  async deleteRule(ctx, id) {
    const existing = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Automation rule not found');
    await automationRulesRepository.softDeleteRule(ctx.tenantId, id);
    return { id: String(existing._id), deleted: true };
  },

  async duplicateRule(ctx, id) {
    const source = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!source) throw new AppError(404, 'Automation rule not found');
    const src   = source.toObject ? source.toObject() : source;
    const clone = await automationRulesRepository.createRule({
      tenantId:       ctx.tenantId,
      name:           `${src.name} (Copy)`,
      description:    src.description,
      trigger:        src.trigger,
      conditions:     src.conditions,
      conditionLogic: src.conditionLogic,
      actions:        src.actions,
      status:         RULE_STATUS.DRAFT,   // copies always start as DRAFT
      priority:       src.priority,
      executionMode:  src.executionMode,
      delay:          src.delay,
      isActive:       true,
      executionCount: 0,
      createdBy:      ctx.userId,
      updatedBy:      ctx.userId,
    });
    return toDTO(clone);
  },

  async toggleRule(ctx, id) {
    const existing = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Automation rule not found');
    if (existing.status === RULE_STATUS.ARCHIVED) {
      throw new AppError(409, 'Archived rules cannot be toggled');
    }
    const isNowActive = existing.status !== RULE_STATUS.ACTIVE;
    const newStatus   = isNowActive ? RULE_STATUS.ACTIVE : RULE_STATUS.PAUSED;
    const updated     = await automationRulesRepository.toggleRule(ctx.tenantId, id, newStatus, isNowActive);
    return toDTO(updated);
  },

  // ── Manual run / simulate ──────────────────────────────────────────────────

  async runRule(ctx, id, payload = {}) {
    const rule = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!rule) throw new AppError(404, 'Automation rule not found');

    // Build execution context from payload + auth context.
    const execCtx = {
      tenantId:   ctx.tenantId,
      userId:     ctx.userId,
      leadId:     payload.leadId     || null,
      contactId:  payload.contactId  || null,
      campaignId: payload.campaignId || null,
      lead:       payload.lead       || {},
      contact:    payload.contact    || {},
    };

    // Evaluate conditions if provided.
    let conditionResult = { passed: true, reason: 'manual run — conditions evaluated' };
    if (rule.conditions?.length && Object.keys(execCtx.lead).length) {
      conditionResult = evaluateConditions(rule.conditions, rule.conditionLogic, execCtx.lead);
    }

    const result = await executeRule(rule, execCtx);

    // Persist history.
    const historyDoc = await automationRulesRepository.saveHistory({
      automationId:    rule._id,
      tenantId:        ctx.tenantId,
      trigger:         rule.trigger?.type || 'MANUAL_RUN',
      leadId:          execCtx.leadId,
      contactId:       execCtx.contactId,
      campaignId:      execCtx.campaignId,
      status:          result.status,
      actionsExecuted: result.actionsExecuted,
      actionLogs:      result.actionLogs,
      startedAt:       result.startedAt,
      completedAt:     result.completedAt,
      duration:        result.duration,
      error:           result.error,
      logs:            result.logs,
    });

    // Update rule counters.
    await automationRulesRepository.incrementExecutionCount(ctx.tenantId, id, result.completedAt);

    return {
      success:          result.status !== EXECUTION_STATUS.FAILED,
      status:           result.status,
      conditionsPassed: conditionResult.passed,
      actionsExecuted:  result.actionsExecuted,
      executionTime:    result.duration,
      logs:             result.logs,
      actionLogs:       result.actionLogs,
      failureReason:    result.error || null,
      historyId:        String(historyDoc._id),
    };
  },

  // ── Execution history ──────────────────────────────────────────────────────

  async getHistory(ctx, id, query = {}) {
    const rule = await automationRulesRepository.findById(ctx.tenantId, id);
    if (!rule) throw new AppError(404, 'Automation rule not found');

    const { page, limit, skip } = paging(query);
    const [items, total] = await Promise.all([
      automationRulesRepository.listHistory(ctx.tenantId, id, { skip, limit }),
      automationRulesRepository.countHistory(ctx.tenantId, id),
    ]);

    return {
      data: items.map(toDTO),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit) || 0,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // ── Trigger dispatch (called by other modules when events fire) ────────────
  /**
   * Process all active rules for a given trigger type.
   * Other modules call this when an event occurs.
   *
   * Example:
   *   import { automationRulesService } from '../automationRules/automationRules.service.js';
   *   await automationRulesService.dispatch(ctx, 'LEAD_QUALIFIED', { lead, leadId: lead._id });
   */
  async dispatch(ctx, triggerType, payload = {}) {
    const rules = await automationRulesRepository.findActiveByTrigger(ctx.tenantId, triggerType);
    const results = [];

    for (const rule of rules) {
      try {
        const conditionResult = evaluateConditions(
          rule.conditions, rule.conditionLogic, payload,
        );
        if (!conditionResult.passed) {
          results.push({ ruleId: String(rule._id), skipped: true, reason: 'conditions not met' });
          continue;
        }
        const result = await executeRule(rule, { ...ctx, ...payload });
        await automationRulesRepository.saveHistory({
          automationId:    rule._id,
          tenantId:        ctx.tenantId,
          trigger:         triggerType,
          leadId:          payload.leadId     || null,
          contactId:       payload.contactId  || null,
          campaignId:      payload.campaignId || null,
          status:          result.status,
          actionsExecuted: result.actionsExecuted,
          actionLogs:      result.actionLogs,
          startedAt:       result.startedAt,
          completedAt:     result.completedAt,
          duration:        result.duration,
          error:           result.error,
          logs:            result.logs,
        });
        await automationRulesRepository.incrementExecutionCount(ctx.tenantId, String(rule._id), result.completedAt);
        results.push({ ruleId: String(rule._id), status: result.status });
      } catch (err) {
        results.push({ ruleId: String(rule._id), error: err.message });
      }
    }

    return results;
  },
};
