
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TeamMemberFormData } from './types';
import type { TeamMember } from './TeamMembersTable';

/**
 * Fetches team members for a specific user's team
 */
export async function fetchTeamMembersData(userId: string | undefined) {
  try {
    if (!userId) {
      console.log('No user ID provided, cannot fetch team members');
      return null;
    }

    console.log('Fetching team with user ID:', userId);
    
    // First, get the user's team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('created_by', userId)
      .single();
      
    if (teamError) {
      console.error('Error fetching team:', teamError);
      return null;
    }
    
    if (!teamData) {
      console.log('No team found for this user');
      return [];
    }
    
    console.log('Found team with ID:', teamData.id);
    
    // Fetch team members with department info
    const { data, error: membersError } = await supabase
      .from('team_members')
      .select('id, role, user_id, team_id, department')
      .eq('team_id', teamData.id);
      
    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return null;
    }

    console.log('Team members data:', data);
    return { teamId: teamData.id, members: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching team members:', error);
    return null;
  }
}

/**
 * Adds a new team member
 */
export async function addNewTeamMember(teamId: string, data: TeamMemberFormData) {
  try {
    const { name, email, role, department } = data;
    console.log('Adding team member with data:', data);
    
    // Create a new team member with the columns that exist in the table
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: null, // Placeholder as we're inviting a user
        role: role,
        department: department
      })
      .select()
      .single();
      
    if (memberError) {
      console.error('Error adding team member:', memberError);
      toast.error('Failed to add team member');
      return null;
    }

    if (newMember) {
      console.log('New member added successfully:', newMember);
      const newTeamMember: TeamMember = {
        id: newMember.id,
        name: name, // Using provided name even though it's not in the DB
        email: email, // Using provided email even though it's not in the DB
        role: newMember.role || 'member',
        department: newMember.department || ''
      };
      
      return newTeamMember;
    }
    
    return null;
  } catch (error) {
    console.error('Error adding team member:', error);
    toast.error('Failed to add team member');
    return null;
  }
}

/**
 * Updates an existing team member
 */
export async function updateExistingTeamMember(id: string, data: Partial<TeamMemberFormData>) {
  try {
    console.log(`Updating team member ${id} with data:`, data);
    
    const { data: updatedMember, error } = await supabase
      .from('team_members')
      .update({
        role: data.role,
        department: data.department
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    }

    console.log('Member updated successfully:', updatedMember);
    return updatedMember;
  } catch (error) {
    console.error('Error updating team member:', error);
    toast.error('Failed to update team member');
    return null;
  }
}

/**
 * Deletes a team member
 */
export async function deleteExistingTeamMember(id: string) {
  try {
    console.log(`Deleting team member ${id}`);
    
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
      return false;
    }

    console.log('Member deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting team member:', error);
    toast.error('Failed to delete team member');
    return false;
  }
}
