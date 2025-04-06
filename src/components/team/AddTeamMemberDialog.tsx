
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CompanyInviteForm } from './CompanyInviteForm';
import { toast } from 'sonner';

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  triggerButton?: React.ReactNode;
}

export const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSuccess,
  isSubmitting = false,
  triggerButton
}) => {
  const handleSuccess = () => {
    toast.success("Team member invitation sent successfully!");
    
    // Force dialog to close on successful submission
    onOpenChange(false);
    
    // Call the parent's onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your team.
          </DialogDescription>
        </DialogHeader>
        <CompanyInviteForm 
          onSuccess={handleSuccess} 
          onCancel={() => onOpenChange(false)} 
          isSubmitting={isSubmitting} 
        />
      </DialogContent>
    </Dialog>
  );
};
