/**
 * Real AI Qualification types -- match the backend exactly.
 *
 * Standard envelope (like Bookings/Calls). No toJSON transform -- raw `_id`.
 * lead_id is ALWAYS populated (name/email/company/source/qualification_score/
 * lead_temperature/status) -- qualification.repository.js .populate().
 *
 * IMPORTANT two-step flow, different from Calls:
 *   1. POST /run creates a qualification record with applied: false --
 *      the lead itself is NOT touched yet, this is "for review."
 *   2. POST /:id/apply is a SEPARATE action that then updates the lead's
 *      score/temperature/status. Until apply is called, running
 *      qualification has zero effect on the lead record.
 */

export type QualityGrade = 'A' | 'B' | 'C';
export type BuyingIntent = 'high' | 'medium' | 'low';
export type QualificationRoute = 'book_call' | 'add_nurture' | 'sales_review';
export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

export interface QualificationLeadRef {
  _id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  qualification_score: number;
  lead_temperature: LeadTemperature | null;
  status: string;
}

export interface Qualification {
  _id: string;
  tenant_id: string;
  lead_id: QualificationLeadRef;
  answered_by: string | null;
  answers: Record<string, string>;
  fit_score: number;
  temperature: LeadTemperature | null;
  quality: QualityGrade | null;
  buying_intent: BuyingIntent | null;
  urgency: BuyingIntent | null;
  pain_points: string[];
  recommended_offer: string;
  next_action: string;
  follow_up_draft: string;
  reason: string;
  is_ai_live: boolean;
  suggested_route: QualificationRoute | null;
  applied: boolean;
  applied_at: string | null;
  applied_by: string | null;
  override_score: number | null;
  override_at: string | null;
  override_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunQualificationInput {
  lead_id: string;
  answers: Record<string, string>;
}

export interface QualificationListQuery {
  applied?: boolean;
  temperature?: LeadTemperature;
  lead_id?: string;
  page?: number;
  limit?: number;
}

/** Human-readable label per suggested route, for button text. */
export const ROUTE_LABELS: Record<QualificationRoute, string> = {
  book_call: 'Apply & route to booking',
  add_nurture: 'Apply & route to nurture',
  sales_review: 'Apply & flag for sales review',
};