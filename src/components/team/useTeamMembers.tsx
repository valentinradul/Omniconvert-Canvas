
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { TeamMember } from './TeamMembersTable';
import type { TeamMemberFormData, TeamMemberOperations } from './types';
import { 
  fetchTeamMembersData, 
  addNewTeamMember, 
  updateExistingTeamMember, 
  deleteExistingTeamMember 
} from './teamMembersService';

export type { TeamMemberFormData } from './types';

export function useTeamMembers(): TeamMemberOperations {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [teamId, setTeamId] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching team members...');
      
      if (!user) {
        console.log('No user found, skipping team members fetch');
        setMembers([]);
        setIsLoading(false);
        return;
      }
      
      const result = await fetchTeamMembersData(user.id);
      
      if (!result) {
        toast.error('Failed to load team members');
        setMembers([]);
        setTeamId(null);
        setIsLoading(false);
        return;
      }
      
      if (result.teamId) {
        setTeamId(result.teamId);
      }

      if (result.members && result.members.length > 0) {
        // Convert the data to match our TeamMember structure
        const formattedMembers = result.members.map((member: any) => ({
          id: member.id,
          name: member.user_id || 'Invited User',  // Using user_id as placeholder
          email: `user-${member.id}@example.com`,  // Using a placeholder email
          role: member.role || 'member',
          department: member.department || ''
        }));
        
        setMembers(formattedMembers);
        console.log('Formatted members:', formattedMembers);
      } else {
        // If no data returned but also no error, set empty array
        console.log('No team members found, setting empty array');
        setMembers([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching team members:', error);
      toast.error('Failed to load team members');
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user, fetchTeamMembers]);

  const addTeamMember = async (data: TeamMemberFormData) => {
    try {
      if (!teamId) {
        console.error('No team ID available');
        toast.error('Failed to add team member: No team available');
        return null;
      }
      
      const newMember = await addNewTeamMember(teamId, data);
      
      if (newMember) {
        setMembers(prevMembers => [...prevMembers, newMember]);
        return newMember;
      }
      
      return null;
    } catch (error) {
      console.error('Error in addTeamMember:', error);
      toast.error('Failed to add team member');
      return null;
    }
  };

  const updateTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
    try {
      const updatedMember = await updateExistingTeamMember(id, data);
      
      if (updatedMember) {
        // Update the members state with the updated member
        setMembers(prevMembers => prevMembers.map(member => {
          if (member.id === id) {
            return {
              ...member,
              role: data.role || member.role,
              department: data.department || member.department,
              name: data.name || member.name,
              email: data.email || member.email
            };
          }
          return member;
        }));
      }

      return updatedMember;
    } catch (error) {
      console.error('Error in updateTeamMember:', error);
      toast.error('Failed to update team member');
      return null;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const success = await deleteExistingTeamMember(id);
      
      if (success) {
        // Update the members state by filtering out the deleted member
        setMembers(prevMembers => prevMembers.filter(member => member.id !== id));
      }
      
      return success;
    } catch (error) {
      console.error('Error in deleteTeamMember:', error);
      toast.error('Failed to delete team member');
      return false;
    }
  };

  return { 
    members, 
    isLoading, 
    addTeamMember, 
    updateTeamMember,
    deleteTeamMember,
    refreshMembers: fetchTeamMembers
  };
}
