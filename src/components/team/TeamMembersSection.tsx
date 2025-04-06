
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { TeamMembersTable } from './TeamMembersTable';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { TeamMember, TeamMemberFormData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const TeamMembersSection: React.FC = () => {
  const { members, isLoading, addTeamMember, updateTeamMember, deleteTeamMember, refreshMembers } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    
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
      toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeamMember = async (values: Partial<TeamMemberFormData>) => {
    if (selectedMember) {
      setIsSubmitting(true);
      
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
        toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
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
      toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };
  
  const handleRetry = () => {
    refreshMembers();
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
          isSubmitting={isSubmitting}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4 border rounded-md">
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
              <p>No team members found.</p>
              <p className="text-sm text-muted-foreground">
                Start by adding team members using the "Add Team Member" button above.
              </p>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <TeamMembersTable 
              members={members} 
              isLoading={isLoading} 
              onEdit={openEditDialog}
              onDelete={handleDeleteTeamMember}
            />
          )}
        </div>
      </CardContent>
      
      {selectedMember && (
        <EditTeamMemberDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditTeamMember}
          member={selectedMember}
          isSubmitting={isSubmitting}
        />
      )}
    </Card>
  );
};

export default TeamMembersSection;
