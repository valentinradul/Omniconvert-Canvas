
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
    userEmail: user?.email,
    isAuthenticated,
    allInvitations: invitations
  });

  // Don't show if user not authenticated
  if (!isAuthenticated || !user) {
    console.log('User not authenticated, not showing invitations');
    return null;
  }

  // Filter invitations for current user's email - be more lenient with filtering
  const userInvitations = invitations.filter(inv => {
    if (!user?.email || !inv.email) return false;
    const userEmailLower = user.email.toLowerCase().trim();
    const invEmailLower = inv.email.toLowerCase().trim();
    return userEmailLower === invEmailLower;
  });

  console.log('Filtered user invitations:', { 
    userEmail: user?.email,
    filteredCount: userInvitations.length,
    userInvitations 
  });

  // Don't show if no invitations for this user
  if (userInvitations.length === 0) {
    console.log('No invitations for user, not showing component');
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
        
        // Force refresh company data after acceptance
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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

  // Safe date formatting function
  const formatInvitationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Recently';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Recently';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Company Invitations
          <Badge variant="secondary">{userInvitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userInvitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    Join {invitation.companyName || invitation.company_name || 'Company'}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Badge variant="outline" className="mr-2 capitalize">
                      {invitation.role}
                    </Badge>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Invited {formatInvitationDate(invitation.created_at || invitation.createdAt)}
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
