/**
 * WhatsApp Automation Rules — constants.
 *
 * All enums, defaults, and role mappings for the module.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Rule status ────────────────────────────────────────────────────────────────
export const RULE_STATUS = Object.freeze({
  DRAFT:    'DRAFT',
  ACTIVE:   'ACTIVE',
  PAUSED:   'PAUSED',
  DISABLED: 'DISABLED',
  ARCHIVED: 'ARCHIVED',
});
export const RULE_STATUS_VALUES = Object.freeze(Object.values(RULE_STATUS));

// ── Trigger types ──────────────────────────────────────────────────────────────
export const TRIGGER_TYPE = Object.freeze({
  LEAD_CREATED:            'LEAD_CREATED',
  LEAD_UPDATED:            'LEAD_UPDATED',
  LEAD_QUALIFIED:          'LEAD_QUALIFIED',
  PIPELINE_STAGE_CHANGED:  'PIPELINE_STAGE_CHANGED',
  MESSAGE_RECEIVED:        'MESSAGE_RECEIVED',
  MESSAGE_SENT:            'MESSAGE_SENT',
  BOOKING_CREATED:         'BOOKING_CREATED',
  BOOKING_CONFIRMED:       'BOOKING_CONFIRMED',
  PAYMENT_PENDING:         'PAYMENT_PENDING',
  PAYMENT_RECEIVED:        'PAYMENT_RECEIVED',
  CAMPAIGN_COMPLETED:      'CAMPAIGN_COMPLETED',
  CAMPAIGN_FAILED:         'CAMPAIGN_FAILED',
  NO_REPLY:                'NO_REPLY',
  TAG_ADDED:               'TAG_ADDED',
  TAG_REMOVED:             'TAG_REMOVED',
  CONTACT_CREATED:         'CONTACT_CREATED',
  CONTACT_UPDATED:         'CONTACT_UPDATED',
  CUSTOM_EVENT:            'CUSTOM_EVENT',
});
export const TRIGGER_TYPE_VALUES = Object.freeze(Object.values(TRIGGER_TYPE));

// ── Condition operators ────────────────────────────────────────────────────────
export const CONDITION_OPERATOR = Object.freeze({
  EQUALS:         'EQUALS',
  NOT_EQUALS:     'NOT_EQUALS',
  GREATER_THAN:   'GREATER_THAN',
  LESS_THAN:      'LESS_THAN',
  CONTAINS:       'CONTAINS',
  NOT_CONTAINS:   'NOT_CONTAINS',
  EXISTS:         'EXISTS',
  NOT_EXISTS:     'NOT_EXISTS',
  IN:             'IN',
  NOT_IN:         'NOT_IN',
  STARTS_WITH:    'STARTS_WITH',
  ENDS_WITH:      'ENDS_WITH',
});
export const CONDITION_OPERATOR_VALUES = Object.freeze(Object.values(CONDITION_OPERATOR));

// ── Condition logic ────────────────────────────────────────────────────────────
export const CONDITION_LOGIC = Object.freeze({
  AND: 'AND',
  OR:  'OR',
});
export const CONDITION_LOGIC_VALUES = Object.freeze(Object.values(CONDITION_LOGIC));

// ── Action types ───────────────────────────────────────────────────────────────
export const ACTION_TYPE = Object.freeze({
  SEND_TEMPLATE:          'SEND_TEMPLATE',
  START_NURTURE:          'START_NURTURE',
  STOP_NURTURE:           'STOP_NURTURE',
  SEND_BROADCAST:         'SEND_BROADCAST',
  GENERATE_AI_REPLY:      'GENERATE_AI_REPLY',
  ASSIGN_USER:            'ASSIGN_USER',
  CHANGE_PIPELINE_STAGE:  'CHANGE_PIPELINE_STAGE',
  ADD_TAG:                'ADD_TAG',
  REMOVE_TAG:             'REMOVE_TAG',
  CREATE_TASK:            'CREATE_TASK',
  CREATE_NOTE:            'CREATE_NOTE',
  NOTIFY_USER:            'NOTIFY_USER',
  SEND_EMAIL:             'SEND_EMAIL',
  CALL_WEBHOOK:           'CALL_WEBHOOK',
  WAIT:                   'WAIT',
  END_WORKFLOW:           'END_WORKFLOW',
});
export const ACTION_TYPE_VALUES = Object.freeze(Object.values(ACTION_TYPE));

// Actions that terminate the rule sequence — nothing executes after these.
export const TERMINAL_ACTIONS = Object.freeze([
  ACTION_TYPE.END_WORKFLOW,
]);

// ── Execution mode ─────────────────────────────────────────────────────────────
export const EXECUTION_MODE = Object.freeze({
  IMMEDIATELY: 'IMMEDIATELY',
  DELAYED:     'DELAYED',
  SCHEDULED:   'SCHEDULED',
});
export const EXECUTION_MODE_VALUES = Object.freeze(Object.values(EXECUTION_MODE));

// ── Delay units ────────────────────────────────────────────────────────────────
export const DELAY_UNIT = Object.freeze({
  MINUTES: 'minutes',
  HOURS:   'hours',
  DAYS:    'days',
});
export const DELAY_UNIT_VALUES = Object.freeze(Object.values(DELAY_UNIT));

// ── Execution status ───────────────────────────────────────────────────────────
export const EXECUTION_STATUS = Object.freeze({
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED:  'FAILED',
  SKIPPED: 'SKIPPED',
});

// ── Priority bounds ────────────────────────────────────────────────────────────
export const PRIORITY_MIN = 1;
export const PRIORITY_MAX = 100;

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Searchable fields ──────────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['name', 'description']);

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  CREATE:   ROLES.TENANT_ADMIN,
  READ:     ROLES.READ_ONLY_USER,
  UPDATE:   ROLES.TENANT_ADMIN,
  DELETE:   ROLES.TENANT_ADMIN,
  TOGGLE:   ROLES.TENANT_ADMIN,
  RUN:      ROLES.SALES_USER,
  HISTORY:  ROLES.READ_ONLY_USER,
});
