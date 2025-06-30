
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
    acceptInvitation: baseAcceptInvitation,
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

  // Enhanced accept invitation that properly refreshes everything
  const acceptInvitation = async (invitationId: string) => {
    console.log('🚀 CompanyContext: Starting invitation acceptance process');
    
    try {
      await baseAcceptInvitation(invitationId);
      
      // Force refresh user companies after acceptance
      console.log('🔄 CompanyContext: Refreshing user companies after invitation acceptance');
      await fetchUserCompanies();
      
      // Also refresh user invitations to remove the accepted one
      if (user?.email) {
        await fetchUserInvitations(user.email);
      }
      
      console.log('✅ CompanyContext: Invitation acceptance process completed');
    } catch (error) {
      console.error('❌ CompanyContext: Error in acceptInvitation:', error);
      throw error;
    }
  };

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
    console.log('🔄 CompanyContext: Manually refreshing user companies');
    await fetchUserCompanies();
  };

  // Wrapper for unsend invitation that refreshes pending invitations
  const unsendInvitation = async (invitationId: string) => {
    await apiUnsendInvitation(invitationId, setPendingInvitations);
    await refreshPendingInvitations();
  };

  // Effects to handle auth and company state changes
  useEffect(() => {
    console.log('🔄 CompanyContext: User or auth state changed', { 
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user
    });
    
    if (user) {
      // Clear any cached company data when user changes
      localStorage.removeItem('userCompanies');
      
      console.log('📊 CompanyContext: Fetching companies for authenticated user');
      // Fetch user companies and invitations
      fetchUserCompanies();
      if (user.email) {
        console.log('📧 CompanyContext: Fetching invitations for email:', user.email);
        fetchUserInvitations(user.email);
      }
    } else {
      // Clear all state when user logs out
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
