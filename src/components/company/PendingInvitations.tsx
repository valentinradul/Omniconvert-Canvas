
import React from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, UserPlus, X, Edit, Clock, AlertCircle, Users } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Pending Invitations Section */}
      <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <span>Pending Invitations</span>
                <Badge variant="secondary" className="ml-3 bg-orange-100 text-orange-800 border-orange-200">
                  {pendingInvitations.length}
                </Badge>
              </div>
            </CardTitle>
            {pendingInvitations.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                <AlertCircle className="h-4 w-4" />
                <span>Awaiting response</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {pendingInvitations.length > 0 
              ? "These team members have been invited but haven't accepted yet"
              : "No pending invitations at the moment"
            }
          </p>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                When you invite team members, they will appear here until they accept the invitation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-white border border-orange-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{invitation.email}</span>
                        <Badge variant="outline" className="capitalize text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {invitation.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    {canEditMembers && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnsendInvitation(invitation.id, invitation.email)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span>Team Members</span>
              <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800 border-blue-200">
                {companyMembers.length}
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Active team members who have access to this organization
          </p>
        </CardHeader>
        <CardContent>
          {companyMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
              <p className="text-sm text-muted-foreground">
                Start by inviting your first team member
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {companyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-700">
                        {member.profile?.fullName ? member.profile.fullName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {member.profile?.fullName || 'Unknown User'}
                        </span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                    {canEditMembers && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="hover:bg-blue-50"
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
