
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onInviteSent?: () => void;  // New callback for when invitation is sent
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ open, onClose, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteMember, currentCompany } = useCompany();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role || !currentCompany) return;

    setIsSubmitting(true);
    try {
      console.log('Sending invitation to:', email, 'with role:', role);
      await inviteMember(email, role);
      
      console.log('Invitation sent successfully');
      toast({
        title: "Invitation sent successfully!",
        description: `${email} has been invited to join your team.`,
      });
      
      setEmail('');
      setRole('member');
      
      // Call the onInviteSent callback if provided to refresh the pending invitations
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
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
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
