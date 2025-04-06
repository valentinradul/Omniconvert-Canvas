
import { useState } from 'react';
import { TeamMember, TeamMemberFormData } from '@/types';
import { useTeamMembersFetch } from './useTeamMembersFetch';
import { useTeamMemberAdd } from './useTeamMemberAdd';
import { useTeamMemberUpdate } from './useTeamMemberUpdate';
import { useTeamMemberDelete } from './useTeamMemberDelete';

export function useTeamMembers() {
  const { members: fetchedMembers, isLoading, error, refreshMembers } = useTeamMembersFetch();
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Update local members when fetched members change
  if (fetchedMembers !== members && fetchedMembers.length > 0) {
    setMembers(fetchedMembers);
  }

  // Hook for adding team members
  const { addTeamMember, isSubmitting: isAddingMember } = useTeamMemberAdd((newMember) => {
    setMembers(prev => [...prev, newMember]);
  });

  // Hook for updating team members
  const { updateTeamMember, isSubmitting: isUpdatingMember } = useTeamMemberUpdate(
    members, 
    (updatedMembers) => setMembers(updatedMembers)
  );

  // Hook for deleting team members
  const { deleteTeamMember, isDeleting } = useTeamMemberDelete(
    members,
    (updatedMembers) => setMembers(updatedMembers)
  );

  return {
    members,
    isLoading,
    error,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refreshMembers,
    isSubmitting: isAddingMember || isUpdatingMember || isDeleting
  };
}
