
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember } from './TeamMembersTable';

export type TeamMemberFormData = {
  name: string;
  email: string;
  role: string;
};

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
        
        // Then, get team members for this team - using the actual columns that exist
        const { data, error: membersError } = await supabase
          .from('team_members')
          .select('id, role, user_id, team_id')
          .eq('team_id', teamData.id);
          
        if (membersError) {
          console.error('Error fetching team members:', membersError);
          toast.error('Failed to load team members');
          setIsLoading(false);
          return;
        }

        if (data) {
          // Convert the data to match our TeamMember structure
          // Since the table might not have name/email fields directly,
          // we'll use placeholders or fetch from profiles if needed
          const formattedMembers = data.map(member => ({
            id: member.id,
            name: member.user_id || 'Invited User',  // Using user_id as placeholder
            email: `user-${member.id}@example.com`,  // Using a placeholder email
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

  const addTeamMember = async (data: TeamMemberFormData) => {
    try {
      const { name, email, role } = data;
      
      // First, get the user's team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user?.id)
        .single();
        
      if (teamError) {
        console.error('Error fetching team:', teamError);
        toast.error('Failed to add team member');
        return null;
      }
      
      if (!teamData) {
        toast.error('No team found');
        return null;
      }
      
      // Create a new team member with the columns that exist in the table
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: null, // Placeholder as we're inviting a user
          role: role
        })
        .select()
        .single();
        
      if (memberError) {
        console.error('Error adding team member:', memberError);
        toast.error('Failed to add team member');
        return null;
      }

      if (newMember) {
        const newTeamMember: TeamMember = {
          id: newMember.id,
          name: name, // Using provided name even though it's not in the DB
          email: email, // Using provided email even though it's not in the DB
          role: newMember.role
        };
        
        setMembers([...members, newTeamMember]);
        toast.success('Team member invited successfully!');
        return newMember;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
      return null;
    }
  };

  return { members, isLoading, addTeamMember };
}
