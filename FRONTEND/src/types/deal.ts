/**
 * Real Pipeline/Deal types -- match the backend exactly.
 *
 * IMPORTANT: pipeline stages are SYSTEM-DEFINED on this backend -- there is
 * no per-tenant custom-stages concept (unlike the old mock prototype, which
 * read stages from `settings.pipeline_stages`). These 9 stages, their board
 * keys, and their order are fixed constants on the server
 * (deal.constants.js) -- duplicated here deliberately so the board renders
 * without an extra round-trip, and because the server itself treats them as
 * compile-time constants, not data.
 *
 * Like Leads, this module predates the { success, data } envelope --
 * responses are raw (toDealDTO gives `id`, not `_id`), consumed via
 * requestRaw() in dealsApi.ts.
 */

export type DealStage =
  | 'New Lead' | 'Qualified' | 'Booked Call' | 'Call Completed'
  | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost' | 'Nurture';

export const STAGE_ORDER: DealStage[] = [
  'New Lead', 'Qualified', 'Booked Call', 'Call Completed',
  'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Nurture',
];

/** Stage label -> board grouping key -- must match STAGE_BOARD_KEY in deal.constants.js exactly. */
export const STAGE_BOARD_KEY: Record<DealStage, string> = {
  'New Lead': 'new_lead',
  'Qualified': 'qualified',
  'Booked Call': 'booked_call',
  'Call Completed': 'call_completed',
  'Proposal Sent': 'proposal_sent',
  'Negotiation': 'negotiation',
  'Won': 'won',
  'Lost': 'lost',
  'Nurture': 'nurture',
};

export const CLOSED_STAGES: DealStage[] = ['Won', 'Lost'];

/**
 * Sensible default probability per stage -- mirrors STAGE_DEFAULT_PROBABILITY
 * in deal.constants.js exactly. Shown in the read-only "Pipeline Settings"
 * info panel since stages themselves are NOT tenant-configurable on this
 * backend -- there's nothing to actually edit, only to document.
 */
export const STAGE_DEFAULT_PROBABILITY: Record<DealStage, number> = {
  'New Lead': 10,
  'Qualified': 25,
  'Booked Call': 40,
  'Call Completed': 55,
  'Proposal Sent': 70,
  'Negotiation': 85,
  'Won': 100,
  'Lost': 0,
  'Nurture': 15,
};

/** Per-stage colour for the column dot -- presentation only, not from the backend. */
export const STAGE_COLOR: Record<DealStage, string> = {
  'New Lead': '#64748b',
  'Qualified': '#3b82f6',
  'Booked Call': '#8b5cf6',
  'Call Completed': '#06b6d4',
  'Proposal Sent': '#f59e0b',
  'Negotiation': '#ec4899',
  'Won': '#10b981',
  'Lost': '#ef4444',
  'Nurture': '#84cc16',
};

/** GET/PATCH/POST deal shape -- toDealDTO (_id -> id). */
export interface Deal {
  id: string;
  tenant_id: string;
  lead_id: string;
  title: string;
  description: string;
  value: number;
  probability: number;
  stage: DealStage;
  source: string;
  assigned_user_id: string | null;
  expected_close_date: string | null;
  currency: string;
  archived: boolean;
  stageHistory: { stage: DealStage; movedAt: string; movedBy: string | null }[];
  created_at: string;
  updated_at: string;
}

/** POST body -- lead_id, title, stage required (validator enforces this even though the service has an unreachable default). */
export interface DealInput {
  lead_id?: string;
  title?: string;
  description?: string;
  value?: number;
  probability?: number;
  stage?: DealStage;
  source?: string;
  assigned_user_id?: string | null;
  expected_close_date?: string | null;
  currency?: string;
}

/** GET /api/pipeline -- one array per stage, ALL 9 keys always present. */
export type DealBoard = Record<string, Deal[]>;

/** GET /api/pipeline/stats */
export interface PipelineStats {
  totalDeals: number;
  pipelineValue: number;
  wonValue: number;
  lostValue: number;
  /** Ratio 0-1 (Won / (Won + Lost)) -- multiply by 100 for display. */
  winRate: number;
  stageTotals: Record<string, { count: number; value: number }>;
}

export interface DealListQuery {
  stage?: DealStage;
  source?: string;
  assigned_user_id?: string;
  lead_id?: string;
  minValue?: number;
  maxValue?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}
