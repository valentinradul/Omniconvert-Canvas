
import { useState } from 'react';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { deleteTeamMemberById } from '@/services/teamService';

export function useTeamMemberDelete(
  members: TeamMember[],
  onMembersChange: (updatedMembers: TeamMember[]) => void
) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTeamMember = async (id: string) => {
    try {
      setIsDeleting(true);
      const success = await deleteTeamMemberById(id);
      
      if (!success) {
        return false;
      }

      // Filter out the deleted member
      const updatedMembers = members.filter(member => member.id !== id);
      
      // Update the parent component's state
      onMembersChange(updatedMembers);
      
      toast.success('Team member deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteTeamMember,
    isDeleting
  };
}
