
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '@/services/company/types';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/context/AuthContext';

interface CompanyContextProps {
  companies: Company[];
  activeCompany: Company | null;
  userRole: string | null;
  isLoading: boolean;
  isOwner: boolean;
  isManager: boolean;
  isAdmin: boolean;
  createCompany: (name: string) => Promise<Company | null>;
  switchCompany: (companyId: string) => void;
  refreshCompanies: () => void;
  updateCompanyName: (companyId: string, name: string) => Promise<Company | null>;
}

const CompanyContext = createContext<CompanyContextProps | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { 
    companies,
    activeCompany,
    userRole,
    isLoading,
    isOwner,
    isManager,
    createNewCompany,
    switchCompany,
    refreshCompanies,
    updateCompanyName
  } = useCompany();
  
  // Admin is the same as owner in this context
  const isAdmin = isOwner;

  // Debug active company and permissions when they change
  useEffect(() => {
    if (activeCompany) {
      console.log("CompanyContext: Active company:", activeCompany.name, 
        "User role:", userRole, "isOwner:", isOwner, "isAdmin:", isAdmin);
    } else {
      console.log("CompanyContext: No active company");
    }
  }, [activeCompany, userRole, isOwner, isAdmin]);

  const contextValue = {
    companies,
    activeCompany,
    userRole,
    isLoading,
    isOwner,
    isManager,
    isAdmin,
    createCompany: createNewCompany,
    switchCompany,
    refreshCompanies,
    updateCompanyName
  };

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};
