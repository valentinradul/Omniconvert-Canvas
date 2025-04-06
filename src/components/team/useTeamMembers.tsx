
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember } from './TeamMembersTable';

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        
        // First, get the user's team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('created_by', user?.id)
          .single();
          
        if (teamError) {
          console.error('Error fetching team:', teamError);
          toast.error('Failed to load team members');
          setIsLoading(false);
          return;
        }
        
        if (!teamData) {
          console.log('No team found for this user');
          setIsLoading(false);
          return;
        }
        
        // Then, get team members for this team
        const { data, error: membersError } = await supabase
          .from('team_members')
          .select('id, role, name, email, status')
          .eq('team_id', teamData.id);
          
        if (membersError) {
          console.error('Error fetching team members:', membersError);
          toast.error('Failed to load team members');
          setIsLoading(false);
          return;
        }

        if (data) {
          // Convert the data to match our TeamMember structure
          const formattedMembers = data.map(member => ({
            id: member.id,
            name: member.name || 'Unknown',
            email: member.email || 'No email provided',
            role: member.role
          }));
          
          setMembers(formattedMembers);
        }
      } catch (error) {
        console.error('Unexpected error fetching team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const addTeamMember = async ({ name, email, role }: { name: string; email: string; role: string }) => {
    try {
      // First, get the user's team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user?.id)
        .single();
        
      if (teamError) {
        console.error('Error fetching team:', teamError);
        toast.error('Failed to add team member');
        return;
      }
      
      if (!teamData) {
        toast.error('No team found');
        return;
      }
      
      // Create a new team member
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: null, // Placeholder as we're inviting a user who might not exist yet
          role: role,
          email: email,
          name: name,
          status: 'invited'
        })
        .select()
        .single();
        
      if (memberError) {
        console.error('Error adding team member:', memberError);
        toast.error('Failed to add team member');
        return;
      }

      if (newMember) {
        const newTeamMember: TeamMember = {
          id: newMember.id,
          name: name,
          email: email,
          role: role
        };
        
        setMembers([...members, newTeamMember]);
        toast.success('Team member invited successfully!');
      }
      
      return newMember;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
      return null;
    }
  };

  return { members, isLoading, addTeamMember };
}
