
import type { TeamMember } from './TeamMembersTable';

export type TeamMemberFormData = {
  name: string;
  email: string;
  role: string;
  department?: string;
};

export interface TeamMemberOperations {
  members: TeamMember[];
  isLoading: boolean;
  addTeamMember: (data: TeamMemberFormData) => Promise<any | null>;
  updateTeamMember: (id: string, data: Partial<TeamMemberFormData>) => Promise<any | null>;
  deleteTeamMember: (id: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
}
