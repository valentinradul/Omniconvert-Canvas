
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, TeamMemberFormData, TeamMemberRole, DepartmentVisibility } from '@/types';

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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
      
      // Using any() to bypass TypeScript errors since the types don't include all fields yet
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

      if (data) {
        // Convert the data to match our TeamMember structure
        const formattedMembers: TeamMember[] = data.map((member: any) => ({
          id: member.id,
          name: member.user_id || 'Invited User',  // Using user_id as placeholder
          email: `user-${member.id}@example.com`,  // Using a placeholder email
          role: (member.role as TeamMemberRole) || 'Team Member',
          department: member.department,
          title: '', // Default empty string since title isn't in the database yet
          departmentVisibility: 'Own Department' as DepartmentVisibility, // Explicitly cast to DepartmentVisibility
          visibleDepartments: [], // Default empty array
          photoUrl: '' // Default empty string
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

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const addTeamMember = async (data: TeamMemberFormData) => {
    try {
      const { name, email, role, department, title, departmentVisibility, visibleDepartments, photoUrl } = data;
      
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
      // Using any() to bypass TypeScript errors since the types don't include all fields yet
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: null, // Placeholder as we're inviting a user
          role: role,
          department: department
          // Note: title, department_visibility, visible_departments, and photo_url 
          // are not added to the insert since they're not in the database schema yet
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
          role: newMember.role as TeamMemberRole,
          department: newMember.department,
          title: title || '', // Use the title from the form data
          departmentVisibility: (departmentVisibility || 'Own Department') as DepartmentVisibility, // Explicit cast
          visibleDepartments: visibleDepartments || [],
          photoUrl: photoUrl || ''
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

  const updateTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
    try {
      // Only update fields that exist in the database
      const updateData: any = {
        role: data.role,
        department: data.department
        // Other fields are not included as they don't exist in the database yet
      };
      
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

      // Update the members state with the updated member
      setMembers(members.map(member => {
        if (member.id === id) {
          return {
            ...member,
            role: data.role || member.role,
            department: data.department || member.department,
            title: data.title || member.title,
            departmentVisibility: (data.departmentVisibility || member.departmentVisibility) as DepartmentVisibility, // Explicit cast
            visibleDepartments: data.visibleDepartments || member.visibleDepartments,
            photoUrl: data.photoUrl || member.photoUrl,
            name: data.name || member.name,
            email: data.email || member.email
          };
        }
        return member;
      }));

      toast.success('Team member updated successfully!');
      return updatedMember;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return null;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting team member:', error);
        toast.error('Failed to delete team member');
        return false;
      }

      // Update the members state by filtering out the deleted member
      setMembers(members.filter(member => member.id !== id));
      toast.success('Team member deleted successfully!');
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
