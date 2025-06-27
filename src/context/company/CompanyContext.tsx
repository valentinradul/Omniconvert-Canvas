
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
  pendingInvitations: CompanyInvitation[];
  isLoading: boolean;
  createCompany: (name: string) => Promise<void>;
  switchCompany: (companyId: string) => void;
  inviteMember: (email: string, role: CompanyRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: CompanyRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  unsendInvitation: (invitationId: string) => Promise<void>;
  refreshPendingInvitations: () => Promise<void>;
  refreshCompanyMembers: () => Promise<void>;
  refreshUserCompanies: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Define data state first before using it
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
    pendingInvitations,
    setPendingInvitations,
    isLoading,
    fetchUserCompanies,
    fetchUserInvitations,
    fetchUserRole,
    fetchCompanyMembers,
    fetchPendingInvitations,
    switchCompany
  } = companyData;
  
  // Then use the company data
  const {
    createCompany,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvitation,
    declineInvitation,
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

  // Function to refresh pending invitations
  const refreshPendingInvitations = async () => {
    await fetchPendingInvitations();
    // Also refresh company members in case someone accepted an invitation
    await fetchCompanyMembers();
  };

  // Function to refresh company members
  const refreshCompanyMembers = async () => {
    await fetchCompanyMembers();
  };

  // Function to refresh user companies (useful after accepting invitations)
  const refreshUserCompanies = async () => {
    await fetchUserCompanies();
  };

  // Wrapper for unsend invitation that refreshes pending invitations
  const unsendInvitation = async (invitationId: string) => {
    await apiUnsendInvitation(invitationId, setPendingInvitations);
    await refreshPendingInvitations();
  };

  // Effects to handle auth and company state changes
  useEffect(() => {
    console.log("CompanyContext: User or auth state changed", { 
      userId: user?.id,
      isAuthenticated: !!user
    });
    
    if (user) {
      // Clear any cached company data when user changes
      localStorage.removeItem('userCompanies');
      
      fetchUserCompanies();
      if (user.email) {
        fetchUserInvitations(user.email);
      }
    } else {
      setCompanies([]);
      setCurrentCompany(null);
      setUserCompanyRole(null);
      setCompanyMembers([]);
      setCompanyInvitations([]);
      setPendingInvitations([]);
      
      // Clear localStorage when user logs out
      localStorage.removeItem('currentCompanyId');
      localStorage.removeItem('userCompanies');
    }
  }, [user]);

  useEffect(() => {
    if (currentCompany) {
      console.log("Current company changed:", currentCompany.name);
      fetchCompanyMembers();
      fetchUserRole();
      fetchPendingInvitations();
      
      localStorage.setItem('currentCompanyId', currentCompany.id);
    }
  }, [currentCompany]);

  useEffect(() => {
    if (user && companies.length > 0) {
      const storedCompanyId = localStorage.getItem('currentCompanyId');
      console.log("CompanyContext: Setting current company", { 
        companiesCount: companies.length,
        storedCompanyId
      });
      
      if (storedCompanyId) {
        const company = companies.find(c => c.id === storedCompanyId);
        if (company) {
          setCurrentCompany(company);
        } else {
          // If stored company doesn't exist in user's companies, set to first available
          setCurrentCompany(companies[0]);
        }
      } else {
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
        refreshUserCompanies
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
