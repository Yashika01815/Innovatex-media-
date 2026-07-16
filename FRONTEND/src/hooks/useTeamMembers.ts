import { useEffect, useState } from 'react';
import { teamApi, type TeamMemberSummary } from '@/lib/teamApi';

interface UseTeamMembersResult {
  members: TeamMemberSummary[];
  loading: boolean;
  error: string | null;
  /** id -> "First Last" for quick display lookups (falls back to 'Unassigned'). */
  nameById: (id: string | null | undefined) => string;
}

export function useTeamMembers(): UseTeamMembersResult {
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    teamApi
      .list()
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load team members');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const nameById = (id: string | null | undefined): string => {
    if (!id) return 'Unassigned';
    const m = members.find((u) => u.id === id);
    return m ? m.fullName : 'Unassigned';
  };

  return { members, loading, error, nameById };
}
