
import React from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TeamMemberFormData } from '@/types';
import { TeamMemberForm } from './TeamMemberForm';

interface EditTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<TeamMemberFormData>) => Promise<void>;
  member: TeamMemberFormData;
  isSubmitting?: boolean;
}

export const EditTeamMemberDialog: React.FC<EditTeamMemberDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  member,
  isSubmitting = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <h2 className="text-lg font-semibold">Edit Team Member</h2>
          <p className="text-sm text-gray-500">
            Update team member information and permissions.
          </p>
        </DialogHeader>
        
        <TeamMemberForm 
          onSubmit={onSubmit}
          defaultValues={member}
          isSubmitting={isSubmitting}
          submitLabel="Update Member"
          cancelButton={
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
};
