
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Company, 
  CompanyMember,
} from '@/services/company/types';
import { 
  createCompany, 
  getUserCompanies,
  getCurrentUserCompanyRole,
  updateCompany,
} from '@/services/company/companyService';
import { getCompanyMembers } from '@/services/company/membersService';

export function useCompany() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const { user } = useAuth();

  // Fetch user's companies
  useEffect(() => {
    if (user) {
      fetchCompanies();
    } else {
      setCompanies([]);
      setActiveCompany(null);
      setUserRole(null);
      setIsLoading(false);
    }
  }, [user]);

  // When active company changes, fetch role and members
  useEffect(() => {
    if (activeCompany && user) {
      fetchUserRole();
      fetchCompanyMembers();
    } else {
      setUserRole(null);
      setMembers([]);
    }
  }, [activeCompany, user]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const companiesData = await getUserCompanies();
      setCompanies(companiesData);
      
      // Set first company as active if there's at least one
      if (companiesData.length > 0 && !activeCompany) {
        setActiveCompany(companiesData[0]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRole = async () => {
    if (!activeCompany) return;
    
    try {
      const role = await getCurrentUserCompanyRole(activeCompany.id);
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchCompanyMembers = async () => {
    if (!activeCompany) return;
    
    try {
      const membersData = await getCompanyMembers(activeCompany.id);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching company members:', error);
    }
  };

  const createNewCompany = async (name: string) => {
    try {
      const newCompany = await createCompany(name);
      if (newCompany) {
        setCompanies([...companies, newCompany]);
        setActiveCompany(newCompany);
        return newCompany;
      }
      return null;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  };

  const updateCompanyName = async (companyId: string, name: string) => {
    try {
      const updatedCompany = await updateCompany(companyId, { name });
      if (updatedCompany) {
        // Update companies list with the updated company
        const updatedCompanies = companies.map(c => 
          c.id === companyId ? { ...c, name } : c
        );
        setCompanies(updatedCompanies);
        
        // If this is the active company, update that too
        if (activeCompany && activeCompany.id === companyId) {
          setActiveCompany({ ...activeCompany, name });
        }
        
        return updatedCompany;
      }
      return null;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  };

  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setActiveCompany(company);
    }
  };

  const isOwner = userRole === 'owner';
  const isManager = userRole === 'owner' || userRole === 'manager';

  return {
    companies,
    activeCompany,
    userRole,
    isLoading,
    members,
    isOwner,
    isManager,
    createNewCompany,
    switchCompany,
    refreshCompanies: fetchCompanies,
    refreshMembers: fetchCompanyMembers,
    updateCompanyName
  };
}
