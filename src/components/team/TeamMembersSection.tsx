
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamMembers } from './useTeamMembers';
import { TeamMembersTable } from './TeamMembersTable';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import type { TeamMemberFormData } from './AddTeamMemberForm';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, addTeamMember } = useTeamMembers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddTeamMember = async (values: TeamMemberFormData) => {
    const result = await addTeamMember(values);
    if (result) {
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their roles.
          </CardDescription>
        </div>
        <AddTeamMemberDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onSubmit={handleAddTeamMember} 
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TeamMembersTable members={members} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMembersSection;
