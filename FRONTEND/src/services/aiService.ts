// ============================================================================
// Mock AI Service Layer
// Deterministic, realistic responses. Structured so a real provider (OpenAI /
// Claude) can be dropped in later via VITE_AI_API_KEY without breaking the app.
// ============================================================================

import type { Lead, CallRecord } from '@/types';

const AI_ENABLED = Boolean((import.meta as { env?: Record<string, string> }).env?.VITE_AI_API_KEY);

export function isAiLive(): boolean {
  return AI_ENABLED;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
}

export interface QualificationResult {
  score: number;
  quality: string;
  temperature: Lead['lead_temperature'];
  painPoints: string[];
  buyingIntent: string;
  urgency: string;
  recommendedOffer: string;
  nextAction: string;
  reason: string;
  followUpDraft: string;
}

export function qualifyLead(lead: Lead, answers: Record<string, string>): QualificationResult {
  const answered = Object.values(answers).filter(Boolean).length;
  const seedScore = (hash(lead.id + answered) % 4) + Math.min(answered, 4) + 2;
  const score = Math.max(1, Math.min(10, seedScore));
  const temperature: Lead['lead_temperature'] = score >= 8 ? 'Hot' : score >= 5 ? 'Warm' : 'Cold';
  const offers = ['Scale Plan + Onboarding', 'Growth Plan', 'Pilot Program', 'Enterprise Package'];
  return {
    score,
    quality: score >= 8 ? 'Excellent fit' : score >= 5 ? 'Moderate fit' : 'Low fit',
    temperature,
    painPoints: [
      answers['What problem are you trying to solve?'] || 'Slow lead follow-up causing pipeline leakage',
      'Manual WhatsApp handling at scale',
      'No source-to-revenue attribution',
    ],
    buyingIntent: score >= 8 ? 'High — actively evaluating solutions' : score >= 5 ? 'Medium — researching options' : 'Low — early awareness',
    urgency: answers['How soon do you want to implement?'] || (score >= 7 ? 'Within 30 days' : 'This quarter'),
    recommendedOffer: offers[score % offers.length],
    nextAction: score >= 8 ? 'Book a strategy call now' : score >= 5 ? 'Send nurture sequence + case study' : 'Add to long-term nurture',
    reason: `Based on ${answered} qualifying answers, ${lead.name} shows ${temperature.toLowerCase()} intent. Budget and timeline align with the ${offers[score % offers.length]}.`,
    followUpDraft: `Hi ${lead.name.split(' ')[0]}, thanks for sharing those details! Based on what you described, I think our ${offers[score % offers.length]} is a strong fit. Do you have 15 minutes this week for a quick strategy call?`,
  };
}

export function generateLeadScore(lead: Lead): number {
  return Math.max(1, Math.min(10, (hash(lead.id) % 6) + 3));
}

const REPLY_LIBRARY: Record<string, string> = {
  default: 'Thanks so much for reaching out! I\'d love to learn more about your goals. What\'s the biggest revenue challenge you\'re facing right now?',
  booking: 'Happy to help! Here\'s my calendar — grab any slot that works for you: {{booking_link}} 📅',
  payment: 'Great news! Here\'s your secure payment link to get started right away: {{payment_link}}. Let me know if you have any questions!',
  objection: 'Totally understand — budget is an important consideration. Most clients see a full ROI within 60 days. Would a quick case study help?',
  followup: 'It was great speaking with you earlier! As promised, here\'s a quick recap and the next steps. Let me know your thoughts. 🙌',
  shorter: '',
  professional: '',
  persuasive: '',
};

export function generateWhatsAppReply(context: string, mode: keyof typeof REPLY_LIBRARY = 'default'): string {
  return REPLY_LIBRARY[mode] || REPLY_LIBRARY.default;
}

