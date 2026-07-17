import { apiClient } from '@/lib/apiClient';
import type { Call, CallInput, CallUpdateInput, CallListQuery, CallKpis } from '@/types/call';

/**
 * SOURCE: src/modules/calls/call.controller.js
 * Same wrapping convention as bookingsApi.ts -- single-resource responses
 * wrap the call in a named key, confirmed per-endpoint from the actual
 * controller.
 */
export const callsApi = {
  list: (query?: CallListQuery) =>
    apiClient.getPaginated<Call>('/calls', query as Record<string, string | number | boolean | undefined>),

  getKpis: () => apiClient.get<CallKpis>('/calls/kpis'),

  get: (id: string) => apiClient.get<{ call: Call }>(`/calls/${id}`).then((r) => r.call),

  listByLead: (leadId: string) =>
    apiClient.get<{ calls: Call[] }>(`/calls/lead/${leadId}`).then((r) => r.calls),

  /**
   * POST /api/calls -- the AI summary (summary/objections/next_steps/
   * follow_up_draft/proposal_outline/score) is generated SYNCHRONOUSLY on
   * the backend and comes back already attached to the returned call --
   * there is no separate "preview" step.
   */
  create: (input: CallInput) =>
    apiClient.post<{ call: Call }>('/calls', input).then((r) => r.call),

  update: (id: string, patch: CallUpdateInput) =>
    apiClient.patch<{ call: Call }>(`/calls/${id}`, patch).then((r) => r.call),

  /** POST /api/calls/:id/ai-summary -- re-runs AI on the existing transcript. */
  regenerateAiSummary: (id: string) =>
    apiClient.post<{ call: Call }>(`/calls/${id}/ai-summary`).then((r) => r.call),
};