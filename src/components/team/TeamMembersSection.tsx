
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamMembers } from './useTeamMembers';
import { TeamMembersTable, TeamMember } from './TeamMembersTable';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { toast } from 'sonner';
import type { TeamMemberFormData } from './useTeamMembers';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, addTeamMember, updateTeamMember, deleteTeamMember } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleAddTeamMember = async (values: TeamMemberFormData) => {
    try {
      const result = await addTeamMember(values);
      if (result) {
        setIsAddDialogOpen(false);
        toast.success(`Team member ${values.name} invited successfully!`);
      } else {
        toast.error('Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleEditTeamMember = async (values: Partial<TeamMemberFormData>) => {
    if (selectedMember) {
      try {
        const result = await updateTeamMember(selectedMember.id, values);
        if (result) {
          setIsEditDialogOpen(false);
          setSelectedMember(null);
          toast.success('Team member updated successfully!');
        } else {
          toast.error('Failed to update team member');
        }
      } catch (error) {
        console.error('Error updating team member:', error);
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    try {
      const result = await deleteTeamMember(id);
      if (result) {
        toast.success('Team member deleted successfully!');
      } else {
        toast.error('Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('An unexpected error occurred');
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
