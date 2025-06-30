
import React from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, UserPlus, X, Edit, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  console.log('PendingInvitations - Pending invitations:', pendingInvitations);
  console.log('PendingInvitations - Company members:', companyMembers);
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
      {/* Pending Invitations Section - Always show this card */}
      <Card className={`${pendingInvitations.length > 0 ? 'border-orange-200 bg-orange-50/30' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations 
            <Badge variant="secondary" className="ml-2">
              {pendingInvitations.length}
            </Badge>
          </CardTitle>
          {pendingInvitations.length > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              These invitations are waiting for acceptance
            </p>
          )}
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground">
                When you invite team members, they will appear here until accepted
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Invited as</span>
                        <Badge variant="outline" className="capitalize">
                          {invitation.role}
                        </Badge>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Pending
                    </Badge>
                    {canEditMembers && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnsendInvitation(invitation.id, invitation.email)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
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
            Current Members 
            <Badge variant="secondary" className="ml-2">
              {companyMembers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companyMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No members found</p>
            </div>
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
