
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import { TeamMemberFormData } from './useTeamMembers';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamMemberFormData) => Promise<void>;
}

export const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit 
}) => {
  const handleSubmit = async (values: TeamMemberFormData) => {
    try {
      await onSubmit(values);
      // Dialog will be closed by parent component via onOpenChange
    } catch (error) {
      console.error("Error in AddTeamMemberDialog:", error);
      // Keep dialog open on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Team Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your team.
          </DialogDescription>
        </DialogHeader>
        <AddTeamMemberForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
};
