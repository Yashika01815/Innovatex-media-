export const CONSENT_STATUS = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  CONSENTED: 'CONSENTED',
  PENDING: 'PENDING',
  REVOKED: 'REVOKED',
});
export const CONSENT_STATUS_VALUES = Object.freeze(Object.values(CONSENT_STATUS));

export const OPT_OUT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  OPTED_OUT: 'OPTED_OUT',
});
export const OPT_OUT_STATUS_VALUES = Object.freeze(Object.values(OPT_OUT_STATUS));

export const CONTACT_STATUS = Object.freeze({
  NEW: 'New',
  OPEN: 'Open',
  QUALIFIED: 'Qualified',
  BOOKED: 'Booked',
  WON: 'Won',
  LOST: 'Lost',
  GHOSTED: 'Ghosted',
});
export const CONTACT_STATUS_VALUES = Object.freeze(Object.values(CONTACT_STATUS));

// Provider modes the module operates under (contacts are provider-agnostic).
export const PROVIDER_MODE = Object.freeze({
  NATIVE: 'NATIVE',
  THIRD_PARTY: 'THIRD_PARTY',
  SIMULATION: 'SIMULATION',
});

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const SEARCHABLE_FIELDS = Object.freeze([
  'name',
  'phone',
  'whatsappNumber',
  'email',
]);

export const SORTABLE_FIELDS = Object.freeze([
  'createdAt',
  'updatedAt',
  'lastMessageAt',
  'lastContactedAt',
  'score',
  'name',
]);
