
import { useToast } from '@/components/ui/use-toast';
import { useCompanyCreation } from '../useCompanyCreation';
import { useCompanyManagement } from '../useCompanyManagement';
import { useInvitations } from '../useInvitations';
import { Company, CompanyRole, CompanyMember, CompanyInvitation } from '@/types';

export const useCompanyActions = (
  userId: string | undefined,
  userCompanyRole: CompanyRole | null,
  currentCompanyId: string | null,
  companyMembers: CompanyMember[],
  companyInvitations: CompanyInvitation[],
  setCompanies: (companies: Company[]) => void,
  setCurrentCompany: (company: Company | null) => void,
  setUserCompanyRole: (role: CompanyRole | null) => void,
  setCompanyMembers: (members: CompanyMember[]) => void,
  setCompanyInvitations: (invitations: CompanyInvitation[]) => void,
  fetchUserCompanies: () => Promise<void>
) => {
  const { createCompany: apiCreateCompany } = useCompanyCreation();
  const { inviteMember: apiInviteMember, removeMember: apiRemoveMember, updateMemberRole: apiUpdateMemberRole } = useCompanyManagement();
  const { acceptInvitation: apiAcceptInvitation, declineInvitation: apiDeclineInvitation } = useInvitations();

  // Create company
  const createCompany = async (name: string) => {
    try {
      const newCompany = await apiCreateCompany(name, userId);
      
      if (newCompany) {
        setCompanies(prevCompanies => [...prevCompanies, newCompany]);
        setCurrentCompany(newCompany);
        setUserCompanyRole('owner');
      }
      
      fetchUserCompanies();
    } catch (error) {
      console.error('Error in createCompany:', error);
      throw error;
    }
  };
  
  // Invite member
  const inviteMember = async (email: string, role: CompanyRole) => {
    try {
      await apiInviteMember(email, role, currentCompanyId, userId, userCompanyRole);
    } catch (error) {
      console.error('Error in inviteMember:', error);
    }
  };
  
  // Remove member
  const removeMember = async (userId: string) => {
    try {
      const removedUserId = await apiRemoveMember(userId, currentCompanyId, userCompanyRole, companyMembers);
      
      if (removedUserId) {
        setCompanyMembers(companyMembers.filter(m => m.userId !== userId));
      }
    } catch (error) {
      console.error('Error in removeMember:', error);
    }
  };
  
  // Update member role
  const updateMemberRole = async (userId: string, role: CompanyRole) => {
    try {
      const result = await apiUpdateMemberRole(userId, role, currentCompanyId, userCompanyRole);
      
      if (result) {
        setCompanyMembers(companyMembers.map(member => 
          member.userId === userId ? { ...member, role } : member
        ));
      }
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
    }
  };
  
  // Accept invitation
  const acceptInvitation = async (invitationId: string) => {
    try {
      const result = await apiAcceptInvitation(invitationId, userId, companyInvitations);
      
      if (result) {
        const { company, invitationId: acceptedId, role } = result;
        
        setCompanies(prevCompanies => [...prevCompanies, company]);
        setCurrentCompany(company);
        setUserCompanyRole(role);
        setCompanyInvitations(companyInvitations.filter(i => i.id !== acceptedId));
        
        fetchUserCompanies();
      }
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
    }
  };
  
  // Decline invitation
  const declineInvitation = async (invitationId: string) => {
    try {
      const declinedId = await apiDeclineInvitation(invitationId);
      
      if (declinedId) {
        setCompanyInvitations(companyInvitations.filter(i => i.id !== invitationId));
      }
    } catch (error) {
      console.error('Error in declineInvitation:', error);
    }
  };

  return {
    createCompany,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvitation,
    declineInvitation
  };
};
