import { apiClient } from '@/lib/apiClient';
import type { Qualification, RunQualificationInput, QualificationListQuery } from '@/types/qualification';
import type { Lead } from '@/types/lead';

/**
 * SOURCE: src/modules/qualification/qualification.controller.js
 * Same wrapping convention as bookingsApi.ts/callsApi.ts.
 */
export const qualificationApi = {
  list: (query?: QualificationListQuery) =>
    apiClient.getPaginated<Qualification>('/qualification', query as Record<string, string | number | boolean | undefined>),

  get: (id: string) => apiClient.get<{ qualification: Qualification }>(`/qualification/${id}`).then((r) => r.qualification),

  listByLead: (leadId: string) =>
    apiClient.get<{ qualifications: Qualification[] }>(`/qualification/lead/${leadId}`).then((r) => r.qualifications),

  /** GET /lead/:leadId/latest -- backend returns { qualification: null } if none exist yet. */
  getLatestForLead: (leadId: string) =>
    apiClient.get<{ qualification: Qualification | null }>(`/qualification/lead/${leadId}/latest`).then((r) => r.qualification),

  /**
   * POST /run -- creates a qualification record for REVIEW. Does NOT touch
   * the lead. applied: false until a separate apply() call.
   */
  run: (input: RunQualificationInput) =>
    apiClient.post<{ qualification: Qualification }>('/qualification/run', input).then((r) => r.qualification),

  /**
   * POST /:id/apply -- updates the lead's score/temperature/status. Returns
   * BOTH the updated qualification (applied: true) and the updated lead.
   */
  apply: (id: string) =>
    apiClient.post<{ qualification: Qualification; lead: Lead }>(`/qualification/${id}/apply`),

  /** PATCH /:id/override -- human manually adjusts the AI score. */
  override: (id: string, overrideScore: number) =>
    apiClient.patch<{ qualification: Qualification }>(`/qualification/${id}/override`, { override_score: overrideScore })
      .then((r) => r.qualification),
};