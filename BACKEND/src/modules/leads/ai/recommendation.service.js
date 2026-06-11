import { nextActionService } from './next-action.service.js';
import { leadAnalysisService } from './lead-analysis.service.js';

/**
 * Top-level recommendation used by the lead detail drawer.
 * Combines the next-best-action with analysis signals into one payload.
 */
export const recommendationService = {
  forLead(lead = {}) {
    const next = nextActionService.recommend(lead);
    const analysis = leadAnalysisService.analyze(lead);

    const suggestions = [];
    if (analysis.ghostingRisk === 'high') {
      suggestions.push('High ghosting risk — prioritize re-engagement.');
    }
    if (analysis.engagement === 'high') {
      suggestions.push('Strong engagement — consider fast-tracking to a call.');
    }
    if (lead.consent_status !== 'granted' && !lead.opt_out_status) {
      suggestions.push('Capture consent before bulk messaging.');
    }

    return {
      nextAction: next.action,
      reason: next.reason,
      analysis,
      suggestions,
    };
  },
};
