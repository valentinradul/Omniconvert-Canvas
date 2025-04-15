
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
  isLoading: boolean;
  createCompany: (name: string) => Promise<void>;
  switchCompany: (companyId: string) => void;
  inviteMember: (email: string, role: CompanyRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: CompanyRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Use our custom hooks
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
    isLoading,
    fetchUserCompanies,
    fetchUserInvitations,
    fetchUserRole,
    fetchCompanyMembers,
    switchCompany
  } = useCompanyData(user?.id, currentCompany?.id);
  
  const {
    createCompany,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvitation,
    declineInvitation
  } = useCompanyActions(
    user?.id,
    userCompanyRole,
    currentCompany?.id,
    companyMembers,
    companyInvitations,
    setCompanies,
    setCurrentCompany,
    setUserCompanyRole,
    setCompanyMembers,
    setCompanyInvitations,
    fetchUserCompanies
  );

  // Effects to handle auth and company state changes
  useEffect(() => {
    console.log("CompanyContext: User or auth state changed", { 
      userId: user?.id,
      isAuthenticated: !!user
    });
    
    if (user) {
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
    }
  }, [user]);

  useEffect(() => {
    if (currentCompany) {
      console.log("Current company changed:", currentCompany.name);
      fetchCompanyMembers();
      fetchUserRole();
      
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
        isLoading,
        createCompany,
        switchCompany,
        inviteMember,
        removeMember,
        updateMemberRole,
        acceptInvitation,
        declineInvitation
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
