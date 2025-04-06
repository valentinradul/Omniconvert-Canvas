
import React, { useState } from 'react';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { TeamMembersTable } from './TeamMembersTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { TeamMemberFormData, TeamMemberRole, TeamMember } from '@/types';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { toast } from 'sonner';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, error, addTeamMember, updateTeamMember, deleteTeamMember, refreshMembers } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string; data: TeamMemberFormData } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditClick = (member: TeamMember) => {
    // Convert TeamMember to TeamMemberFormData
    const formData: TeamMemberFormData = {
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department || '',
      title: member.title || '',
      departmentVisibility: member.departmentVisibility || 'Own Department',
      visibleDepartments: member.visibleDepartments || [],
      photoUrl: member.photoUrl || undefined
    };
    
    setEditingMember({ id: member.id, data: formData });
  };

  const handleRetryLoad = () => {
    refreshMembers();
  };

  const handleAddMember = async (values: TeamMemberFormData): Promise<void> => {
    try {
      console.log("Adding team member with values:", values);
      setIsSubmitting(true);
      
      const result = await addTeamMember(values);
      
      if (result) {
        toast.success(`Team member ${values.name} added successfully!`);
        setIsAddDialogOpen(false);
      } else {
        toast.error("Failed to add team member");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error(`Error adding team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMember = async (values: Partial<TeamMemberFormData>): Promise<void> => {
    try {
      if (editingMember) {
        setIsSubmitting(true);
        
        const result = await updateTeamMember(editingMember.id, values);
        
        if (result) {
          toast.success(`Team member updated successfully!`);
          setEditingMember(null);
        } else {
          toast.error("Failed to update team member");
        }
      }
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error(`Error updating team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string): Promise<void> => {
    try {
      const result = await deleteTeamMember(id);
      
      if (!result) {
        toast.error("Failed to delete team member");
      }
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast.error(`Error deleting team member: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <p className="text-red-500 mb-2">Failed to load team members: {error.message}</p>
            <Button variant="outline" onClick={handleRetryLoad}>Retry</Button>
          </div>
        ) : (
          <TeamMembersTable 
            members={members}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteMember}
          />
        )}

        <AddTeamMemberDialog 
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleAddMember}
          isSubmitting={isSubmitting}
        />

        {editingMember && (
          <EditTeamMemberDialog
            isOpen={!!editingMember}
            onOpenChange={(open) => !open && setEditingMember(null)}
            member={editingMember.data}
            onSubmit={handleUpdateMember}
            isSubmitting={isSubmitting}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembersSection;
