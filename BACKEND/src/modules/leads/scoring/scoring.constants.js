/**
 * Scoring configuration. Tunable weights that map lead attributes to a
 * 0–10 qualification score, plus the thresholds that derive temperature.
 */

export const SCORE_MAX = 10;

// Points contributed by each factor (summed, then clamped to SCORE_MAX).
export const SCORE_WEIGHTS = Object.freeze({
  hasEmail: 1,
  hasPhone: 1,
  hasCompany: 1,
  hasWhatsApp: 1,
  hasConsent: 1,
  highValue: 2, // value over HIGH_VALUE_THRESHOLD
  goodSource: 2, // source in HIGH_INTENT_SOURCES
  recentlyContacted: 1, // contacted within RECENT_CONTACT_DAYS
});

export const HIGH_VALUE_THRESHOLD = 50000;
export const RECENT_CONTACT_DAYS = 7;

export const HIGH_INTENT_SOURCES = Object.freeze([
  'Referral',
  'WhatsApp',
  'Website',
  'Webinar',
]);

// score → temperature
export const TEMPERATURE_THRESHOLDS = Object.freeze({
  HOT: 8, // >= 8
  WARM: 5, // >= 5
  // else COLD
});
