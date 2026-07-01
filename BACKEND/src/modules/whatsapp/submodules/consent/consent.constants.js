/**
 * WhatsApp Consent & Opt-Out — constants.
 *
 * All enums, defaults, transition rules and role mappings.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Consent status ─────────────────────────────────────────────────────────────
export const CONSENT_STATUS = Object.freeze({
  OPTED_IN:  'OPTED_IN',
  OPTED_OUT: 'OPTED_OUT',
  PENDING:   'PENDING',
  EXPIRED:   'EXPIRED',
  BLOCKED:   'BLOCKED',
});
export const CONSENT_STATUS_VALUES = Object.freeze(Object.values(CONSENT_STATUS));

// Statuses from which a contact MAY receive WhatsApp messages.
export const SENDABLE_STATUSES = Object.freeze([CONSENT_STATUS.OPTED_IN]);

// ── Opt-in methods ─────────────────────────────────────────────────────────────
export const OPT_IN_METHOD = Object.freeze({
  WEB_FORM:  'WEB_FORM',
  CHECKBOX:  'CHECKBOX',
  QR_CODE:   'QR_CODE',
  SMS:       'SMS',
  WHATSAPP:  'WHATSAPP',
  IMPORT:    'IMPORT',
  API:       'API',
  MANUAL:    'MANUAL',
  OTHER:     'OTHER',
});
export const OPT_IN_METHOD_VALUES = Object.freeze(Object.values(OPT_IN_METHOD));

// ── Opt-out methods ────────────────────────────────────────────────────────────
export const OPT_OUT_METHOD = Object.freeze({
  STOP:        'STOP',
  UNSUBSCRIBE: 'UNSUBSCRIBE',
  MANUAL:      'MANUAL',
  API:         'API',
  WEB:         'WEB',
  OTHER:       'OTHER',
});
export const OPT_OUT_METHOD_VALUES = Object.freeze(Object.values(OPT_OUT_METHOD));

// ── Consent sources ────────────────────────────────────────────────────────────
export const CONSENT_SOURCE = Object.freeze({
  CRM:          'CRM',
  CAMPAIGN:     'CAMPAIGN',
  LANDING_PAGE: 'LANDING_PAGE',
  WEBSITE:      'WEBSITE',
  WHATSAPP:     'WHATSAPP',
  API:          'API',
  IMPORT:       'IMPORT',
  OTHER:        'OTHER',
});
export const CONSENT_SOURCE_VALUES = Object.freeze(Object.values(CONSENT_SOURCE));

// ── History actions ────────────────────────────────────────────────────────────
export const CONSENT_ACTION = Object.freeze({
  CREATE:   'CREATE',
  OPT_IN:   'OPT_IN',
  OPT_OUT:  'OPT_OUT',
  BLOCK:    'BLOCK',
  UNBLOCK:  'UNBLOCK',
  EXPIRE:   'EXPIRE',
  VERIFY:   'VERIFY',
});

/**
 * Allowed status transitions.
 * BLOCKED can only leave via explicit unblock (handled in service, restores
 * previous state). OPTED_IN ⇄ OPTED_OUT and re-opt-in from EXPIRED/PENDING.
 */
export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [CONSENT_STATUS.PENDING]:   [CONSENT_STATUS.OPTED_IN, CONSENT_STATUS.OPTED_OUT, CONSENT_STATUS.BLOCKED, CONSENT_STATUS.EXPIRED],
  [CONSENT_STATUS.OPTED_IN]:  [CONSENT_STATUS.OPTED_OUT, CONSENT_STATUS.BLOCKED, CONSENT_STATUS.EXPIRED],
  [CONSENT_STATUS.OPTED_OUT]: [CONSENT_STATUS.OPTED_IN, CONSENT_STATUS.BLOCKED],
  [CONSENT_STATUS.EXPIRED]:   [CONSENT_STATUS.OPTED_IN, CONSENT_STATUS.BLOCKED],
  [CONSENT_STATUS.BLOCKED]:   [CONSENT_STATUS.OPTED_IN, CONSENT_STATUS.OPTED_OUT, CONSENT_STATUS.PENDING, CONSENT_STATUS.EXPIRED],
});

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Searchable fields ──────────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['phoneNumber', 'contactName', 'leadName']);

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  CREATE:   ROLES.SALES_USER,
  READ:     ROLES.SALES_USER,
  VERIFY:   ROLES.SALES_USER,
  OPT_IN:   ROLES.SALES_USER,
  OPT_OUT:  ROLES.SALES_USER,
  BLOCK:    ROLES.TENANT_ADMIN,
  UNBLOCK:  ROLES.TENANT_ADMIN,
  HISTORY:  ROLES.SALES_USER,
});
