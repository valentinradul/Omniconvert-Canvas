
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { TeamMember, TeamMemberFormData, DepartmentVisibility, TeamMemberRole } from '@/types';
import { 
  fetchUserTeam,
  fetchTeamMembersForTeam,
  mapToTeamMembers,
  addTeamMemberToTeam,
  updateExistingTeamMember,
  deleteTeamMemberById
} from '@/services/teamService';

export function useTeamMembers() {
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

  const addTeamMember = async (data: TeamMemberFormData) => {
    try {
      if (!user || !user.id) {
        console.error('No authenticated user found');
        toast.error('You must be logged in to add team members');
        return null;
      }
      
      // First, get the user's team
      const teamData = await fetchUserTeam(user.id);
      if (!teamData) {
        console.error('No team found for current user');
        toast.error('No team found');
        return null;
      }
      
      console.log("Adding team member to team:", teamData.id, "with data:", data);
      
      // Create a new team member
      const addedMember = await addTeamMemberToTeam(teamData.id, data);
      if (!addedMember) {
        toast.error('Failed to add team member');
        return null;
      }

      console.log("Added member:", addedMember);

      // Add the new member to the state
      const newTeamMember: TeamMember = {
        id: addedMember.id,
        name: data.name, // Using provided name even though it's not in the DB
        email: data.email, // Using provided email even though it's not in the DB
        role: addedMember.role as TeamMemberRole,
        department: addedMember.department,
        title: data.title || '', // Use the title from the form data
        departmentVisibility: (data.departmentVisibility || 'Own Department') as DepartmentVisibility, // Explicit cast
        visibleDepartments: data.visibleDepartments || [],
        photoUrl: data.photoUrl || ''
      };
      
      setMembers(prevMembers => [...prevMembers, newTeamMember]);
      toast.success('Team member added successfully!');
      return addedMember;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error(`Failed to add team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const updateTeamMember = async (id: string, data: Partial<TeamMemberFormData>) => {
    try {
      const updatedMember = await updateExistingTeamMember(id, data);
      if (!updatedMember) {
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
      const success = await deleteTeamMemberById(id);
      if (!success) {
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
    error,
    addTeamMember, 
    updateTeamMember,
    deleteTeamMember,
    refreshMembers: fetchTeamMembers
  };
}
