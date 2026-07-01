/**
 * WhatsApp Campaigns — constants.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Campaign Status ────────────────────────────────────────────────────────────
export const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  SCHEDULED: 'SCHEDULED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});
export const CAMPAIGN_STATUS_VALUES = Object.freeze(Object.values(CAMPAIGN_STATUS));

// ── Campaign Type ──────────────────────────────────────────────────────────────
export const CAMPAIGN_TYPE = Object.freeze({
  MARKETING: 'MARKETING',
  PROMOTIONAL: 'PROMOTIONAL',
  BOOKING: 'BOOKING',
  FOLLOW_UP: 'FOLLOW_UP',
  PAYMENT: 'PAYMENT',
  REMINDER: 'REMINDER',
  NURTURE: 'NURTURE',
  BROADCAST: 'BROADCAST',
  CUSTOM: 'CUSTOM',
});
export const CAMPAIGN_TYPE_VALUES = Object.freeze(Object.values(CAMPAIGN_TYPE));

// ── Workflow actions (stored in auditLog.action) ───────────────────────────────
export const CAMPAIGN_ACTION = Object.freeze({
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  APPROVE: 'APPROVE',
  SCHEDULE: 'SCHEDULE',
  START: 'START',
  COMPLETE: 'COMPLETE',
  FAIL: 'FAIL',
  CANCEL: 'CANCEL',
  DELETE: 'DELETE',
});

// ── Allowed status transitions ─────────────────────────────────────────────────
export const ALLOWED_TRANSITIONS = Object.freeze({
  [CAMPAIGN_STATUS.DRAFT]:      [CAMPAIGN_STATUS.APPROVED, CAMPAIGN_STATUS.CANCELLED],
  [CAMPAIGN_STATUS.APPROVED]:   [CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.RUNNING, CAMPAIGN_STATUS.CANCELLED],
  [CAMPAIGN_STATUS.SCHEDULED]:  [CAMPAIGN_STATUS.RUNNING, CAMPAIGN_STATUS.CANCELLED],
  [CAMPAIGN_STATUS.RUNNING]:    [CAMPAIGN_STATUS.COMPLETED, CAMPAIGN_STATUS.FAILED, CAMPAIGN_STATUS.CANCELLED],
  [CAMPAIGN_STATUS.COMPLETED]:  [],
  [CAMPAIGN_STATUS.FAILED]:     [CAMPAIGN_STATUS.DRAFT],   // allow retry via reset
  [CAMPAIGN_STATUS.CANCELLED]:  [],
});

// ── Read-only statuses (no edits allowed) ─────────────────────────────────────
export const READ_ONLY_STATUSES = Object.freeze([
  CAMPAIGN_STATUS.COMPLETED,
  CAMPAIGN_STATUS.CANCELLED,
]);

// ── Statuses that block edits (but transitions are still possible) ─────────────
export const LOCKED_STATUSES = Object.freeze([
  CAMPAIGN_STATUS.SCHEDULED,
  CAMPAIGN_STATUS.RUNNING,
  ...READ_ONLY_STATUSES,
]);

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  CREATE:   ROLES.SALES_USER,
  READ:     ROLES.READ_ONLY_USER,
  UPDATE:   ROLES.SALES_USER,
  DELETE:   ROLES.TENANT_ADMIN,
  APPROVE:  ROLES.TENANT_ADMIN,
  SCHEDULE: ROLES.SALES_USER,
  START:    ROLES.TENANT_ADMIN,
  COMPLETE: ROLES.TENANT_ADMIN,
  FAIL:     ROLES.TENANT_ADMIN,
  CANCEL:   ROLES.TENANT_ADMIN,
  PREVIEW_AUDIENCE: ROLES.SALES_USER,
});

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ── Searchable / sortable ──────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['name', 'description', 'templateName']);
export const SORTABLE_FIELDS = Object.freeze([
  'createdAt', 'updatedAt', 'scheduledAt', 'startedAt', 'name',
  'recipientCount', 'status',
]);

// ── Audience filter field keys ─────────────────────────────────────────────────
export const AUDIENCE_FILTER_KEYS = Object.freeze([
  'tags', 'source', 'minimumScore', 'maximumScore',
  'consentStatus', 'optOutStatus', 'assignedUserId',
  'status', 'createdAfter', 'createdBefore',
  'lastContactedAfter', 'lastContactedBefore',
]);
