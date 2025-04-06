
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberFormData } from '@/types';
import { toast } from 'sonner';

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
