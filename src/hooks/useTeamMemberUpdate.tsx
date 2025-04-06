
import { useState } from 'react';
import { toast } from 'sonner';
import { TeamMemberFormData, TeamMember } from '@/types';
import { updateExistingTeamMember } from '@/services/teamMemberUpdateService';

export function useTeamMemberUpdate(
  members: TeamMember[],
  onMembersChange: (updatedMembers: TeamMember[]) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
    try {
      setIsSubmitting(true);
      const updatedMember = await updateExistingTeamMember(id, data);
      
      if (!updatedMember) {
        return null;
      }

      // Update the members with the updated member
      const updatedMembers = members.map(member => {
        if (member.id === id) {
          return {
            ...member,
            role: data.role || member.role,
            department: data.department || member.department,
            title: data.title || member.title,
            departmentVisibility: data.departmentVisibility || member.departmentVisibility,
            visibleDepartments: data.visibleDepartments || member.visibleDepartments,
            photoUrl: data.photoUrl || member.photoUrl,
            name: data.name || member.name,
            email: data.email || member.email
          };
        }
        return member;
      });

      // Update the parent component's state
      onMembersChange(updatedMembers);

      toast.success('Team member updated successfully!');
      return updatedMember;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    updateTeamMember,
    isSubmitting
  };
}
