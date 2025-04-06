import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import { TeamMemberFormData } from '@/types';
import { toast } from 'sonner';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamMemberFormData) => Promise<void>;
  isSubmitting?: boolean;
  triggerButton?: React.ReactNode;
}

export const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit,
  isSubmitting = false,
  triggerButton
}) => {
  const handleSubmit = async (values: TeamMemberFormData) => {
    try {
      console.log("AddTeamMemberDialog: Starting submission with values:", values);
      await onSubmit(values);
      console.log("AddTeamMemberDialog: Submission successful");
      
      // Force dialog to close on successful submission
      onOpenChange(false);
    } catch (error) {
      console.error("Error in AddTeamMemberDialog handleSubmit:", error);
      toast.error("Failed to add team member. Please try again.");
      // Keep dialog open on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || <Button>Add Team Member</Button>}
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
