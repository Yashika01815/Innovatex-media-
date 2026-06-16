/**
 * Booking domain constants.
 * KEYS are canonical identifiers; VALUES are the human-readable strings
 * stored in the DB and used by the API/frontend.
 *
 * SOURCE: MASTER_SPEC.md §B8, §I2 BookingStatus
 *         DEVELOPER_HANDOFF.md §6 Booking entity
 */

export const BOOKING_STATUS = Object.freeze({
  SCHEDULED:   'Scheduled',
  COMPLETED:   'Completed',
  NO_SHOW:     'No Show',
  CANCELLED:   'Cancelled',
  RESCHEDULED: 'Rescheduled',
});
export const BOOKING_STATUS_VALUES = Object.freeze(Object.values(BOOKING_STATUS));

/**
 * Meeting types shown in the "Type" column.
 * SOURCE: FRONTEND_SPEC §9 screenshot (Discovery Call, Proposal Review)
 *         DEVELOPER_HANDOFF.md §6 meeting_type field
 */
export const MEETING_TYPES = Object.freeze({
  DISCOVERY_CALL:  'Discovery Call',
  PROPOSAL_REVIEW: 'Proposal Review',
  STRATEGY_CALL:   'Strategy Call',
  DEMO:            'Demo',
  FOLLOW_UP:       'Follow Up',
  ONBOARDING_CALL: 'Onboarding Call',
  CLOSING_CALL:    'Closing Call',
});
export const MEETING_TYPE_VALUES = Object.freeze(Object.values(MEETING_TYPES));

/**
 * Deal stage set when a booking is created or advanced.
 * VALUE must match DEAL_STAGE.BOOKED_CALL in deal.constants.js exactly.
 * SOURCE: DEVELOPER_HANDOFF.md §8 "creates/advances deal to booked_call"
 *         deal.constants.js → DEAL_STAGE.BOOKED_CALL = 'Booked Call'
 */
export const PIPELINE_STAGE_ON_BOOKING = 'Booked Call';

/**
 * Lead status set when a booking is created.
 * VALUE must match LEAD_STATUS.BOOKED in lead.constants.js exactly.
 * SOURCE: DEVELOPER_HANDOFF.md §8 "lead→Booked"
 *         lead.constants.js → LEAD_STATUS.BOOKED = 'Booked'
 */
export const LEAD_STATUS_ON_BOOKING = 'Booked';

/**
 * Lead status set when booking is marked Completed.
 * VALUE must match LEAD_STATUS.CALL_COMPLETED in lead.constants.js exactly.
 */
export const LEAD_STATUS_ON_COMPLETION = 'Call Completed';

/**
 * Tracking event type emitted on booking creation.
 * SOURCE: MASTER_SPEC.md §I2 TrackingEventType (18 types) — 'Booking Created'
 */
export const TRACKING_EVENT_ON_BOOKING = 'Booking Created';

/** Default booking duration in minutes. */
export const DEFAULT_DURATION_MINUTES = 30;