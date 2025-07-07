
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Company, CompanyMember, CompanyRole, CompanyInvitation } from '@/types';
import { useCompanyData } from './hooks/useCompanyData';
import { useCompanyActions } from './hooks/useCompanyActions';

type CompanyContextType = {
  companies: Company[];
  currentCompany: Company | null;
  userCompanyRole: CompanyRole | null;
  companyMembers: CompanyMember[];
  companyInvitations: CompanyInvitation[];
  userIncomingInvitations: CompanyInvitation[];
  pendingInvitations: CompanyInvitation[];
  isLoading: boolean;
  createCompany: (name: string) => Promise<void>;
  switchCompany: (companyId: string) => void;
  inviteMember: (email: string, role: CompanyRole, departmentPermissions?: { all: boolean; departmentIds: string[] }) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: CompanyRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  unsendInvitation: (invitationId: string) => Promise<void>;
  refreshPendingInvitations: () => Promise<void>;
  refreshCompanyMembers: () => Promise<void>;
  refreshUserCompanies: () => Promise<void>;
  refreshUserIncomingInvitations: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const companyData = useCompanyData(user?.id);
  const {
    companies,
    setCompanies,
    currentCompany,
    setCurrentCompany,
    userCompanyRole,
    setUserCompanyRole,
    companyMembers,
    setCompanyMembers,
    companyInvitations,
    setCompanyInvitations,
    userIncomingInvitations,
    setUserIncomingInvitations,
    pendingInvitations,
    setPendingInvitations,
    isLoading,
    fetchUserCompanies,
    fetchUserInvitations,
    fetchUserIncomingInvitations,
    fetchUserRole,
    fetchCompanyMembers,
    fetchPendingInvitations,
    switchCompany
  } = companyData;
  
  const {
    createCompany: baseCreateCompany,
    inviteMember: baseInviteMember,
    removeMember: baseRemoveMember,
    updateMemberRole: baseUpdateMemberRole,
    acceptInvitation: baseAcceptInvitation,
    declineInvitation: baseDeclineInvitation,
    unsendInvitation: apiUnsendInvitation
  } = useCompanyActions(
    user?.id,
    userCompanyRole,
    currentCompany?.id || null,
    companyMembers,
    companyInvitations,
    setCompanies,
    setCurrentCompany,
    setUserCompanyRole,
    setCompanyMembers,
    setCompanyInvitations,
    fetchUserCompanies
  );

  const createCompany = async (name: string): Promise<void> => {
    await baseCreateCompany(name);
  };

  const inviteMember = async (email: string, role: CompanyRole, departmentPermissions?: { all: boolean; departmentIds: string[] }): Promise<void> => {
    await baseInviteMember(email, role, departmentPermissions);
  };

  const removeMember = async (userId: string): Promise<void> => {
    await baseRemoveMember(userId);
  };

  const updateMemberRole = async (userId: string, role: CompanyRole): Promise<void> => {
    await baseUpdateMemberRole(userId, role);
  };

  const acceptInvitation = async (invitationId: string): Promise<void> => {
    console.log('🚀 CompanyContext: MANUAL invitation acceptance triggered by user click');
    
    try {
      const result = await baseAcceptInvitation(invitationId);
      
      if (result && result.company && result.role) {
        console.log('🔄 CompanyContext: Manual invitation accepted, performing comprehensive refresh');
        
        localStorage.removeItem('userCompanies');
        localStorage.removeItem('currentCompanyId');
        
        const newCompany = result.company;
        const newRole = result.role as CompanyRole;
        
        console.log('🎯 CompanyContext: New company joined via MANUAL acceptance:', newCompany.name, 'Role:', newRole);
        
        setCompanies(prevCompanies => {
          const exists = prevCompanies.find(c => c.id === newCompany.id);
          if (!exists) {
            return [...prevCompanies, newCompany];
          }
          return prevCompanies;
        });
        
        setCurrentCompany(newCompany);
        setUserCompanyRole(newRole);
        localStorage.setItem('currentCompanyId', newCompany.id);
        
        if (user?.email) {
          await fetchUserIncomingInvitations(user.email);
        }
        
        await fetchUserCompanies();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await fetchCompanyMembers();
        await fetchUserRole();
        await fetchPendingInvitations();
        
        console.log('✅ CompanyContext: Successfully processed MANUAL invitation acceptance');
      }
    } catch (error) {
      console.error('❌ CompanyContext: Error in MANUAL acceptInvitation:', error);
      throw error;
    }
  };

  const declineInvitation = async (invitationId: string): Promise<void> => {
    await baseDeclineInvitation(invitationId);
  };

  const refreshPendingInvitations = async (): Promise<void> => {
    await fetchPendingInvitations();
    await fetchCompanyMembers();
  };

  const refreshCompanyMembers = async (): Promise<void> => {
    await fetchCompanyMembers();
  };

  const refreshUserCompanies = async (): Promise<void> => {
    console.log('🔄 CompanyContext: Manually refreshing user companies');
    await fetchUserCompanies();
  };

  const refreshUserIncomingInvitations = async (): Promise<void> => {
    if (user?.email) {
      console.log('🔄 CompanyContext: Manually refreshing user incoming invitations');
      await fetchUserIncomingInvitations(user.email);
    }
  };

  const unsendInvitation = async (invitationId: string): Promise<void> => {
    await apiUnsendInvitation(invitationId, setPendingInvitations);
    await refreshPendingInvitations();
  };

  useEffect(() => {
    console.log('🔄 CompanyContext: User or auth state changed', { 
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user
    });
    
    if (user) {
      localStorage.removeItem('userCompanies');
      
      console.log('📊 CompanyContext: Fetching companies for authenticated user');
      setTimeout(() => {
        fetchUserCompanies();
        if (user.email) {
          console.log('📧 CompanyContext: Fetching incoming invitations for email:', user.email);
          fetchUserIncomingInvitations(user.email);
        }
      }, 100);
    } else {
      setCompanies([]);
      setCurrentCompany(null);
      setUserCompanyRole(null);
      setCompanyMembers([]);
      setCompanyInvitations([]);
      setUserIncomingInvitations([]);
      setPendingInvitations([]);
      
      localStorage.removeItem('currentCompanyId');
      localStorage.removeItem('userCompanies');
    }
  }, [user]);

  useEffect(() => {
    if (currentCompany) {
      console.log('🏢 CompanyContext: Current company changed:', currentCompany.name, 'ID:', currentCompany.id);
      fetchCompanyMembers();
      fetchUserRole();
      fetchPendingInvitations();
      
      localStorage.setItem('currentCompanyId', currentCompany.id);
    }
  }, [currentCompany]);

  useEffect(() => {
    if (user && companies.length > 0) {
      const storedCompanyId = localStorage.getItem('currentCompanyId');
      console.log('🎯 CompanyContext: Setting current company', { 
        companiesCount: companies.length,
        storedCompanyId,
        availableCompanies: companies.map(c => ({ id: c.id, name: c.name }))
      });
      
      if (storedCompanyId) {
        const company = companies.find(c => c.id === storedCompanyId);
        if (company) {
          console.log('✅ CompanyContext: Setting stored company as current:', company.name);
          setCurrentCompany(company);
        } else {
          console.log('⚠️ CompanyContext: Stored company not found, setting first available');
          setCurrentCompany(companies[0]);
        }
      } else {
        console.log('📌 CompanyContext: No stored company, setting first available');
        setCurrentCompany(companies[0]);
      }
    }
  }, [companies, user]);
  
  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        userCompanyRole,
        companyMembers,
        companyInvitations,
        userIncomingInvitations,
        pendingInvitations,
        isLoading,
        createCompany,
        switchCompany,
        inviteMember,
        removeMember,
        updateMemberRole,
        acceptInvitation,
        declineInvitation,
        unsendInvitation,
        refreshPendingInvitations,
        refreshCompanyMembers,
        refreshUserCompanies,
        refreshUserIncomingInvitations
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
