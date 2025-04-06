
import { TeamMemberFormData, TeamMember, TeamMemberRole, DepartmentVisibility } from '@/types';

// Define better types for our results to avoid recursive type issues
export type TeamMemberData = {
  id: string;
  team_id: string;
  user_id: string | null;
  role: string;
  department: string | null;
  email?: string | null;
  custom_message?: string | null;
};

export type TeamMemberError = {
  error: string;
};

// Database query result interfaces
export interface MemberQueryResult {
  id: string;
  team_id: string;
  user_id: string | null;
  role: string;
  department: string | null;
}

export interface MemberInsertResult {
  id: string;
  team_id: string;
  user_id: string | null;
  role: string;
  department: string | null;
}
