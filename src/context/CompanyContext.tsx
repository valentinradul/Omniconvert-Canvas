
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

  return (
    <CompanyContext.Provider value={{
      companies,
      activeCompany,
      userRole,
      isLoading,
      isOwner,
      isManager,
      createCompany: createNewCompany,
      switchCompany,
      refreshCompanies,
      updateCompanyName
    }}>
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
