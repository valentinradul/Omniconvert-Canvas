
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamMembers } from './useTeamMembers';
import { TeamMembersTable } from './TeamMembersTable';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { TeamMember, TeamMemberFormData } from '@/types';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, addTeamMember, updateTeamMember, deleteTeamMember } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleAddTeamMember = async (values: TeamMemberFormData) => {
    console.log("Submitting team member data:", values);
    const result = await addTeamMember(values);
    if (result) {
      setIsAddDialogOpen(false);
    }
  };

  const handleEditTeamMember = async (values: Partial<TeamMemberFormData>) => {
    if (selectedMember) {
      const result = await updateTeamMember(selectedMember.id, values);
      if (result) {
        setIsEditDialogOpen(false);
        setSelectedMember(null);
      }
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    await deleteTeamMember(id);
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
