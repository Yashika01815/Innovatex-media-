import { scoringRules } from './scoring.rules.js';
import {
  SCORE_MAX,
  TEMPERATURE_THRESHOLDS,
} from './scoring.constants.js';
import { LEAD_TEMPERATURE } from '../lead/lead.constants.js';

/**
 * Compute a deterministic 0–10 qualification score and derived temperature
 * from a lead's attributes.
 *
 * @returns {{ score: number, temperature: string, breakdown: object[] }}
 */
export function scoreLead(lead = {}) {
  const breakdown = scoringRules.map((fn) => fn(lead));
  const raw = breakdown.reduce((sum, r) => sum + r.points, 0);
  const score = Math.min(raw, SCORE_MAX);
  return { score, temperature: temperatureFor(score), breakdown };
}

export function temperatureFor(score) {
  if (score >= TEMPERATURE_THRESHOLDS.HOT) return LEAD_TEMPERATURE.HOT;
  if (score >= TEMPERATURE_THRESHOLDS.WARM) return LEAD_TEMPERATURE.WARM;
  return LEAD_TEMPERATURE.COLD;
}

export const scoringService = { scoreLead, temperatureFor };
