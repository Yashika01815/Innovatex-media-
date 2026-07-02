/**
 * WhatsApp Analytics — constants.
 *
 * This module does NOT own a collection. It aggregates across existing
 * collections. These constants centralise the enum values (as stored in each
 * source collection) plus role mappings, trend granularities, and export
 * formats so the service/repository never hard-code magic strings.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Trend granularities ────────────────────────────────────────────────────────
export const TREND_PERIOD = Object.freeze({
  DAILY:   'DAILY',
  WEEKLY:  'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY:  'YEARLY',
});
export const TREND_PERIOD_VALUES = Object.freeze(Object.values(TREND_PERIOD));

// Maps a trend period to the MongoDB $dateToString format used for grouping.
export const TREND_DATE_FORMAT = Object.freeze({
  [TREND_PERIOD.DAILY]:   '%Y-%m-%d',
  [TREND_PERIOD.WEEKLY]:  '%G-W%V',   // ISO week-year + week number
  [TREND_PERIOD.MONTHLY]: '%Y-%m',
  [TREND_PERIOD.YEARLY]:  '%Y',
});

// ── Export formats ─────────────────────────────────────────────────────────────
export const EXPORT_FORMAT = Object.freeze({
  CSV:  'CSV',
  JSON: 'JSON',
});
export const EXPORT_FORMAT_VALUES = Object.freeze(Object.values(EXPORT_FORMAT));

// ── Source-collection enum mirrors ─────────────────────────────────────────────
// Delivery Logs status (UPPER_CASE) — the canonical message-lifecycle source.
export const DELIVERY_STATUS = Object.freeze({
  QUEUED:    'QUEUED',
  SENDING:   'SENDING',
  SENT:      'SENT',
  DELIVERED: 'DELIVERED',
  READ:      'READ',
  FAILED:    'FAILED',
  EXPIRED:   'EXPIRED',
  DELETED:   'DELETED',
});

// Message collection direction (lowercase).
export const MESSAGE_DIRECTION = Object.freeze({
  INBOUND:  'inbound',
  OUTBOUND: 'outbound',
});

// Conversation status (Title Case) — "closed" is derived from Won/Lost/Ghosted.
export const CONVERSATION_STATUS = Object.freeze({
  NEW:       'New',
  OPEN:      'Open',
  PENDING:   'Pending',
  QUALIFIED: 'Qualified',
  BOOKED:    'Booked',
  WON:       'Won',
  LOST:      'Lost',
  GHOSTED:   'Ghosted',
});

// Conversation statuses considered "closed/resolved".
export const CLOSED_CONVERSATION_STATUSES = Object.freeze([
  CONVERSATION_STATUS.WON,
  CONVERSATION_STATUS.LOST,
  CONVERSATION_STATUS.GHOSTED,
]);

// Conversation statuses considered "active/open".
export const ACTIVE_CONVERSATION_STATUSES = Object.freeze([
  CONVERSATION_STATUS.NEW,
  CONVERSATION_STATUS.OPEN,
  CONVERSATION_STATUS.PENDING,
  CONVERSATION_STATUS.QUALIFIED,
  CONVERSATION_STATUS.BOOKED,
]);

// Campaign & Broadcast share the same status set.
export const SEND_JOB_STATUS = Object.freeze({
  DRAFT:     'DRAFT',
  APPROVED:  'APPROVED',
  SCHEDULED: 'SCHEDULED',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  CANCELLED: 'CANCELLED',
});

// Consent status.
export const CONSENT_STATUS = Object.freeze({
  OPTED_IN:  'OPTED_IN',
  OPTED_OUT: 'OPTED_OUT',
  PENDING:   'PENDING',
  EXPIRED:   'EXPIRED',
  BLOCKED:   'BLOCKED',
});

// Automation execution status.
export const EXECUTION_STATUS = Object.freeze({
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED:  'FAILED',
  SKIPPED: 'SKIPPED',
});

// Nurture sequence + enrollment status.
export const SEQUENCE_STATUS = Object.freeze({
  DRAFT: 'DRAFT', ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', ARCHIVED: 'ARCHIVED',
});
export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', FAILED: 'FAILED', CANCELLED: 'CANCELLED',
});

// ── Limits ─────────────────────────────────────────────────────────────────────
export const TOP_TEMPLATES_LIMIT = 10;
export const MAX_TREND_BUCKETS    = 365;

// ── Role permissions ──────────────────────────────────────────────────────────
// All analytics endpoints are read-only; minimum role is sales_user.
export const ROLE_MIN = Object.freeze({
  VIEW: ROLES.SALES_USER,
});
