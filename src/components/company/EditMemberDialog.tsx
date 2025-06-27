import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CompanyMember, CompanyRole } from '@/types';
import { useCompany } from '@/context/company/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface EditMemberDialogProps {
  member: CompanyMember | null;
  open: boolean;
  onClose: () => void;
  onMemberUpdated: () => void;
}

const EditMemberDialog: React.FC<EditMemberDialogProps> = ({ 
  member, 
  open, 
  onClose, 
  onMemberUpdated 
}) => {
  const { updateMemberRole, removeMember, userCompanyRole } = useCompany();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<CompanyRole>(member?.role || 'member');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update selected role when member changes
  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  const handleUpdateRole = async () => {
    if (!member || selectedRole === member.role) {
      onClose();
      return;
    }

    setIsUpdating(true);
    try {
      await updateMemberRole(member.userId, selectedRole);
      toast({
        title: "Member role updated",
        description: `Role updated to ${selectedRole} successfully`,
      });
      onMemberUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message || "There was an error updating the member role",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!member) return;

    setIsDeleting(true);
    try {
      await removeMember(member.userId);
      toast({
        title: "Member removed",
        description: "Member removed from the company successfully",
      });
      onMemberUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.message || "There was an error removing the member",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!member) return null;

  const getUserDisplayName = () => {
    if (member.profile?.fullName) {
      return member.profile.fullName;
    }
    return 'User';
  };

  const canEditRole = userCompanyRole === 'owner';
  const canDeleteMember = (userCompanyRole === 'owner' || userCompanyRole === 'admin') && member.role !== 'owner';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Member Details</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Name:</strong> {getUserDisplayName()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Current Role:</strong> <span className="capitalize">{member.role}</span>
            </p>
          </div>

          {canEditRole && (
            <div>
              <h4 className="font-medium mb-2">Change Role</h4>
              <Select value={selectedRole} onValueChange={(value: CompanyRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!canEditRole && !canDeleteMember && (
            <p className="text-sm text-muted-foreground">
              You don't have permission to edit this member.
            </p>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {canDeleteMember && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {getUserDisplayName()} from the company? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteMember}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Removing..." : "Remove Member"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {canEditRole && (
              <Button 
                onClick={handleUpdateRole} 
                disabled={isUpdating || selectedRole === member.role}
              >
                {isUpdating ? "Updating..." : "Update Role"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
