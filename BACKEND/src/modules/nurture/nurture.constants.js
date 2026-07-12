/**
 * =============================================================================
 * InnovateX Revenue OS — Nurture Engine Constants
 * =============================================================================
 *
 * FILE: src/modules/nurture/nurture.constants.js
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 entity shapes:
 *   NurtureSequence:   name, description, steps(NurtureStep[]),
 *                      status('active'|'paused'|'draft'), enrolled_count, trigger
 *   NurtureStep:       id, order, channel('WhatsApp'|'Email'|'SMS'|'Manual task'),
 *                      delay_days, message
 *   NurtureEnrollment: sequence_id, lead_id, current_step, status, steps_sent[]
 *
 * SOURCE: MASTER_SPEC.md §B7:
 *   "6 default sequences (Hot Lead, Webinar, Ghosted Re-Engagement,
 *    No-Show Recovery, Payment Reminder, Proposal Follow-Up). Multi-channel
 *    steps (WhatsApp/Email/SMS/Manual task) with delay days.
 *    Create sequence, activate/pause, enroll lead (→ tracking event).
 *    🔭 real scheduled sending."
 *
 * DESIGN NOTE — this is the GENERIC, multi-channel nurture engine, distinct
 * from the WhatsApp-only `whatsapp/submodules/nurtures` submodule. This
 * module's steps can be WhatsApp, Email, SMS, or a Manual task — the WA
 * submodule only ever sends WhatsApp templates. Real scheduled sending
 * (actually dispatching each step at the right delay) is explicitly
 * development-phase per spec; this module implements sequence management
 * and lead enrollment, which is what §B7 marks as ✅ done.
 */

// ── Sequence status ─────────────────────────────────────────────────────────────
export const SEQUENCE_STATUS = Object.freeze({
  DRAFT:  'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
});
export const SEQUENCE_STATUS_VALUES = Object.freeze(Object.values(SEQUENCE_STATUS));

// ── Nurture channel — exactly 4 per MASTER_SPEC.md §I2 "NurtureChannel(4)" ────
export const NURTURE_CHANNEL = Object.freeze({
  WHATSAPP:     'WhatsApp',
  EMAIL:        'Email',
  SMS:          'SMS',
  MANUAL_TASK:  'Manual task',
});
export const NURTURE_CHANNEL_VALUES = Object.freeze(Object.values(NURTURE_CHANNEL));

// ── Enrollment status ──────────────────────────────────────────────────────────
export const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE:    'active',
  PAUSED:    'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});
export const ENROLLMENT_STATUS_VALUES = Object.freeze(Object.values(ENROLLMENT_STATUS));

/**
 * The 6 default sequence names referenced in MASTER_SPEC.md §B7. Documented
 * here for reference / seed scripts — NOT auto-created by this module.
 * Wiring an actual "seed my tenant with defaults" behavior is a deliberate
 * follow-up, since it would run on every fresh tenant and should be a
 * conscious product decision, not a side effect of loading this file.
 */
export const DEFAULT_SEQUENCE_NAMES = Object.freeze([
  'Hot Lead',
  'Webinar',
  'Ghosted Re-Engagement',
  'No-Show Recovery',
  'Payment Reminder',
  'Proposal Follow-Up',
]);

// ── Step constraints ───────────────────────────────────────────────────────────
export const MAX_STEPS_PER_SEQUENCE = 20;
export const MAX_DELAY_DAYS         = 365;
export const MAX_MESSAGE_LENGTH     = 2000;

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Searchable fields ──────────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['name', 'description']);
