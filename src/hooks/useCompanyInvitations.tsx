
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  CompanyInvitation,
  getUserInvitations,
  getCompanyInvitations,
  inviteTeamMember,
  acceptInvitation,
  rejectInvitation
} from '@/services/companyService';
import { toast } from 'sonner';

export function useCompanyInvitations(companyId?: string) {
  const [userInvitations, setUserInvitations] = useState<CompanyInvitation[]>([]);
  const [companyInvitations, setCompanyInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch user's personal invitations
  useEffect(() => {
    if (user) {
      fetchUserInvitations();
    } else {
      setUserInvitations([]);
    }
  }, [user]);

  // Fetch company invitations if companyId is provided
  useEffect(() => {
    if (companyId) {
      fetchCompanyInvitations();
    } else {
      setCompanyInvitations([]);
    }
  }, [companyId]);

  const fetchUserInvitations = async () => {
    setIsLoading(true);
    try {
      const invitations = await getUserInvitations();
      setUserInvitations(invitations);
    } catch (error) {
      console.error('Error fetching user invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyInvitations = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const invitations = await getCompanyInvitations(companyId);
      setCompanyInvitations(invitations);
    } catch (error) {
      console.error('Error fetching company invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async (email: string, role: 'manager' | 'member'): Promise<boolean> => {
    if (!companyId) {
      toast.error('No active company selected');
      return false;
    }
    
    try {
      const result = await inviteTeamMember(companyId, email, role);
      if (result) {
        toast.success(`Invitation sent to ${email}`);
        fetchCompanyInvitations();
      }
      return result;
    } catch (error) {
      console.error('Error sending invitation:', error);
      return false;
    }
  };

  const handleAcceptInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const result = await acceptInvitation(invitationId);
      if (result) {
        toast.success('Invitation accepted');
        fetchUserInvitations();
      }
      return result;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  const handleRejectInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const result = await rejectInvitation(invitationId);
      if (result) {
        toast.success('Invitation rejected');
        fetchUserInvitations();
      }
      return result;
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      return false;
    }
  };

  return {
    userInvitations,
    companyInvitations,
    isLoading,
    sendInvitation,
    acceptInvitation: handleAcceptInvitation,
    rejectInvitation: handleRejectInvitation,
    refreshUserInvitations: fetchUserInvitations,
    refreshCompanyInvitations: fetchCompanyInvitations
  };
}
