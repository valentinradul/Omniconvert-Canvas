
import React, { useState } from 'react';
import AddTeamMemberDialog from './AddTeamMemberDialog';
import EditTeamMemberDialog from './EditTeamMemberDialog';
import TeamMembersTable from './TeamMembersTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { TeamMemberFormData } from '@/types';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, error, addTeamMember, updateTeamMember, deleteTeamMember, refreshMembers } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string; data: TeamMemberFormData } | null>(null);

  const handleEditClick = (id: string, data: TeamMemberFormData) => {
    // Make sure role is properly capitalized to match the expected enum values
    const formattedData = {
      ...data,
      role: data.role.charAt(0).toUpperCase() + data.role.slice(1).toLowerCase()
    };
    setEditingMember({ id, data: formattedData });
  };

  const handleRetryLoad = () => {
    refreshMembers();
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
          onAdd={addTeamMember}
        />

        {editingMember && (
          <EditTeamMemberDialog
            isOpen={!!editingMember}
            onOpenChange={(open) => !open && setEditingMember(null)}
            member={editingMember.data}
            onSave={(data) => {
              if (editingMember) {
                updateTeamMember(editingMember.id, data);
                setEditingMember(null);
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembersSection;
