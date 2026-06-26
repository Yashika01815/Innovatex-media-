/**
 * WhatsApp Broadcasts — constants.
 *
 * Broadcasts are one-time bulk messages, differentiated from campaigns by
 * broadcastFlag=true and a tighter consent/opt-out enforcement model.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Status (mirrors campaign lifecycle exactly) ────────────────────────────────
export const BROADCAST_STATUS = Object.freeze({
  DRAFT:     'DRAFT',
  APPROVED:  'APPROVED',
  SCHEDULED: 'SCHEDULED',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  CANCELLED: 'CANCELLED',
});
export const BROADCAST_STATUS_VALUES = Object.freeze(Object.values(BROADCAST_STATUS));

// ── Type ───────────────────────────────────────────────────────────────────────
export const BROADCAST_TYPE = Object.freeze({
  MARKETING:      'MARKETING',
  PROMOTIONAL:    'PROMOTIONAL',
  ANNOUNCEMENT:   'ANNOUNCEMENT',
  OFFER:          'OFFER',
  REMINDER:       'REMINDER',
  FESTIVAL:       'FESTIVAL',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  CUSTOM:         'CUSTOM',
});
export const BROADCAST_TYPE_VALUES = Object.freeze(Object.values(BROADCAST_TYPE));

// ── Audit actions ──────────────────────────────────────────────────────────────
export const BROADCAST_ACTION = Object.freeze({
  CREATE:   'CREATE',
  UPDATE:   'UPDATE',
  APPROVE:  'APPROVE',
  SCHEDULE: 'SCHEDULE',
  START:    'START',
  COMPLETE: 'COMPLETE',
  FAIL:     'FAIL',
  CANCEL:   'CANCEL',
  DELETE:   'DELETE',
});

// ── Status transition graph ────────────────────────────────────────────────────
export const ALLOWED_TRANSITIONS = Object.freeze({
  [BROADCAST_STATUS.DRAFT]:      [BROADCAST_STATUS.APPROVED, BROADCAST_STATUS.CANCELLED],
  [BROADCAST_STATUS.APPROVED]:   [BROADCAST_STATUS.SCHEDULED, BROADCAST_STATUS.RUNNING, BROADCAST_STATUS.CANCELLED],
  [BROADCAST_STATUS.SCHEDULED]:  [BROADCAST_STATUS.RUNNING, BROADCAST_STATUS.CANCELLED],
  [BROADCAST_STATUS.RUNNING]:    [BROADCAST_STATUS.COMPLETED, BROADCAST_STATUS.FAILED, BROADCAST_STATUS.CANCELLED],
  [BROADCAST_STATUS.COMPLETED]:  [],
  [BROADCAST_STATUS.FAILED]:     [BROADCAST_STATUS.DRAFT],
  [BROADCAST_STATUS.CANCELLED]:  [],
});

// ── Edit locks ─────────────────────────────────────────────────────────────────
export const READ_ONLY_STATUSES = Object.freeze([
  BROADCAST_STATUS.COMPLETED,
  BROADCAST_STATUS.CANCELLED,
]);
export const LOCKED_STATUSES = Object.freeze([
  BROADCAST_STATUS.SCHEDULED,
  BROADCAST_STATUS.RUNNING,
  ...READ_ONLY_STATUSES,
]);

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  CREATE:           ROLES.SALES_USER,
  READ:             ROLES.READ_ONLY_USER,
  UPDATE:           ROLES.SALES_USER,
  DELETE:           ROLES.TENANT_ADMIN,
  APPROVE:          ROLES.TENANT_ADMIN,
  SCHEDULE:         ROLES.SALES_USER,
  START:            ROLES.TENANT_ADMIN,
  COMPLETE:         ROLES.TENANT_ADMIN,
  FAIL:             ROLES.TENANT_ADMIN,
  CANCEL:           ROLES.TENANT_ADMIN,
  PREVIEW_AUDIENCE: ROLES.SALES_USER,
});

// ── Consent/opt-out values (mirrored from contacts.constants for audience query)
export const CONSENTED_STATUS   = 'CONSENTED';
export const OPTED_OUT_STATUS   = 'OPTED_OUT';

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Search / sort fields ──────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['name', 'description', 'templateName']);
export const SORTABLE_FIELDS   = Object.freeze([
  'createdAt', 'updatedAt', 'scheduledAt', 'startedAt', 'name',
  'recipientCount', 'status',
]);
