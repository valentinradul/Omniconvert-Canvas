
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useInvitations } from '@/context/company/useInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Clock, Users, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CompanyInvitations: React.FC = () => {
  const { user } = useAuth();
  const { userIncomingInvitations, refreshUserIncomingInvitations } = useCompany();
  const { acceptInvitation, declineInvitation, isProcessing } = useInvitations();
  const { toast } = useToast();
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());

  // Auto-refresh invitations when component mounts
  useEffect(() => {
    console.log('📧 CompanyInvitations: Component mounted, refreshing invitations');
    refreshUserIncomingInvitations();
  }, [refreshUserIncomingInvitations]);

  const handleAcceptInvitation = async (invitationId: string) => {
    console.log('🎯 CompanyInvitations: User clicked ACCEPT for invitation:', invitationId);
    
    if (processingInvitations.has(invitationId)) {
      console.log('⏳ Already processing this invitation, skipping...');
      return;
    }
    
    setProcessingInvitations(prev => new Set(prev).add(invitationId));
    
    try {
      console.log('🚀 CompanyInvitations: Starting MANUAL acceptance process for:', invitationId);
      
      const result = await acceptInvitation(invitationId, user?.id, userIncomingInvitations);
      
      if (result) {
        console.log('✅ CompanyInvitations: Successfully accepted invitation, refreshing list');
        await refreshUserIncomingInvitations();
        
        toast({
          title: "Welcome aboard! 🎉",
          description: `You have successfully joined ${result.company.name}`,
        });
      } else {
        console.log('ℹ️ CompanyInvitations: Invitation acceptance returned null (likely already processed)');
      }
    } catch (error: any) {
      console.error('❌ CompanyInvitations: Error accepting invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to accept invitation",
        description: error.message || "Please try again later",
      });
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    console.log('❌ CompanyInvitations: User clicked DECLINE for invitation:', invitationId);
    
    if (processingInvitations.has(invitationId)) {
      console.log('⏳ Already processing this invitation, skipping...');
      return;
    }
    
    setProcessingInvitations(prev => new Set(prev).add(invitationId));
    
    try {
      console.log('🗑️ CompanyInvitations: Starting decline process for:', invitationId);
      
      await declineInvitation(invitationId);
      
      console.log('✅ CompanyInvitations: Successfully declined invitation, refreshing list');
      await refreshUserIncomingInvitations();
      
      toast({
        title: "Invitation declined",
        description: "The invitation has been declined successfully",
      });
    } catch (error: any) {
      console.error('❌ CompanyInvitations: Error declining invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to decline invitation",
        description: error.message || "Please try again later",
      });
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  console.log('📊 CompanyInvitations: Rendering with', userIncomingInvitations.length, 'invitations');

  if (userIncomingInvitations.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-gray-400" />
          </div>
          <CardTitle className="text-lg">No Pending Invitations</CardTitle>
          <CardDescription>
            You don't have any pending company invitations at the moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Pending Invitations</h3>
        <Badge variant="secondary" className="ml-2">
          {userIncomingInvitations.length}
        </Badge>
      </div>
      
      {userIncomingInvitations.map((invitation) => (
        <Card key={invitation.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {(invitation as any).companies?.name || 'Unknown Company'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Users className="w-4 h-4" />
                    Invited as {formatRole(invitation.role)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {formatDate(invitation.created_at)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleAcceptInvitation(invitation.id)}
                disabled={isProcessing || processingInvitations.has(invitation.id)}
                className="flex-1"
              >
                {processingInvitations.has(invitation.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDeclineInvitation(invitation.id)}
                disabled={isProcessing || processingInvitations.has(invitation.id)}
                className="flex-1"
              >
                {processingInvitations.has(invitation.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  'Decline'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompanyInvitations;
