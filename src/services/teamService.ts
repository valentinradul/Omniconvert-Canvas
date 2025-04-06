
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberFormData, TeamMember, TeamMemberRole, DepartmentVisibility } from '@/types';
import { toast } from 'sonner';

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

export const mapToTeamMembers = (data: any[]): TeamMember[] => {
  if (!data || !Array.isArray(data)) {
    console.warn("Invalid data in mapToTeamMembers:", data);
    return [];
  }
  
  return data.map(member => {
    // Ensure role is one of the valid TeamMemberRole values
    let role: TeamMemberRole = 'member';
    if (member.role === 'owner' || member.role === 'manager' || member.role === 'member') {
      role = member.role as TeamMemberRole;
    } else if (member.role === 'Team Member') {
      role = 'member';
    }
    
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: role,
      department: member.department,
      title: member.title,
      departmentVisibility: member.departmentVisibility,
      visibleDepartments: member.visibleDepartments,
      photoUrl: member.photoUrl
    };
  });
};

export const addTeamMemberToTeam = async (teamId: string, data: TeamMemberFormData) => {
  console.log("Adding team member with data:", data);
  
  try {
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: null,
        role: data.role,
        department: data.department || null,
        email: data.email || null,
        custom_message: data.customMessage || null
      })
      .select();
      
    if (memberError) {
      console.error('Error adding team member:', memberError);
      throw new Error(memberError.message);
    }

    if (!newMember || newMember.length === 0) {
      throw new Error('No data returned after adding team member');
    }

    if (data.email) {
      try {
        await sendTeamInvitationEmail(data.email, data.name, data.customMessage || undefined);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        toast.warning("Team member created, but failed to send invitation email");
      }
    }

    console.log("Member added successfully:", newMember);
    return newMember[0];
  } catch (error) {
    console.error('Exception when adding team member:', error);
    throw error;
  }
};

export const sendTeamInvitationEmail = async (email: string, name: string, customMessage?: string) => {
  console.log(`[MOCK] Sending invitation email to: ${email} for ${name}`);
  console.log(`[MOCK] Custom message: ${customMessage || 'No custom message'}`);
  
  return true;
};

export const updateExistingTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
  try {
    const updateData: any = {};
    
    if (data.role) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.email) updateData.email = data.email;
    
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
