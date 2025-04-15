import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Company, CompanyMember, CompanyRole, CompanyInvitation } from '@/types';
import { loadUserCompanies, loadUserInvitations, loadUserRole, loadCompanyMembers } from './companyUtils';
import { useCompanyCreation } from './useCompanyCreation';
import { useCompanyManagement } from './useCompanyManagement';
import { useInvitations } from './useInvitations';

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
  const { createCompany: apiCreateCompany, isCreating } = useCompanyCreation();
  const { inviteMember: apiInviteMember, removeMember: apiRemoveMember, updateMemberRole: apiUpdateMemberRole } = useCompanyManagement();
  const { acceptInvitation: apiAcceptInvitation, declineInvitation: apiDeclineInvitation } = useInvitations();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanyRole, setUserCompanyRole] = useState<CompanyRole | null>(null);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [companyInvitations, setCompanyInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("CompanyContext: User or auth state changed", { 
      userId: user?.id,
      isAuthenticated: !!user
    });
    
    if (user) {
      fetchUserCompanies();
      fetchUserInvitations();
    } else {
      setCompanies([]);
      setCurrentCompany(null);
      setUserCompanyRole(null);
      setCompanyMembers([]);
      setCompanyInvitations([]);
      setIsLoading(false);
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

  const fetchUserCompanies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const companiesData = await loadUserCompanies(user.id);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserInvitations = async () => {
    if (!user?.email) return;
    
    try {
      const invitationsData = await loadUserInvitations(user.email);
      setCompanyInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };
  
  const fetchUserRole = async () => {
    if (!user || !currentCompany) return;
    
    try {
      const role = await loadUserRole(user.id, currentCompany.id);
      setUserCompanyRole(role);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };
  
  const fetchCompanyMembers = async () => {
    if (!currentCompany) return;
    
    try {
      const members = await loadCompanyMembers(currentCompany.id);
      setCompanyMembers(members);
    } catch (error) {
      console.error('Error loading company members:', error);
    }
  };

  const createCompany = async (name: string) => {
    try {
      const newCompany = await apiCreateCompany(name, user?.id);
      
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
  
  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('currentCompanyId', company.id);
    }
  };
  
  const inviteMember = async (email: string, role: CompanyRole) => {
    try {
      await apiInviteMember(email, role, currentCompany?.id, user?.id, userCompanyRole);
    } catch (error) {
      console.error('Error in inviteMember:', error);
    }
  };
  
  const removeMember = async (userId: string) => {
    try {
      const removedUserId = await apiRemoveMember(userId, currentCompany?.id, userCompanyRole, companyMembers);
      
      if (removedUserId) {
        setCompanyMembers(companyMembers.filter(m => m.userId !== userId));
      }
    } catch (error) {
      console.error('Error in removeMember:', error);
    }
  };
  
  const updateMemberRole = async (userId: string, role: CompanyRole) => {
    try {
      const result = await apiUpdateMemberRole(userId, role, currentCompany?.id, userCompanyRole);
      
      if (result) {
        setCompanyMembers(companyMembers.map(member => 
          member.userId === userId ? { ...member, role } : member
        ));
      }
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
    }
  };
  
  const acceptInvitation = async (invitationId: string) => {
    try {
      const result = await apiAcceptInvitation(invitationId, user?.id, companyInvitations);
      
      if (result) {
        const { company, invitationId: acceptedId, role } = result;
        
        setCompanies([...companies, company]);
        setCurrentCompany(company);
        setUserCompanyRole(role);
        setCompanyInvitations(companyInvitations.filter(i => i.id !== acceptedId));
        
        fetchUserCompanies();
      }
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
    }
  };
  
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
