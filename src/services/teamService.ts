
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberFormData, TeamMember, TeamMemberRole, DepartmentVisibility } from '@/types';
import { toast } from 'sonner';

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

/**
 * Fetches the team ID for the current user
 */
export const fetchUserTeam = async (userId: string) => {
  console.log("Fetching team for user ID:", userId);
  
  try {
    // First try to get a team where the user is the creator
    let { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('created_by', userId)
      .maybeSingle();
      
    if (teamError) {
      console.error('Error fetching team:', teamError);
      return null;
    }
    
    // If no team is found where the user is the creator, try to find a team where the user is a member
    if (!teamData) {
      const { data: memberTeamData, error: memberTeamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (memberTeamError) {
        console.error('Error fetching team membership:', memberTeamError);
        return null;
      }
      
      if (memberTeamData && memberTeamData.team_id) {
        // Get the team details
        const { data: foundTeam, error: foundTeamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', memberTeamData.team_id)
          .single();
          
        if (foundTeamError) {
          console.error('Error fetching team details:', foundTeamError);
          return null;
        }
        
        teamData = foundTeam;
      }
    }
    
    console.log("Team data found:", teamData);
    return teamData;
  } catch (error) {
    console.error('Error in fetchUserTeam:', error);
    return null;
  }
};

/**
 * Adds a new team member
 */
export const addTeamMemberToTeam = async (
  teamId: string, 
  data: TeamMemberFormData
): Promise<TeamMemberData | TeamMemberError> => {
  console.log("Adding team member with data:", data, "to team:", teamId);
  
  try {
    if (!teamId) {
      return { error: 'Team ID is required' };
    }

    // First, check if this email is already a team member
    // Check if team_members table has an email column
    let hasEmailColumn = false;
    
    try {
      // Instead of using RPC, let's check if we can query with the email field
      // This is a simple way to check if the column exists
      const { error } = await supabase
        .from('team_members')
        .select('email')
        .limit(1);
      
      // If no error, email column exists
      hasEmailColumn = !error;
    } catch {
      // If this fails, email column doesn't exist
      hasEmailColumn = false;
    }
    
    // If email column exists, check for existing member
    if (hasEmailColumn && data.email) {
      // Define the return type explicitly to avoid TypeScript's excessive type inference
      interface MemberQueryResult {
        id: string;
        team_id: string;
        user_id: string | null;
        role: string;
        department: string | null;
      }
      
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, role, department')
        .eq('team_id', teamId)
        .eq('email', data.email)
        .maybeSingle() as { 
          data: MemberQueryResult | null; 
          error: any 
        };
        
      if (checkError) {
        console.error('Error checking existing team member:', checkError);
        return { error: checkError.message };
      }
      
      if (existingMember) {
        console.log(`Email ${data.email} is already a team member`);
        return {
          id: existingMember.id,
          team_id: existingMember.team_id,
          user_id: existingMember.user_id,
          role: existingMember.role,
          department: existingMember.department
        };
      }
    }
    
    // Create the required fields for the team member
    const requiredFields = {
      team_id: teamId,
      user_id: null, // We're inviting a user that may not exist in the system yet
      role: data.role || 'Team Member',
      department: data.department || null // Ensure department is not undefined
    };
    
    // Add email and custom_message if the column exists
    const insertData = hasEmailColumn ? 
      { 
        ...requiredFields,
        email: data.email || null,
        custom_message: data.customMessage || null 
      } : requiredFields;
    
    // Create a new team member
    // Define the return type explicitly to avoid TypeScript's excessive type inference
    interface MemberInsertResult {
      id: string;
      team_id: string;
      user_id: string | null;
      role: string;
      department: string | null;
    }
    
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert(insertData)
      .select('id, team_id, user_id, role, department') as {
        data: MemberInsertResult[] | null;
        error: any;
      };
      
    if (memberError) {
      console.error('Error adding team member:', memberError);
      return { error: memberError.message };
    }

    if (!newMember || newMember.length === 0) {
      return { error: 'No data returned after adding team member' };
    }

    console.log("Member added successfully:", newMember);
    
    // Send invitation email if the email is provided
    if (data.email) {
      try {
        await sendTeamInvitationEmail(data.email, data.name || data.email.split('@')[0], data.customMessage || undefined);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't throw here, we still created the team member successfully
        toast.warning("Team member created, but failed to send invitation email");
      }
    }

    // Create a TeamMemberData object with the returned data
    const memberData: TeamMemberData = {
      id: newMember[0].id,
      team_id: newMember[0].team_id,
      user_id: newMember[0].user_id,
      role: newMember[0].role,
      department: newMember[0].department,
      // Add email and custom_message only if they exist in the DB
      ...(hasEmailColumn ? { 
        email: data.email || null,
        custom_message: data.customMessage || null 
      } : {})
    };

    return memberData;
  } catch (error) {
    console.error('Exception when adding team member:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error adding team member' };
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
    email: member.email || `user-${member.id}@example.com`,  // Use actual email if available
    role: (member.role as TeamMemberRole) || 'Team Member',
    department: member.department || '',
    title: member.title || '', // Default empty string since title isn't in the database yet
    departmentVisibility: (member.departmentVisibility || 'Own Department') as DepartmentVisibility, // Explicitly cast
    visibleDepartments: member.visibleDepartments || [], // Default empty array
    photoUrl: member.photoUrl || '' // Default empty string
  }));
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
    
    // Check if email column exists before trying to update it
    let hasEmailColumn = false;
    try {
      const { error } = await supabase
        .from('team_members')
        .select('email')
        .limit(1);
      
      hasEmailColumn = !error;
    } catch {
      hasEmailColumn = false;
    }
    
    if (hasEmailColumn && data.email) {
      updateData.email = data.email;
    }
    
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
