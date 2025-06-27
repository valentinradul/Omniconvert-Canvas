
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, RefreshCw, X } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PendingInvitationsProps {
  onInvitationResent?: () => void;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ onInvitationResent }) => {
  const { currentCompany, pendingInvitations, refreshPendingInvitations, unsendInvitation, userCompanyRole } = useCompany();
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
  
  // Don't show the component if there are no pending invitations
  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>People who have been invited but haven't accepted yet</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingInvitations.map(invitation => (
            <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-md">
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
  );
};

export default PendingInvitations;
