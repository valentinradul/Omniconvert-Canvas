
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { TeamMember } from '@/types';
import { 
  fetchUserTeam,
  fetchTeamMembersForTeam,
  mapToTeamMembers
} from '@/services/teamService';

export function useTeamMembersFetch() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user || !user.id) {
        console.error('No authenticated user found');
        toast.error('You must be logged in to view team members');
        setIsLoading(false);
        return;
      }
      
      console.log("Fetching team members for user ID:", user.id);
      
      // First, get the user's team
      const teamData = await fetchUserTeam(user.id);
      if (!teamData) {
        console.log('No team found for this user');
        setError(new Error('No team found for this user'));
        setIsLoading(false);
        return;
      }
      
      console.log("Found team ID:", teamData.id);
      
      // Then fetch the team members
      const data = await fetchTeamMembersForTeam(teamData.id);
      if (!data) {
        setError(new Error('Failed to fetch team members'));
        setIsLoading(false);
        return;
      }

      console.log("Team members data:", data);

      // Convert the data to match our TeamMember structure
      const formattedMembers = mapToTeamMembers(data);
      setMembers(formattedMembers);
    } catch (error) {
      console.error('Unexpected error fetching team members:', error);
      setError(error instanceof Error ? error : new Error('An unexpected error occurred'));
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return {
    members,
    isLoading,
    error,
    refreshMembers: fetchTeamMembers
  };
}
