
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useInvitations } from '@/context/company/useInvitations';
import { formatDistanceToNow } from 'date-fns';

interface CompanyInvitationsProps {
  invitations: any[];
  onInvitationAccepted?: () => void;
  onInvitationDeclined?: () => void;
}

const CompanyInvitations: React.FC<CompanyInvitationsProps> = ({
  invitations,
  onInvitationAccepted,
  onInvitationDeclined
}) => {
  const { user, isAuthenticated } = useAuth();
  const { acceptInvitation, declineInvitation, isProcessing } = useInvitations();

  console.log('CompanyInvitations render:', { 
    invitationsCount: invitations.length, 
    userId: user?.id,
    isAuthenticated,
    invitations: invitations.map(inv => ({ 
      id: inv.id, 
      email: inv.email, 
      company_id: inv.company_id,
      companyId: inv.companyId,
      role: inv.role 
    }))
  });

  // Don't show if no invitations or user not authenticated
  if (!isAuthenticated || !user || invitations.length === 0) {
    console.log('Not showing invitations:', { isAuthenticated, hasUser: !!user, invitationsCount: invitations.length });
    return null;
  }

  const handleAccept = async (invitationId: string) => {
    console.log('Handling invitation acceptance:', { invitationId, userId: user.id });
    
    if (!isAuthenticated || !user) {
      console.error('User not authenticated when trying to accept invitation');
      return;
    }

    try {
      const result = await acceptInvitation(invitationId, user.id, invitations);
      if (result && onInvitationAccepted) {
        console.log('Invitation accepted successfully, calling callback');
        onInvitationAccepted();
      }
    } catch (error) {
      console.error('Error in handleAccept:', error);
    }
  };

  const handleDecline = async (invitationId: string) => {
    console.log('Handling invitation decline:', invitationId);
    
    try {
      const result = await declineInvitation(invitationId);
      if (result && onInvitationDeclined) {
        console.log('Invitation declined successfully, calling callback');
        onInvitationDeclined();
      }
    } catch (error) {
      console.error('Error in handleDecline:', error);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Company Invitations
          <Badge variant="secondary">{invitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    Join {invitation.companyName || 'Company'}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Badge variant="outline" className="mr-2 capitalize">
                      {invitation.role}
                    </Badge>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Invited {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(invitation.id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyInvitations;
