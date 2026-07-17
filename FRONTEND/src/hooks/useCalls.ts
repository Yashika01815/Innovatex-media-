import { useCallback, useEffect, useState } from 'react';
import { callsApi } from '@/lib/callsApi';
import { ApiError, type PaginationMeta } from '@/lib/apiClient';
import type { Call, CallInput, CallKpis, CallListQuery, CallUpdateInput } from '@/types/call';

export interface UseCallsResult {
  calls: Call[];
  pagination: PaginationMeta | null;
  kpis: CallKpis | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createCall: (input: CallInput) => Promise<Call>;
  updateCall: (id: string, patch: CallUpdateInput) => Promise<Call>;
  regenerateAiSummary: (id: string) => Promise<Call>;
}

export function useCalls(query: CallListQuery): UseCallsResult {
  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [kpis, setKpis] = useState<CallKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([callsApi.list(query), callsApi.getKpis()])
      .then(([listResult, kpisResult]) => {
        if (cancelled) return;
        setCalls(listResult.data);
        setPagination(listResult.pagination);
        setKpis(kpisResult);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load calls');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query), reloadToken]);

  const createCall = useCallback(async (input: CallInput) => {
    const call = await callsApi.create(input);
    refetch();
    return call;
  }, [refetch]);

  const updateCall = useCallback(async (id: string, patch: CallUpdateInput) => {
    const call = await callsApi.update(id, patch);
    refetch();
    return call;
  }, [refetch]);

  const regenerateAiSummary = useCallback(async (id: string) => {
    const call = await callsApi.regenerateAiSummary(id);
    refetch();
    return call;
  }, [refetch]);

  return { calls, pagination, kpis, loading, error, refetch, createCall, updateCall, regenerateAiSummary };
}