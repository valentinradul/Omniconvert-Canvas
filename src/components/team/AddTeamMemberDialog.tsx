import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import { TeamMemberFormData } from '@/types';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamMemberFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit,
  isSubmitting = false
}) => {
  const handleSubmit = async (values: TeamMemberFormData) => {
    try {
      await onSubmit(values);
      // Dialog will be closed by the parent component on successful submission
    } catch (error) {
      console.error("Error in AddTeamMemberDialog handleSubmit:", error);
      // Keep dialog open on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Team Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your team.
          </DialogDescription>
        </DialogHeader>
        <AddTeamMemberForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};
