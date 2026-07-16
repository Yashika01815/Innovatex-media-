import { useCallback, useEffect, useState } from 'react';
import { pipelineApi } from '@/lib/dealsApi.ts';
import { ApiError } from '@/lib/apiClient';
import type { Deal, DealBoard, DealInput, DealStage, PipelineStats } from '@/types/deal';

export interface UsePipelineBoardResult {
  board: DealBoard | null;
  stats: PipelineStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createDeal: (input: DealInput) => Promise<Deal>;
  updateDeal: (id: string, patch: DealInput) => Promise<Deal>;
  moveStage: (id: string, stage: DealStage) => Promise<Deal>;
  archiveDeal: (id: string) => Promise<void>;
}

/**
 * usePipelineBoard -- fetches the pre-grouped board + stats together,
 * refetching whenever `ownerFilter` changes. Mutations call the API then
 * trigger a refetch, same simplest-correct pattern as useLeads.
 */
export function usePipelineBoard(ownerFilter?: string): UsePipelineBoardResult {
  const [board, setBoard] = useState<DealBoard | null>(null);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      pipelineApi.getBoard(ownerFilter ? { assigned_user_id: ownerFilter } : undefined),
      pipelineApi.getStats(),
    ])
      .then(([boardResult, statsResult]) => {
        if (cancelled) return;
        setBoard(boardResult);
        setStats(statsResult);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load pipeline');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerFilter, reloadToken]);

  const createDeal = useCallback(async (input: DealInput) => {
    const deal = await pipelineApi.create(input);
    refetch();
    return deal;
  }, [refetch]);

  const updateDeal = useCallback(async (id: string, patch: DealInput) => {
    const deal = await pipelineApi.update(id, patch);
    refetch();
    return deal;
  }, [refetch]);

  const moveStage = useCallback(async (id: string, stage: DealStage) => {
    const deal = await pipelineApi.moveStage(id, stage);
    refetch();
    return deal;
  }, [refetch]);

  const archiveDeal = useCallback(async (id: string) => {
    await pipelineApi.archive(id);
    refetch();
  }, [refetch]);

  return { board, stats, loading, error, refetch, createDeal, updateDeal, moveStage, archiveDeal };
}
