
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberFormData, TeamMember, TeamMemberRole, DepartmentVisibility } from '@/types';
import { toast } from 'sonner';

/**
 * Fetches the team ID for the current user
 */
export const fetchUserTeam = async (userId: string) => {
  console.log("Fetching team for user ID:", userId);
  
  try {
    // Get the user's company from company_members
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();
      
    if (companyError) {
      console.error('Error fetching company:', companyError);
      
      // Fallback to team
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
    }
    
    // Map company to team format for backward compatibility
    return { id: companyMember.company_id };
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
    // Cast response to any to break the inference chain
    const response = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    
    const { data, error } = response;
      
    if (error) {
      console.error('Error fetching team members:', error);
      throw error;
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
  
  return data.map((member: any) => {
    // Ensure role is one of the valid TeamMemberRole values
    let role: TeamMemberRole = 'member';
    if (member.role === 'owner' || member.role === 'manager' || member.role === 'member') {
      role = member.role as TeamMemberRole;
    } else if (member.role === 'Team Member') {
      role = 'member';
    }

    return {
      id: member.id,
      name: member.user_id || 'Invited User',
      email: member.email || `user-${member.id}@example.com`,
      role: role,
      department: member.department || '',
      title: member.title || '',
      departmentVisibility: (member.departmentVisibility || 'Own Department') as DepartmentVisibility,
      visibleDepartments: member.visibleDepartments || [],
      photoUrl: member.photoUrl || ''
    };
  });
};

/**
 * Adds a new team member
 */
export const addTeamMemberToTeam = async (teamId: string, data: TeamMemberFormData) => {
  console.log("Adding team member with data:", data);
  
  try {
    // Simplify query structure and explicitly handle responses
    const result = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: null, // We're inviting a user that may not exist in the system yet
        role: data.role,
        department: data.department || null, // Ensure department is not undefined
        email: data.email || null, // Store the email for invitation
        custom_message: data.customMessage || null // Store the custom invitation message
      })
      .select();
      
    if (result.error) {
      console.error('Error adding team member:', result.error);
      throw new Error(result.error.message);
    }

    const newMember = result.data;
    
    if (!newMember || newMember.length === 0) {
      throw new Error('No data returned after adding team member');
    }

    // Send invitation email if the email is provided
    if (data.email) {
      try {
        await sendTeamInvitationEmail(data.email, data.name, data.customMessage || undefined);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't throw here, we still created the team member successfully
        toast.warning("Team member created, but failed to send invitation email");
      }
    }

    console.log("Member added successfully:", newMember[0]);
    return newMember[0];
  } catch (error) {
    console.error('Exception when adding team member:', error);
    throw error;
  }
};

/**
 * Sends an invitation email to a team member
 */
export const sendTeamInvitationEmail = async (email: string, name: string, customMessage?: string) => {
  // This would typically call a backend API to send an email
  // For now, we'll just simulate success
  console.log(`[MOCK] Sending invitation email to: ${email} for ${name}`);
  console.log(`[MOCK] Custom message: ${customMessage || 'No custom message'}`);
  
  // In a real implementation, you would call a backend API or use a service like SendGrid
  return true;
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
    if (data.email) updateData.email = data.email;
    
    console.log("Updating team member with ID:", id, "with data:", updateData);
    
    // Use type assertion to avoid deep type inference
    const response = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select();
    
    const { data: updatedMember, error } = response;
    
    if (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    }

    // Safely access array element
    const member = Array.isArray(updatedMember) && updatedMember.length > 0 
      ? updatedMember[0] 
      : updatedMember;

    console.log("Member updated successfully:", member);
    return member;
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
    
    // Break the type inference chain by using a simpler approach
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
