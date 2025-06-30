
import React from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, UserPlus, X, Edit } from 'lucide-react';

interface PendingInvitationsProps {
  onInvitationResent?: () => void;
  onEditMember?: (member: CompanyMember) => void;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ 
  onInvitationResent,
  onEditMember 
}) => {
  const { 
    pendingInvitations, 
    companyMembers, 
    userCompanyRole,
    unsendInvitation 
  } = useCompany();
  const { toast } = useToast();

  console.log('PendingInvitations - Pending invitations:', pendingInvitations.length);
  console.log('PendingInvitations - Company members:', companyMembers.length);
  console.log('PendingInvitations - User role:', userCompanyRole);

  const handleUnsendInvitation = async (invitationId: string, email: string) => {
    console.log('Unsending invitation:', invitationId);
    
    try {
      await unsendInvitation(invitationId);
      toast({
        title: "Invitation cancelled",
        description: `Invitation to ${email} has been cancelled`,
      });
      if (onInvitationResent) {
        onInvitationResent();
      }
    } catch (error: any) {
      console.error('Error unsending invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to cancel invitation",
        description: error.message || "There was an error cancelling the invitation",
      });
    }
  };

  const handleEditMember = (member: CompanyMember) => {
    console.log('Edit member clicked:', member.id);
    if (onEditMember) {
      onEditMember(member);
    }
  };

  // Check if user can edit members (only admins and owners)
  const canEditMembers = userCompanyRole === 'admin' || userCompanyRole === 'owner';

  return (
    <div className="space-y-6">
      {/* Pending Invitations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations ({pendingInvitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No pending invitations
            </p>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited as <Badge variant="secondary" className="ml-1 capitalize">
                          {invitation.role}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUnsendInvitation(invitation.id, invitation.email)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Current Members ({companyMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companyMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No members found
            </p>
          ) : (
            <div className="space-y-3">
              {companyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.profile?.fullName ? member.profile.fullName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.profile?.fullName || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditMembers && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingInvitations;
