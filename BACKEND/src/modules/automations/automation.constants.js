/**
 * =============================================================================
 * InnovateX Revenue OS — Automations Constants
 * =============================================================================
 *
 * FILE: src/modules/automations/automation.constants.js
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 Automation entity:
 *   "name, trigger, condition, action, status('active'|'inactive'), last_run,
 *    created_by, run_count, logs[{at,result}]"
 *
 * SOURCE: MASTER_SPEC.md §B14:
 *   "Rule cards (WHEN trigger / IF condition / THEN action), enable/disable,
 *    simulate run, logs. Triggers/actions per spec.
 *    🔭 real event-driven execution engine."
 *
 * SOURCE: FRONTEND_SPEC.md §15:
 *   "create rule (WHEN trigger / IF condition / THEN action) → toggle active
 *    → 'Simulate run' → view logs. 6 seeded automations, run counts,
 *    last-run, log modal."
 *
 * DESIGN NOTE
 * ───────────
 * This is a GENERIC, CRM-wide automation engine — ONE trigger, ONE optional
 * condition, ONE action per rule (unlike the WhatsApp-scoped
 * `automationRules` submodule, which supports arrays of conditions/actions
 * for WA-specific workflows). Triggers reuse the same 18 TrackingEventType
 * values already emitted by attribution.service.js, so this module's
 * `dispatch()` can eventually be wired directly into tracking-event
 * creation — see automation.service.js for details.
 *
 * All actions are SIMULATED for now (🔭 real execution is development-phase
 * per spec) — each handler is a clearly-labelled stub showing the future
 * real service call.
 */

import { TRACKING_EVENT_TYPE_VALUES } from '../attribution/attribution.constants.js';

// ── Trigger types — reuse the canonical CRM event vocabulary ──────────────────
export const TRIGGER_TYPE_VALUES = TRACKING_EVENT_TYPE_VALUES;

// ── Condition operators ────────────────────────────────────────────────────────
export const CONDITION_OPERATOR = Object.freeze({
  EQUALS:       'equals',
  NOT_EQUALS:   'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN:    'less_than',
  CONTAINS:     'contains',
  EXISTS:       'exists',
});
export const CONDITION_OPERATOR_VALUES = Object.freeze(Object.values(CONDITION_OPERATOR));

// ── Action types — generic CRM-wide actions, all simulated ────────────────────
export const ACTION_TYPE = Object.freeze({
  SEND_WHATSAPP_MESSAGE: 'send_whatsapp_message',
  SEND_EMAIL:            'send_email',
  ASSIGN_USER:           'assign_user',
  ADD_TAG:               'add_tag',
  CHANGE_PIPELINE_STAGE: 'change_pipeline_stage',
  CREATE_TASK:           'create_task',
  CREATE_NOTE:           'create_note',
  NOTIFY_USER:           'notify_user',
  ENROLL_NURTURE:        'enroll_nurture',
  CALL_WEBHOOK:          'call_webhook',
});
export const ACTION_TYPE_VALUES = Object.freeze(Object.values(ACTION_TYPE));

// ── Automation status — exactly 2 states per DEVELOPER_HANDOFF.md §6 ──────────
export const AUTOMATION_STATUS = Object.freeze({
  ACTIVE:   'active',
  INACTIVE: 'inactive',
});
export const AUTOMATION_STATUS_VALUES = Object.freeze(Object.values(AUTOMATION_STATUS));

// ── Log entry — how a run was triggered ────────────────────────────────────────
export const TRIGGERED_BY = Object.freeze({
  MANUAL: 'manual', // "Simulate run" button
  EVENT:  'event',  // future: real event-driven dispatch
});
export const TRIGGERED_BY_VALUES = Object.freeze(Object.values(TRIGGERED_BY));

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Searchable fields ──────────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['name', 'description']);

// ── Max embedded logs kept per automation (oldest trimmed) ────────────────────
export const MAX_LOGS_STORED = 200;
