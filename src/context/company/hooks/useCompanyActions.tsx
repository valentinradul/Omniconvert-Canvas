
import { useToast } from '@/hooks/use-toast';
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
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>,
  setCurrentCompany: React.Dispatch<React.SetStateAction<Company | null>>,
  setUserCompanyRole: React.Dispatch<React.SetStateAction<CompanyRole | null>>,
  setCompanyMembers: React.Dispatch<React.SetStateAction<CompanyMember[]>>,
  setCompanyInvitations: React.Dispatch<React.SetStateAction<CompanyInvitation[]>>,
  fetchUserCompanies: () => Promise<void>
) => {
  const { createCompany: apiCreateCompany } = useCompanyCreation();
  const { inviteMember: apiInviteMember, removeMember: apiRemoveMember, updateMemberRole: apiUpdateMemberRole, unsendInvitation: apiUnsendInvitation } = useCompanyManagement();
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
  
  // Invite member with department permissions - updated to accept departmentPermissions parameter
  const inviteMember = async (email: string, role: CompanyRole, departmentPermissions: string[] = []) => {
    try {
      await apiInviteMember(email, role, currentCompanyId, userId, userCompanyRole, departmentPermissions);
    } catch (error) {
      console.error('Error in inviteMember:', error);
      throw error;
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
  
  // Accept invitation - now properly returns the result
  const acceptInvitation = async (invitationId: string) => {
    try {
      const result = await apiAcceptInvitation(invitationId, userId, companyInvitations);
      
      if (result) {
        const { company, invitationId: acceptedId, role } = result;
        
        setCompanies(prevCompanies => [...prevCompanies, company]);
        setCurrentCompany(company);
        setUserCompanyRole(role as CompanyRole);
        setCompanyInvitations(companyInvitations.filter(i => i.id !== acceptedId));
        
        fetchUserCompanies();
      }
      
      return result; // Return the result so it can be used in CompanyContext
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      throw error;
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

  // Unsend invitation
  const unsendInvitation = async (invitationId: string, setPendingInvitations: React.Dispatch<React.SetStateAction<CompanyInvitation[]>>) => {
    try {
      const result = await apiUnsendInvitation(invitationId, currentCompanyId, userCompanyRole);
      
      if (result) {
        setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
      }
    } catch (error) {
      console.error('Error in unsendInvitation:', error);
    }
  };

  return {
    createCompany,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvitation,
    declineInvitation,
    unsendInvitation
  };
};
