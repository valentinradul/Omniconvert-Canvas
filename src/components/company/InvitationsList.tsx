
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCompanyInvitations } from '@/hooks/useCompanyInvitations';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export const InvitationsList: React.FC = () => {
  const { 
    userInvitations, 
    isLoading, 
    acceptInvitation, 
    rejectInvitation,
    refreshUserInvitations
  } = useCompanyInvitations();

  useEffect(() => {
    refreshUserInvitations();
  }, []);

  const handleAccept = async (invitationId: string) => {
    try {
      const success = await acceptInvitation(invitationId);
      if (success) {
        toast.success('Invitation accepted successfully!');
        refreshUserInvitations();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      const success = await rejectInvitation(invitationId);
      if (success) {
        toast.success('Invitation rejected');
        refreshUserInvitations();
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Failed to reject invitation');
    }
  };

  if (userInvitations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Invitations</h3>
          <p className="text-sm text-gray-500">You have {userInvitations.length} pending invitations</p>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {userInvitations.map(invitation => (
            <div key={invitation.id} className="p-4 border-b last:border-0">
              <div className="mb-2">
                <p className="font-medium">You've been invited to join a company</p>
                <p className="text-sm text-gray-500">Role: {invitation.role}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleReject(invitation.id)}
                >
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleAccept(invitation.id)}
                >
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
