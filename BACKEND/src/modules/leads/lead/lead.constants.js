/**
 * Lead domain constants.
 * KEYS are canonical identifiers; VALUES are the human-readable strings
 * stored in the DB and used by the API/frontend (e.g. ?status=Qualified).
 */

export const LEAD_STATUS = Object.freeze({
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  BOOKED: 'Booked',
  CALL_COMPLETED: 'Call Completed',
  PROPOSAL_SENT: 'Proposal Sent',
  WON: 'Won',
  LOST: 'Lost',
  NURTURE: 'Nurture',
  GHOSTED: 'Ghosted',
});
export const LEAD_STATUS_VALUES = Object.freeze(Object.values(LEAD_STATUS));

export const LEAD_TEMPERATURE = Object.freeze({
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
});
export const LEAD_TEMPERATURE_VALUES = Object.freeze(
  Object.values(LEAD_TEMPERATURE),
);

export const CONSENT_STATUS = Object.freeze({
  GRANTED: 'granted',
  PENDING: 'pending',
  REVOKED: 'revoked',
});
export const CONSENT_STATUS_VALUES = Object.freeze(
  Object.values(CONSENT_STATUS),
);

/** Fields the free-text search scans. */
export const SEARCHABLE_FIELDS = Object.freeze([
  'name',
  'email',
  'phone',
  'company',
]);
