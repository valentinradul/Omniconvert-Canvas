
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamMembers } from './useTeamMembers';
import { TeamMembersTable } from './TeamMembersTable';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { TeamMember, TeamMemberFormData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, addTeamMember, updateTeamMember, deleteTeamMember } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Check authentication status when component mounts
    if (!user) {
      console.log("User not authenticated");
    } else {
      console.log("Authenticated as:", user.email);
    }
  }, [user]);

  const handleAddTeamMember = async (values: TeamMemberFormData) => {
    console.log("Submitting team member data:", values);
    try {
      const result = await addTeamMember(values);
      if (result) {
        setIsAddDialogOpen(false);
        toast.success("Team member added successfully!");
      } else {
        toast.error("Failed to add team member. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleAddTeamMember:", error);
      toast.error("An unexpected error occurred while adding team member");
    }
  };

  const handleEditTeamMember = async (values: Partial<TeamMemberFormData>) => {
    if (selectedMember) {
      try {
        const result = await updateTeamMember(selectedMember.id, values);
        if (result) {
          setIsEditDialogOpen(false);
          setSelectedMember(null);
          toast.success("Team member updated successfully!");
        } else {
          toast.error("Failed to update team member. Please try again.");
        }
      } catch (error) {
        console.error("Error in handleEditTeamMember:", error);
        toast.error("An unexpected error occurred while updating team member");
      }
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    try {
      const result = await deleteTeamMember(id);
      if (result) {
        toast.success("Team member deleted successfully!");
      } else {
        toast.error("Failed to delete team member. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleDeleteTeamMember:", error);
      toast.error("An unexpected error occurred while deleting team member");
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members, their roles, and departments.
          </CardDescription>
        </div>
        <AddTeamMemberDialog 
          isOpen={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
          onSubmit={handleAddTeamMember} 
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TeamMembersTable 
            members={members} 
            isLoading={isLoading} 
            onEdit={openEditDialog}
            onDelete={handleDeleteTeamMember}
          />
        </div>
      </CardContent>
      
      {selectedMember && (
        <EditTeamMemberDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditTeamMember}
          member={selectedMember}
        />
      )}
    </Card>
  );
};

export default TeamMembersSection;
