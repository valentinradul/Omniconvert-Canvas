
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
      console.log("Active company changed, fetching role and members:", activeCompany.id);
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
      console.log("Fetching companies for user");
      const companiesData = await getUserCompanies();
      console.log("Fetched companies:", companiesData);
      setCompanies(companiesData);
      
      // Set first company as active if there's at least one and no active company is set
      if (companiesData.length > 0 && !activeCompany) {
        console.log("Setting first company as active:", companiesData[0].name);
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
      console.log("Fetching user role for company:", activeCompany.id);
      const role = await getCurrentUserCompanyRole(activeCompany.id);
      console.log("User role:", role);
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchCompanyMembers = async () => {
    if (!activeCompany) return;
    
    try {
      console.log("Fetching company members for company:", activeCompany.id);
      const membersData = await getCompanyMembers(activeCompany.id);
      console.log("Company members:", membersData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching company members:', error);
    }
  };

  const createNewCompany = async (name: string) => {
    try {
      console.log("Creating new company:", name);
      const newCompany = await createCompany(name);
      if (newCompany) {
        console.log("New company created:", newCompany);
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
      console.log("Updating company name:", companyId, name);
      const updatedCompany = await updateCompany(companyId, { name });
      if (updatedCompany) {
        console.log("Company updated:", updatedCompany);
        // Update companies list with the updated company
        const updatedCompanies = companies.map(c => 
          c.id === companyId ? { ...c, name } : c
        );
        setCompanies(updatedCompanies);
        
        // If this is the active company, update that too
        if (activeCompany && activeCompany.id === companyId) {
          console.log("Updating active company name");
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
    console.log("Switching to company:", companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
      console.log("Found company to switch to:", company.name);
      setActiveCompany(company);
    } else {
      console.error("Company not found:", companyId);
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
