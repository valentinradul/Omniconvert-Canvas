
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompany } from '@/context/company/CompanyContext';
import { useApp } from '@/context/AppContext';
import { CompanyRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ open, onClose, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyRole>('member');
  const [departmentPermissions, setDepartmentPermissions] = useState<{ all: boolean; departmentIds: string[] }>({
    all: true,
    departmentIds: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteMember, currentCompany } = useCompany();
  const { departments } = useApp();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role || !currentCompany) return;

    setIsSubmitting(true);
    try {
      console.log('Sending invitation with department permissions:', departmentPermissions);
      await inviteMember(email, role, departmentPermissions);
      
      console.log('Invitation sent successfully');
      toast({
        title: "Invitation sent successfully!",
        description: `${email} has been invited to join your team.`,
      });
      
      setEmail('');
      setRole('member');
      setDepartmentPermissions({ all: true, departmentIds: [] });
      
      if (onInviteSent) {
        console.log('Triggering invitation refresh callback');
        onInviteSent();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        variant: "destructive",
        title: "Invitation failed",
        description: error.message || "There was a problem sending the invitation. Please check if the email is valid and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setRole('member');
      setDepartmentPermissions({ all: true, departmentIds: [] });
      onClose();
    }
  };

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    setDepartmentPermissions(prev => ({
      ...prev,
      departmentIds: checked 
        ? [...prev.departmentIds, departmentId]
        : prev.departmentIds.filter(id => id !== departmentId)
    }));
  };

  const handleAllDepartmentsToggle = (checked: boolean) => {
    setDepartmentPermissions({
      all: checked,
      departmentIds: checked ? [] : departments.map(d => d.id)
    });
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
              Invite a team member to join your company and specify which departments they can access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email Address
              </Label>
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
              <Label htmlFor="role">
                Role
              </Label>
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
            
            {role === 'member' && (
              <div className="grid gap-2">
                <Label>Department Access</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-departments"
                      checked={departmentPermissions.all}
                      onCheckedChange={handleAllDepartmentsToggle}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="all-departments" className="font-medium">
                      All Departments
                    </Label>
                  </div>
                  
                  {!departmentPermissions.all && (
                    <div className="ml-6 space-y-2 max-h-32 overflow-y-auto">
                      {departments.map((department) => (
                        <div key={department.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${department.id}`}
                            checked={departmentPermissions.departmentIds.includes(department.id)}
                            onCheckedChange={(checked) => handleDepartmentToggle(department.id, checked as boolean)}
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={`dept-${department.id}`} className="text-sm">
                            {department.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
