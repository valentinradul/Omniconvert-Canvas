
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompanyRole, Company } from '@/types';
import { useCompanyManagement } from '../useCompanyManagement';
import { useInvitations } from '../useInvitations';

export const useCompanyActions = (
  userId: string | undefined,
  userCompanyRole: CompanyRole | null,
  currentCompanyId: string | null,
  companyMembers: any[],
  companyInvitations: any[],
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>,
  setCurrentCompany: React.Dispatch<React.SetStateAction<Company | null>>,
  setUserCompanyRole: React.Dispatch<React.SetStateAction<CompanyRole | null>>,
  setCompanyMembers: React.Dispatch<React.SetStateAction<any[]>>,
  setCompanyInvitations: React.Dispatch<React.SetStateAction<any[]>>,
  fetchUserCompanies: () => Promise<void>
) => {
  const { toast } = useToast();
  const { inviteMember: apiInviteMember, removeMember: apiRemoveMember, updateMemberRole: apiUpdateMemberRole, unsendInvitation: apiUnsendInvitation } = useCompanyManagement();
  const { acceptInvitation: baseAcceptInvitation, declineInvitation: baseDeclineInvitation } = useInvitations();

  const createCompany = async (name: string) => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to create a company.',
      });
      return;
    }

    try {
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          name,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh companies to include the new one
      await fetchUserCompanies();

      toast({
        title: 'Company created',
        description: `${name} has been created successfully.`,
      });

      return company;
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: error.message,
      });
      throw error;
    }
  };

  const inviteMember = async (email: string, role: CompanyRole, departmentPermissions?: { all: boolean; departmentIds: string[] }) => {
    return await apiInviteMember(email, role, currentCompanyId || undefined, userId, userCompanyRole, departmentPermissions);
  };

  const removeMember = async (userId: string) => {
    const result = await apiRemoveMember(userId, currentCompanyId || undefined, userCompanyRole, companyMembers);
    if (result) {
      setCompanyMembers(prev => prev.filter(member => member.userId !== userId));
    }
    return result;
  };

  const updateMemberRole = async (userId: string, role: CompanyRole) => {
    const result = await apiUpdateMemberRole(userId, role, currentCompanyId || undefined, userCompanyRole);
    if (result) {
      setCompanyMembers(prev => 
        prev.map(member => 
          member.userId === userId 
            ? { ...member, role }
            : member
        )
      );
    }
    return result;
  };

  const acceptInvitation = async (invitationId: string) => {
    return await baseAcceptInvitation(invitationId, userId, companyInvitations);
  };

  const declineInvitation = async (invitationId: string) => {
    return await baseDeclineInvitation(invitationId);
  };

  const unsendInvitation = async (invitationId: string, setPendingInvitations: React.Dispatch<React.SetStateAction<any[]>>) => {
    const result = await apiUnsendInvitation(invitationId, currentCompanyId || undefined, userCompanyRole);
    if (result) {
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      setCompanyInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    }
    return result;
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
