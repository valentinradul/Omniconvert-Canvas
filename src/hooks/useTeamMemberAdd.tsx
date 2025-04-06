
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { TeamMember, TeamMemberFormData, DepartmentVisibility, TeamMemberRole } from '@/types';
import { fetchUserTeam, addTeamMemberToTeam } from '@/services/teamService';

// Helper type guard to check if the result is a TeamMemberError
function isTeamMemberError(result: any): result is { error: string } {
  return result && typeof result === 'object' && 'error' in result;
}

export function useTeamMemberAdd(onMemberAdded: (member: TeamMember) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const addTeamMember = async (data: TeamMemberFormData) => {
    try {
      setIsSubmitting(true);
      
      if (!user || !user.id) {
        console.error('No authenticated user found');
        toast.error('You must be logged in to add team members');
        return null;
      }
      
      // Validate required fields
      if (!data.name || !data.email || !data.role) {
        console.error('Missing required fields for team member');
        toast.error('Please fill in all required fields');
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
      const result = await addTeamMemberToTeam(teamData.id, data);
      
      // Check if the result is an error object
      if (isTeamMemberError(result)) {
        console.error("Error adding team member:", result.error);
        toast.error(`Failed to add team member: ${result.error}`);
        return null;
      }
      
      // If we got here, result should be a valid team member
      // Create a TeamMember object from the result
      const newTeamMember: TeamMember = {
        id: result.id,
        name: data.name,
        email: data.email, 
        role: result.role as TeamMemberRole,
        department: result.department || '',
        title: data.title || '',
        departmentVisibility: (data.departmentVisibility || 'Own Department') as DepartmentVisibility,
        visibleDepartments: data.visibleDepartments || [],
        photoUrl: data.photoUrl || ''
      };
      
      // Call the callback with the new member
      onMemberAdded(newTeamMember);
      
      toast.success('Team member added successfully!');
      return result;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error(`Failed to add team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addTeamMember,
    isSubmitting
  };
}
