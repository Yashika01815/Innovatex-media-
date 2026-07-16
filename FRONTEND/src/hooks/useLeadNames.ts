import { useEffect, useRef, useState } from 'react';
import { leadsApi } from '@/lib/leadsApi';

interface LeadSummary {
  name: string;
  company: string;
}

/**
 * useLeadNames -- resolves lead_id -> { name, company } for deal cards.
 *
 * There is no batch "get leads by ids" endpoint on this backend, so this
 * fetches each UNIQUE lead individually via Promise.all. That's a
 * deliberate, bounded trade-off: a Kanban board realistically shows dozens
 * of deals, not thousands, so a handful of parallel requests is cheap.
 * A ref-backed cache means it only ever fetches a given lead id ONCE for
 * the lifetime of this hook instance, regardless of how often the board
 * (and therefore leadIds) changes.
 */
export function useLeadNames(leadIds: string[]): Record<string, LeadSummary> {
  const cache = useRef<Record<string, LeadSummary>>({});
  const [, forceRender] = useState(0);
  const uniqueKey = Array.from(new Set(leadIds)).sort().join(',');

  useEffect(() => {
    const uniqueIds = uniqueKey ? uniqueKey.split(',') : [];
    const missing = uniqueIds.filter((id) => !(id in cache.current));
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map((id) =>
        leadsApi.get(id)
          .then((lead) => [id, { name: lead.name, company: lead.company }] as const)
          .catch(() => [id, { name: 'Unknown lead', company: '' }] as const),
      ),
    ).then((entries) => {
      if (cancelled) return;
      for (const [id, summary] of entries) cache.current[id] = summary;
      forceRender((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [uniqueKey]);

  return cache.current;
}
