import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/context/company/CompanyContext';
import { useApp } from '@/context/AppContext';
import { CompanyRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import DepartmentPermissionSelector from './DepartmentPermissionSelector';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ open, onClose, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyRole>('member');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [allDepartmentsSelected, setAllDepartmentsSelected] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteMember, currentCompany } = useCompany();
  const { departments } = useApp();
  const { toast } = useToast();

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments(prev => [...prev, departmentId]);
    } else {
      setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
    }
  };

  const handleAllDepartmentsChange = (checked: boolean) => {
    setAllDepartmentsSelected(checked);
    if (checked) {
      setSelectedDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role || !currentCompany) return;

    // Validate department selection for members
    if (role === 'member' && !allDepartmentsSelected && selectedDepartments.length === 0) {
      toast({
        variant: "destructive",
        title: "Department selection required",
        description: "Please select at least one department or grant access to all departments.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Sending invitation with department permissions:', {
        email,
        role,
        allDepartments: allDepartmentsSelected,
        selectedDepartments: role === 'member' ? selectedDepartments : []
      });

      // For owners/admins, they get access to all departments by default
      const departmentPermissions = (role === 'owner' || role === 'admin') 
        ? [] 
        : allDepartmentsSelected 
          ? [] 
          : selectedDepartments;

      await inviteMember(email, role, departmentPermissions);
      
      toast({
        title: "Invitation sent successfully!",
        description: `${email} has been invited to join your team${
          role === 'member' && !allDepartmentsSelected 
            ? ` with access to ${selectedDepartments.length} department(s)`
            : ''
        }.`,
      });
      
      // Reset form
      setEmail('');
      setRole('member');
      setSelectedDepartments([]);
      setAllDepartmentsSelected(true);
      
      if (onInviteSent) {
        onInviteSent();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        variant: "destructive",
        title: "Invitation failed",
        description: error.message || "There was a problem sending the invitation. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setRole('member');
      setSelectedDepartments([]);
      setAllDepartmentsSelected(true);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a team member to join your company and set their department access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={role} 
                onValueChange={(value: CompanyRole) => setRole(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'member' && departments.length > 0 && (
              <DepartmentPermissionSelector
                departments={departments}
                selectedDepartments={selectedDepartments}
                onDepartmentChange={handleDepartmentChange}
                allDepartmentsSelected={allDepartmentsSelected}
                onAllDepartmentsChange={handleAllDepartmentsChange}
              />
            )}

            {role !== 'member' && (
              <p className="text-sm text-muted-foreground">
                {role === 'admin' ? 'Admins' : 'Owners'} have access to all departments by default.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !email.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
