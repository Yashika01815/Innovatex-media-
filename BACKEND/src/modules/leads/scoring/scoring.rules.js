import {
  SCORE_WEIGHTS,
  HIGH_VALUE_THRESHOLD,
  HIGH_INTENT_SOURCES,
  RECENT_CONTACT_DAYS,
} from './scoring.constants.js';

/**
 * Each rule inspects a lead and returns { points, factor, hit }.
 * Pure functions — easy to unit test and reorder.
 */
export const scoringRules = [
  (lead) => rule('hasEmail', !!lead.email),
  (lead) => rule('hasPhone', !!lead.phone),
  (lead) => rule('hasCompany', !!lead.company),
  (lead) => rule('hasWhatsApp', !!lead.whatsapp_number),
  (lead) => rule('hasConsent', lead.consent_status === 'granted'),
  (lead) => rule('highValue', Number(lead.value) >= HIGH_VALUE_THRESHOLD),
  (lead) =>
    rule('goodSource', HIGH_INTENT_SOURCES.includes(lead.source || '')),
  (lead) => rule('recentlyContacted', isRecent(lead.last_contacted_at)),
];

function rule(factor, hit) {
  return { factor, hit, points: hit ? SCORE_WEIGHTS[factor] || 0 : 0 };
}

function isRecent(date) {
  if (!date) return false;
  const ms = Date.now() - new Date(date).getTime();
  return ms <= RECENT_CONTACT_DAYS * 24 * 60 * 60 * 1000;
}
