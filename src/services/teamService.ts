
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberFormData, TeamMember, TeamMemberRole, DepartmentVisibility } from '@/types';
import { toast } from 'sonner';

/**
 * Fetches the team ID for the current user
 */
export const fetchUserTeam = async (userId: string) => {
  console.log("Fetching team for user ID:", userId);
  
  try {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('created_by', userId)
      .single();
      
    if (teamError) {
      console.error('Error fetching team:', teamError);
      return null;
    }
    
    return teamData;
  } catch (error) {
    console.error('Error in fetchUserTeam:', error);
    return null;
  }
};

/**
 * Fetches team members for a specific team
 */
export const fetchTeamMembersForTeam = async (teamId: string) => {
  console.log("Fetching team members for team ID:", teamId);
  
  try {
    const { data, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
      
    if (membersError) {
      console.error('Error fetching team members:', membersError);
      throw membersError;
    }
    
    console.log("Fetched team members:", data);
    return data;
  } catch (error) {
    console.error('Error in fetchTeamMembersForTeam:', error);
    throw error;
  }
};

/**
 * Maps raw database team members to the TeamMember type
 */
export const mapToTeamMembers = (data: any[]): TeamMember[] => {
  if (!data || !Array.isArray(data)) {
    console.warn("Invalid data in mapToTeamMembers:", data);
    return [];
  }
  
  return data.map((member: any) => ({
    id: member.id,
    name: member.user_id || 'Invited User',  // Using user_id as placeholder
    email: `user-${member.id}@example.com`,  // Using a placeholder email
    role: (member.role as TeamMemberRole) || 'Team Member',
    department: member.department || '',
    title: member.title || '', // Default empty string since title isn't in the database yet
    departmentVisibility: (member.departmentVisibility || 'Own Department') as DepartmentVisibility, // Explicitly cast
    visibleDepartments: member.visibleDepartments || [], // Default empty array
    photoUrl: member.photoUrl || '' // Default empty string
  }));
};

/**
 * Adds a new team member
 */
export const addTeamMemberToTeam = async (teamId: string, data: TeamMemberFormData) => {
  console.log("Adding team member with data:", data);
  
  try {
    // Create a new team member with the columns that exist in the table
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: null, // We're inviting a user that may not exist in the system yet
        role: data.role || 'Team Member',
        department: data.department || null // Ensure department is not undefined
      })
      .select();
      
    if (memberError) {
      console.error('Error adding team member:', memberError);
      throw new Error(memberError.message);
    }

    if (!newMember || newMember.length === 0) {
      throw new Error('No data returned after adding team member');
    }

    console.log("Member added successfully:", newMember);
    return newMember[0];
  } catch (error) {
    console.error('Exception when adding team member:', error);
    throw error;
  }
};

/**
 * Updates an existing team member
 */
export const updateExistingTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
  try {
    // Only update fields that exist in the database
    const updateData: any = {};
    
    if (data.role) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    
    console.log("Updating team member with ID:", id, "with data:", updateData);
    
    const { data: updatedMember, error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    }

    console.log("Member updated successfully:", updatedMember);
    return updatedMember;
  } catch (error) {
    console.error('Exception when updating team member:', error);
    throw error;
  }
};

/**
 * Deletes a team member
 */
export const deleteTeamMemberById = async (id: string) => {
  try {
    console.log("Deleting team member with ID:", id);
    
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
      return false;
    }

    console.log("Member deleted successfully");
    return true;
  } catch (error) {
    console.error('Exception when deleting team member:', error);
    throw error;
  }
};
