
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/context/CompanyContext';
import { CompanyRole } from '@/types';
import { toast } from '@/hooks/use-toast';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteMember, currentCompany } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role || !currentCompany) return;

    setIsSubmitting(true);
    try {
      await inviteMember(email, role);
      setEmail('');
      setRole('member');
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${email}.`,
      });
      onClose();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: "There was an error sending the invitation. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a team member to join your company.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="col-span-4">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="col-span-4"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="col-span-4">
                Role
              </Label>
              <Select 
                value={role} 
                onValueChange={(value: CompanyRole) => setRole(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !email.trim()}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
