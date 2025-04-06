
import React, { useState } from 'react';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { TeamMembersTable } from './TeamMembersTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { TeamMemberFormData, TeamMemberRole, TeamMember } from '@/types';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, error, addTeamMember, updateTeamMember, deleteTeamMember, refreshMembers } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string; data: TeamMemberFormData } | null>(null);

  const handleEditClick = (member: TeamMember) => {
    // Convert TeamMember to TeamMemberFormData
    const formData: TeamMemberFormData = {
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      title: member.title || '',
      departmentVisibility: member.departmentVisibility,
      visibleDepartments: member.visibleDepartments,
      photoUrl: member.photoUrl
    };
    
    setEditingMember({ id: member.id, data: formData });
  };

  const handleRetryLoad = () => {
    refreshMembers();
  };

  const handleAddMember = async (values: TeamMemberFormData): Promise<void> => {
    await addTeamMember(values);
  };

  const handleUpdateMember = async (values: Partial<TeamMemberFormData>): Promise<void> => {
    if (editingMember) {
      await updateTeamMember(editingMember.id, values);
      setEditingMember(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Team Members</CardTitle>
          <CardDescription>Manage your team members and their permissions</CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-2">Failed to load team members</p>
            <Button variant="outline" onClick={handleRetryLoad}>Retry</Button>
          </div>
        ) : (
          <TeamMembersTable 
            members={members}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={deleteTeamMember}
          />
        )}

        <AddTeamMemberDialog 
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleAddMember}
          isSubmitting={false}
        />

        {editingMember && (
          <EditTeamMemberDialog
            isOpen={!!editingMember}
            onOpenChange={(open) => !open && setEditingMember(null)}
            member={editingMember.data}
            onSubmit={handleUpdateMember}
            isSubmitting={false}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembersSection;
