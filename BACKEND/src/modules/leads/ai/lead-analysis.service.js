import { RECENT_CONTACT_DAYS } from '../scoring/scoring.constants.js';

/**
 * Lightweight, deterministic lead analysis (mock AI).
 * Surfaces engagement / risk signals for the drawer.
 */
export const leadAnalysisService = {
  analyze(lead = {}) {
    const signals = [];

    if (lead.email && lead.phone) signals.push('Complete contact details');
    if (lead.company) signals.push('Has company info');
    if (lead.consent_status === 'granted') signals.push('Consent granted');
    if (lead.opt_out_status) signals.push('Opted out of messaging');

    const lastContact = lead.last_contacted_at
      ? new Date(lead.last_contacted_at)
      : null;
    const daysSinceContact = lastContact
      ? Math.floor((Date.now() - lastContact.getTime()) / 86400000)
      : null;

    let ghostingRisk = 'low';
    if (daysSinceContact === null) ghostingRisk = 'unknown';
    else if (daysSinceContact > RECENT_CONTACT_DAYS * 2) ghostingRisk = 'high';
    else if (daysSinceContact > RECENT_CONTACT_DAYS) ghostingRisk = 'medium';

    const engagement =
      (lead.qualification_score || 0) >= 8
        ? 'high'
        : (lead.qualification_score || 0) >= 5
          ? 'medium'
          : 'low';

    return { engagement, ghostingRisk, daysSinceContact, signals };
  },
};