export function rewriteWhatsAppMessage(text: string, mode: 'shorter' | 'professional' | 'persuasive'): string {
  switch (mode) {
    case 'shorter':
      return text.split('.').slice(0, 1).join('.').trim() + (text.includes('{{') ? ' ' + (text.match(/\{\{.*?\}\}/) || [''])[0] : '');
    case 'professional':
      return `Dear valued client,\n\n${text}\n\nWe look forward to partnering with you.\nBest regards.`;
    case 'persuasive':
      return `${text} ✨ We've helped 200+ businesses just like yours unlock predictable revenue — and spots are limited this month. Shall we get started?`;
    default:
      return text;
  }
}

export function generateFollowUpMessage(lead: Lead): string {
  return `Hi ${lead.name.split(' ')[0]}, following up on our conversation! I'd love to help ${lead.company || 'your team'} hit its revenue goals. Are you free for a quick call this week?`;
}

export interface CallSummaryResult {
  summary: string;
  objections: string[];
  nextSteps: string[];
  followUpDraft: string;
  proposalOutline: string;
  score: number;
}

export function summarizeCall(transcript: string, lead?: Lead): CallSummaryResult {
  const name = lead?.name.split(' ')[0] || 'the prospect';
  return {
    summary: `${name} is experiencing slow lead follow-up causing pipeline leakage. Strong fit for AI qualification + WhatsApp automation. Budget sensitivity noted; a second decision-maker is involved. Overall a promising opportunity with clear next steps.`,
    objections: extractObjections(transcript),
    nextSteps: ['Send tailored proposal within 24h', 'Share ROI calculator & case study', 'Schedule follow-up with co-founder'],
    followUpDraft: `Hi ${name}, great speaking today! As discussed, I'll send over a tailored proposal and the ROI breakdown. Looking forward to next steps. 🚀`,
    proposalOutline: `1. Problem: Revenue leakage from slow follow-up\n2. Solution: InnovateX Revenue OS (AI Qualification + WhatsApp + Pipeline)\n3. Implementation: 2-week onboarding\n4. Pricing: Scale Plan\n5. Expected ROI: 3x within 90 days\n6. Next steps & timeline`,
    score: 7 + (hash(transcript) % 3),
  };
}

export function extractObjections(transcript: string): string[] {
  const found: string[] = [];
  const t = transcript.toLowerCase();
  if (t.includes('pric') || t.includes('budget') || t.includes('cost')) found.push('Pricing / budget concern');
  if (t.includes('co-founder') || t.includes('team') || t.includes('decision')) found.push('Needs additional buy-in');
  if (t.includes('competitor') || t.includes('evaluating')) found.push('Evaluating alternatives');
  if (t.includes('time') || t.includes('busy') || t.includes('quarter')) found.push('Timing concern');
  return found.length ? found : ['No major objections surfaced'];
}

export function draftProposal(lead: Lead): string {
  return `PROPOSAL — ${lead.company || lead.name}\n\nObjective: Eliminate revenue leakage and automate the source-to-revenue workflow.\n\nScope: AI Lead Qualification · WhatsApp Operating Panel · Pipeline · Attribution\n\nInvestment: ${lead.value ? '$' + lead.value.toLocaleString() : 'Scale Plan'}\n\nExpected outcome: 3x faster lead response, +40% booking rate, full revenue attribution.`;
}

export function generateWeeklyBriefing(stats: { leads: number; pipeline: number; revenue: number; hot: number }): string {
  return `📊 Weekly AI Briefing\n\nThis week you captured ${stats.leads} leads with ${stats.hot} flagged HOT by AI. Pipeline value stands at $${stats.pipeline.toLocaleString()} and closed revenue reached $${stats.revenue.toLocaleString()}.\n\n🔑 Recommendations:\n• Prioritize the ${stats.hot} hot leads — they have a 3x higher close rate.\n• 3 proposals have been idle for 5+ days; send a follow-up today.\n• WhatsApp reply time crept up — assign a second rep to the inbox.\n\nForecast: On track to exceed target by ~12% if hot leads are actioned within 48h.`;
}

export function summarizeCallRecord(call: CallRecord, lead?: Lead): CallSummaryResult {
  return summarizeCall(call.transcript, lead);
}
