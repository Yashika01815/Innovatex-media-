/**
 * Real Call types -- match the backend exactly.
 *
 * Standard envelope (like Bookings), NOT raw (unlike Leads/Pipeline).
 * No toJSON transform on the Call model -- raw `_id`, not `id`.
 *
 * lead_id and deal_id are ALWAYS populated by the backend
 * (call.repository.js .populate() on every read).
 *
 * IMPORTANT: unlike the old mock version, there is NO "preview AI summary
 * before saving" step. The backend generates summary/objections/next_steps/
 * follow_up_draft/proposal_outline/score SYNCHRONOUSLY inside POST /api/calls
 * (call.service.js createCall() calls generateAiSummary() before creating
 * the document) -- so the AI result comes back already attached to the
 * created call, not as a separate preview action.
 */

export type CallOutcome =
  | 'Interested' | 'Not Interested' | 'Needs Follow-Up' | 'Proposal Requested'
  | 'Closed Won' | 'Closed Lost' | 'No Show';

export const CALL_OUTCOME_VALUES: CallOutcome[] = [
  'Interested', 'Not Interested', 'Needs Follow-Up', 'Proposal Requested', 'Closed Won', 'Closed Lost', 'No Show',
];

export interface CallLeadRef {
  _id: string;
  name: string;
  email: string;
  source: string;
  company: string;
}

export interface CallDealRef {
  _id: string;
  stage: string;
  value: number;
}

export interface Call {
  _id: string;
  tenant_id: string;
  lead_id: CallLeadRef;
  deal_id: CallDealRef | null;
  assigned_user_id: string | null;
  outcome: CallOutcome;
  call_date: string;
  duration_minutes: number;
  transcript: string;
  summary: string;
  objections: string[];
  next_steps: string[];
  follow_up_draft: string;
  proposal_outline: string;
  score: number;
  ai_generated: boolean;
  source: string | null;
  campaign: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** POST body -- only lead_id, outcome, call_date are required. */
export interface CallInput {
  lead_id: string;
  outcome: CallOutcome;
  call_date: string;
  assigned_user_id?: string;
  duration_minutes?: number;
  transcript?: string;
}

/** PATCH body -- manual corrections after creation. */
export interface CallUpdateInput {
  outcome?: CallOutcome;
  call_date?: string;
  duration_minutes?: number;
  transcript?: string;
  summary?: string;
  score?: number;
}

export interface CallListQuery {
  outcome?: CallOutcome;
  assigned_user_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

/** GET /api/calls/kpis -- SOURCE: call.repository.js getKpiCounts. */
export interface CallKpis {
  total: number;
  proposalsRequested: number;
  closedWon: number;
  avgCallScore: number;
}