import { useCallback, useEffect, useState } from 'react';
import { attributionApi } from '@/lib/attributionApi';
import { ApiError } from '@/lib/apiClient';
import type { AttributionDashboard, AttributionFilter } from '@/types/attribution';

export interface UseAttributionResult {
  dashboard: AttributionDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAttribution(filter: AttributionFilter = {}): UseAttributionResult {
  const [dashboard, setDashboard] = useState<AttributionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    attributionApi.getDashboard(filter)
      .then((data) => { if (!cancelled) setDashboard(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load attribution data');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter), reloadToken]);

  return { dashboard, loading, error, refetch };
}