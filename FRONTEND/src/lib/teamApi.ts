import { apiClient } from '@/lib/apiClient';

/**
 * SOURCE: src/modules/team/team.controller.js getTeamMembers
 * Uses the standard envelope (unlike Leads) -- request(), not requestRaw().
 * Only the fields Leads actually needs are typed here; the Team page itself
 * will get its own fuller type when that module is migrated.
 */
export interface TeamMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface TeamMembersResult {
  members: TeamMemberSummary[];
  kpis: unknown;
}

export const teamApi = {
  list: () => apiClient.get<TeamMembersResult>('/team').then((r) => r.members),
};
