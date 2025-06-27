
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, RefreshCw, X, User, Check } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PendingInvitationsProps {
  onInvitationResent?: () => void;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ onInvitationResent }) => {
  const { currentCompany, pendingInvitations, companyMembers, refreshPendingInvitations, unsendInvitation, userCompanyRole } = useCompany();
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await refreshPendingInvitations();
      toast({
        title: "Refreshed",
        description: "Pending invitations have been refreshed"
      });
    } catch (error: any) {
      console.error('Error refreshing invitations:', error);
      toast({
        variant: "destructive",
        title: "Failed to refresh",
        description: error.message || "An unexpected error occurred"
      });
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      console.log('Resending invitation:', invitationId);
      
      // Get the invitation details
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');
      
      console.log('Found invitation:', invitation);
      
      // Call edge function to resend email
      console.log('Calling send-invitation edge function for resend');
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: invitation.email,
          companyName: currentCompany?.name || 'Company',
          inviterName: null,
          role: invitation.role,
          invitationId: invitationId
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to resend invitation: ${error.message}`);
      }
      
      toast({
        title: "Invitation resent",
        description: `Invitation email resent to ${invitation.email}`
      });
      
      if (onInvitationResent) {
        onInvitationResent();
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to resend invitation",
        description: error.message || "An unexpected error occurred"
      });
    }
  };

  const handleUnsendInvitation = async (invitationId: string) => {
    try {
      await unsendInvitation(invitationId);
      toast({
        title: "Invitation unsent",
        description: "The invitation has been successfully removed"
      });
    } catch (error: any) {
      console.error('Error unsending invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to unsend invitation",
        description: error.message || "An unexpected error occurred"
      });
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = (member: any) => {
    if (member.profile?.fullName) {
      return member.profile.fullName;
    }
    return 'User';
  };

  // Helper function to get initials for avatar
  const getUserInitials = (member: any) => {
    if (member.profile?.fullName) {
      const names = member.profile.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return member.profile.fullName.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  
  // Don't show the component if there are no pending invitations and no members
  if (pendingInvitations.length === 0 && companyMembers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Current Members Section */}
      {companyMembers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Current Team Members
              </CardTitle>
              <CardDescription>People who have accepted their invitations and are part of the team</CardDescription>
            </div>
            <Badge variant="secondary">{companyMembers.length} member{companyMembers.length !== 1 ? 's' : ''}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companyMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-md bg-green-50/50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile?.avatarUrl || ''} alt="Avatar" />
                      <AvatarFallback>
                        {getUserInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{getUserDisplayName(member)}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Badge variant="outline" className="mr-2 capitalize">{member.role}</Badge>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Joined {formatDistanceToNow(member.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="default" className="bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                Pending Invitations
              </CardTitle>
              <CardDescription>People who have been invited but haven't accepted yet</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pendingInvitations.length} pending</Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map(invitation => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-md bg-orange-50/50">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Badge variant="outline" className="mr-2 capitalize">{invitation.role}</Badge>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Invited {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation.id)}>
                      Resend
                    </Button>
                    {(userCompanyRole === 'owner' || userCompanyRole === 'admin') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUnsendInvitation(invitation.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Unsend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PendingInvitations;
