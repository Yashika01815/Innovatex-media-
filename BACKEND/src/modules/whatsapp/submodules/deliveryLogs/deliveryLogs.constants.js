/**
 * WhatsApp Delivery Logs — constants.
 *
 * All enums, defaults, transition rules, and role mappings.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Direction ──────────────────────────────────────────────────────────────────
export const DIRECTION = Object.freeze({
  OUTBOUND: 'OUTBOUND',
  INBOUND:  'INBOUND',
});
export const DIRECTION_VALUES = Object.freeze(Object.values(DIRECTION));

// ── Message types ──────────────────────────────────────────────────────────────
export const MESSAGE_TYPE = Object.freeze({
  TEXT:        'TEXT',
  TEMPLATE:    'TEMPLATE',
  IMAGE:       'IMAGE',
  VIDEO:       'VIDEO',
  DOCUMENT:    'DOCUMENT',
  AUDIO:       'AUDIO',
  LOCATION:    'LOCATION',
  CONTACT:     'CONTACT',
  STICKER:     'STICKER',
  INTERACTIVE: 'INTERACTIVE',
  BUTTON:      'BUTTON',
  LIST:        'LIST',
  REACTION:    'REACTION',
});
export const MESSAGE_TYPE_VALUES = Object.freeze(Object.values(MESSAGE_TYPE));

// ── Delivery status ────────────────────────────────────────────────────────────
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
export const DELIVERY_STATUS_VALUES = Object.freeze(Object.values(DELIVERY_STATUS));

/**
 * Allowed status transitions.
 * Happy path: QUEUED → SENDING → SENT → DELIVERED → READ
 * Failure:    QUEUED → FAILED   and   SENDING → FAILED
 * Provider edge cases: SENT/DELIVERED → EXPIRED; any non-terminal → DELETED
 */
export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [DELIVERY_STATUS.QUEUED]:    [DELIVERY_STATUS.SENDING, DELIVERY_STATUS.FAILED, DELIVERY_STATUS.DELETED],
  [DELIVERY_STATUS.SENDING]:   [DELIVERY_STATUS.SENT, DELIVERY_STATUS.FAILED, DELIVERY_STATUS.DELETED],
  [DELIVERY_STATUS.SENT]:      [DELIVERY_STATUS.DELIVERED, DELIVERY_STATUS.FAILED, DELIVERY_STATUS.EXPIRED, DELIVERY_STATUS.DELETED],
  [DELIVERY_STATUS.DELIVERED]: [DELIVERY_STATUS.READ, DELIVERY_STATUS.EXPIRED, DELIVERY_STATUS.DELETED],
  [DELIVERY_STATUS.READ]:      [DELIVERY_STATUS.DELETED],
  [DELIVERY_STATUS.FAILED]:    [DELIVERY_STATUS.SENDING],   // allow retry to re-enter the pipeline
  [DELIVERY_STATUS.EXPIRED]:   [],
  [DELIVERY_STATUS.DELETED]:   [],
});

// Statuses from which a message may be retried.
export const RETRYABLE_STATUSES = Object.freeze([DELIVERY_STATUS.FAILED]);

// ── Failure reasons ────────────────────────────────────────────────────────────
export const FAILURE_REASON = Object.freeze({
  INVALID_NUMBER:   'INVALID_NUMBER',
  USER_BLOCKED:     'USER_BLOCKED',
  OPTED_OUT:        'OPTED_OUT',
  RATE_LIMITED:     'RATE_LIMITED',
  PROVIDER_ERROR:   'PROVIDER_ERROR',
  NETWORK_ERROR:    'NETWORK_ERROR',
  INVALID_TEMPLATE: 'INVALID_TEMPLATE',
  MEDIA_ERROR:      'MEDIA_ERROR',
  UNKNOWN:          'UNKNOWN',
});
export const FAILURE_REASON_VALUES = Object.freeze(Object.values(FAILURE_REASON));

// ── Providers (mirrors templates module PROVIDER values) ───────────────────────
export const PROVIDER = Object.freeze({
  META_CLOUD:     'META_CLOUD',
  WATI:           'WATI',
  INTERAKT:       'INTERAKT',
  AISENSY:        'AISENSY',
  GALLABOX:       'GALLABOX',
  TWILIO:         'TWILIO',
  DIALOG360:      '360DIALOG',
  CUSTOM_WEBHOOK: 'CUSTOM_WEBHOOK',
  SIMULATION:     'SIMULATION',
});
export const PROVIDER_VALUES = Object.freeze(Object.values(PROVIDER));

// ── Source modules (where the message originated) ──────────────────────────────
export const SOURCE = Object.freeze({
  CAMPAIGN:        'CAMPAIGN',
  BROADCAST:       'BROADCAST',
  NURTURE:         'NURTURE',
  AI_REPLY:        'AI_REPLY',
  AUTOMATION_RULE: 'AUTOMATION_RULE',
  MANUAL_INBOX:    'MANUAL_INBOX',
  OTHER:           'OTHER',
});
export const SOURCE_VALUES = Object.freeze(Object.values(SOURCE));

// ── Timestamp field mapped to each status (for webhook auto-stamping) ─────────
export const STATUS_TIMESTAMP_FIELD = Object.freeze({
  [DELIVERY_STATUS.SENT]:      'sentAt',
  [DELIVERY_STATUS.DELIVERED]: 'deliveredAt',
  [DELIVERY_STATUS.READ]:      'readAt',
  [DELIVERY_STATUS.FAILED]:    'failedAt',
});

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Searchable fields ──────────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze([
  'phoneNumber',
  'providerMessageId',
  'messageId',
  'contactName',
  'leadName',
]);

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  CREATE:        ROLES.SALES_USER,
  READ:          ROLES.SALES_USER,
  UPDATE_STATUS: ROLES.SALES_USER,
  RETRY:         ROLES.SALES_USER,
  STATS:         ROLES.SALES_USER,
});
