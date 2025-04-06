
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember } from './TeamMembersTable';

export type TeamMemberFormData = {
  name: string;
  email: string;
  role: string;
  department?: string;
};

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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
      
      console.log('User ID for team fetch:', user.id);
      
      // First, get the user's team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user.id)
        .single();
        
      if (teamError) {
        console.error('Error fetching team:', teamError);
        toast.error('Failed to load team members');
        setIsLoading(false);
        return;
      }
      
      if (!teamData) {
        console.log('No team found for this user');
        setMembers([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Found team with ID:', teamData.id);
      
      // Fetch team members with department info
      const { data, error: membersError } = await supabase
        .from('team_members')
        .select('id, role, user_id, team_id, department')
        .eq('team_id', teamData.id);
        
      if (membersError) {
        console.error('Error fetching team members:', membersError);
        toast.error('Failed to load team members');
        setIsLoading(false);
        return;
      }

      console.log('Team members data:', data);

      if (data && data.length > 0) {
        // Convert the data to match our TeamMember structure
        const formattedMembers = data.map((member: any) => ({
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
      const { name, email, role, department } = data;
      console.log('Adding team member with data:', data);
      
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
      
      console.log('Adding member to team:', teamData.id);
      
      // Create a new team member with the columns that exist in the table
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: null, // Placeholder as we're inviting a user
          role: role,
          department: department
        })
        .select()
        .single();
        
      if (memberError) {
        console.error('Error adding team member:', memberError);
        toast.error('Failed to add team member');
        return null;
      }

      if (newMember) {
        console.log('New member added successfully:', newMember);
        const newTeamMember: TeamMember = {
          id: newMember.id,
          name: name, // Using provided name even though it's not in the DB
          email: email, // Using provided email even though it's not in the DB
          role: newMember.role || 'member',
          department: newMember.department || ''
        };
        
        setMembers(prevMembers => [...prevMembers, newTeamMember]);
        return newMember;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
      return null;
    }
  };

  const updateTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
    try {
      console.log(`Updating team member ${id} with data:`, data);
      
      const { data: updatedMember, error } = await supabase
        .from('team_members')
        .update({
          role: data.role,
          department: data.department
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating team member:', error);
        toast.error('Failed to update team member');
        return null;
      }

      console.log('Member updated successfully:', updatedMember);

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

      return updatedMember;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      console.log(`Deleting team member ${id}`);
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting team member:', error);
        toast.error('Failed to delete team member');
        return false;
      }

      console.log('Member deleted successfully');
      
      // Update the members state by filtering out the deleted member
      setMembers(prevMembers => prevMembers.filter(member => member.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
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
