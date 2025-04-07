
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberFormData, TeamMember, TeamMemberRole, DepartmentVisibility } from '@/types';
import { toast } from 'sonner';

// This is a minimal stub service that doesn't actually do anything
// It's kept for compatibility with existing imports

export const fetchUserTeam = async (userId: string) => {
  console.log("fetchUserTeam is a stub - userId:", userId);
  return { id: "default-team" };
};

export const fetchTeamMembersForTeam = async (teamId: string) => {
  console.log("fetchTeamMembersForTeam is a stub - teamId:", teamId);
  return [];
};

export const mapToTeamMembers = (data: any[]): TeamMember[] => {
  console.log("mapToTeamMembers is a stub");
  return [];
};

export const addTeamMemberToTeam = async (teamId: string, data: TeamMemberFormData) => {
  console.log("addTeamMemberToTeam is a stub - teamId:", teamId, "data:", data);
  return { id: "new-member-id" };
};

export const sendTeamInvitationEmail = async (email: string, name: string, customMessage?: string) => {
  console.log(`[STUB] Sending invitation email to: ${email} for ${name}`);
  console.log(`[STUB] Custom message: ${customMessage || 'No custom message'}`);
  return true;
};

export const updateExistingTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
  console.log("updateExistingTeamMember is a stub - id:", id, "data:", data);
  return null;
};

export const deleteTeamMemberById = async (id: string) => {
  console.log("deleteTeamMemberById is a stub - id:", id);
  return true;
};
