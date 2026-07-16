import { apiClientRaw } from '@/lib/apiClient';
import type { Deal, DealInput, DealListQuery, DealBoard, PipelineStats, DealStage } from '@/types/deal.ts';

/**
 * SOURCE: src/modules/pipeline/pipeline.routes.js + deals/deal.routes.js
 * All endpoints return their payload RAW (no { success, data } wrapper) --
 * same convention as Leads. Mounted at /api/pipeline (board, stats) and
 * /api/pipeline/deals (CRUD + stage move).
 */
export const pipelineApi = {
  /** GET /api/pipeline -- pre-grouped Kanban board, all 9 stage keys always present. */
  getBoard: (query?: { assigned_user_id?: string; source?: string }) =>
    apiClientRaw.get<DealBoard>('/pipeline', query),

  /** GET /api/pipeline/stats */
  getStats: () => apiClientRaw.get<PipelineStats>('/pipeline/stats'),

  list: (query?: DealListQuery) =>
    apiClientRaw.get<{ data: Deal[]; pagination: unknown }>('/pipeline/deals', query as Record<string, string | number | boolean | undefined>),

  get: (id: string) => apiClientRaw.get<Deal>(`/pipeline/deals/${id}`),

  create: (input: DealInput) => apiClientRaw.post<Deal>('/pipeline/deals', input),

  update: (id: string, patch: DealInput) => apiClientRaw.patch<Deal>(`/pipeline/deals/${id}`, patch),

  archive: (id: string) => apiClientRaw.delete<{ message: string; deal: Deal }>(`/pipeline/deals/${id}`),

  moveStage: (id: string, stage: DealStage) => apiClientRaw.patch<Deal>(`/pipeline/deals/${id}/stage`, { stage }),
};
