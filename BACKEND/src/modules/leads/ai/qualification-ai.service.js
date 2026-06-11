import { scoreLead, temperatureFor } from '../scoring/scoring.service.js';
import { LEAD_TEMPERATURE } from '../lead/lead.constants.js';

const isAiLive = () => Boolean(process.env.AI_API_KEY);

/**
 * Mock qualification assessment. Combines discovery answers with the
 * rule-based score to produce the assessment the drawer/qualification page
 * expects (fit score, intent, urgency, pain points, recommended offer,
 * next action, follow-up draft).
 *
 * @param {object} lead
 * @param {object} answers - discovery answers (budget, timeline, authority, need…)
 */
export const qualificationAiService = {
  assess(lead = {}, answers = {}) {
    const { score } = scoreLead(lead);

    // Discovery answers nudge the score (deterministic, bounded).
    let fit = score;
    if (answers.budget === 'high') fit += 2;
    if (answers.timeline === 'immediate') fit += 1;
    if (answers.authority === 'decision_maker') fit += 1;
    fit = Math.max(0, Math.min(10, fit));

    const temperature = temperatureFor(fit);

    const buyingIntent =
      answers.timeline === 'immediate'
        ? 'high'
        : answers.timeline === 'this_quarter'
          ? 'medium'
          : 'low';

    const urgency = buyingIntent;
    const quality = fit >= 8 ? 'A' : fit >= 5 ? 'B' : 'C';

    const painPoints = []
      .concat(answers.pain_points || answers.challenge || [])
      .filter(Boolean);

    return {
      fitScore: fit,
      temperature,
      quality,
      buyingIntent,
      urgency,
      painPoints,
      recommendedOffer:
        temperature === LEAD_TEMPERATURE.HOT
          ? 'Premium / high-touch package'
          : 'Starter package or paid trial',
      nextAction:
        temperature === LEAD_TEMPERATURE.HOT
          ? 'Book a call within 24 hours'
          : 'Add to a nurture sequence',
      followUpDraft: buildFollowUp(lead, temperature),
      isLive: isAiLive(),
    };
  },
};

function buildFollowUp(lead, temperature) {
  const name = lead.name || 'there';
  if (temperature === LEAD_TEMPERATURE.HOT) {
    return `Hi ${name}, thanks for the details — based on what you shared I think we can help quickly. Do you have 20 minutes this week for a quick call?`;
  }
  return `Hi ${name}, thanks for reaching out! I'll send over a few resources that match your goals and check back in soon.`;
}
