
import { useState, useEffect } from 'react';
import { Company, CompanyMember, CompanyInvitation, CompanyRole } from '@/types';
import { loadUserCompanies, loadUserInvitations, loadUserRole, loadCompanyMembers, loadCompanyInvitations } from '../utils';

export const useCompanyData = (userId: string | undefined) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanyRole, setUserCompanyRole] = useState<CompanyRole | null>(null);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [companyInvitations, setCompanyInvitations] = useState<CompanyInvitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user companies
  const fetchUserCompanies = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const companiesData = await loadUserCompanies(userId);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load user invitations
  const fetchUserInvitations = async (userEmail: string) => {
    try {
      const invitationsData = await loadUserInvitations(userEmail);
      setCompanyInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };
  
  // Load user role in company
  const fetchUserRole = async () => {
    if (!userId || !currentCompany?.id) return;
    
    try {
      const role = await loadUserRole(userId, currentCompany.id);
      setUserCompanyRole(role);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };
  
  // Load company members
  const fetchCompanyMembers = async () => {
    if (!currentCompany?.id) return;
    
    try {
      const members = await loadCompanyMembers(currentCompany.id);
      setCompanyMembers(members);
    } catch (error) {
      console.error('Error loading company members:', error);
    }
  };

  // Load pending invitations for current company
  const fetchPendingInvitations = async () => {
    if (!currentCompany?.id) return;
    
    try {
      const invitations = await loadCompanyInvitations(currentCompany.id);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  // Set current company by ID
  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('currentCompanyId', company.id);
    }
  };

  return {
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
  };
};
