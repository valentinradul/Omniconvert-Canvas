
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
      console.log('Loaded user companies:', companiesData);
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
      console.log('Loaded user invitations:', invitationsData);
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
      console.log('Loaded user role:', role);
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
      console.log('Loaded company members:', members);
      setCompanyMembers(members);
    } catch (error) {
      console.error('Error loading company members:', error);
    }
  };

  // Load pending invitations for current company - ENHANCED with better debugging and error handling
  const fetchPendingInvitations = async () => {
    if (!currentCompany?.id) {
      console.log('❌ No current company, clearing pending invitations');
      setPendingInvitations([]);
      return;
    }
    
    try {
      console.log('🔍 FETCHING PENDING INVITATIONS - Company:', currentCompany.name, 'ID:', currentCompany.id);
      
      const invitations = await loadCompanyInvitations(currentCompany.id);
      
      console.log('📥 RAW INVITATIONS RECEIVED:', {
        count: invitations.length,
        invitations: invitations,
        companyId: currentCompany.id,
        companyName: currentCompany.name
      });
      
      // Filter for non-accepted invitations (pending ones)
      const pending = invitations.filter(inv => !inv.accepted);
      
      console.log('🔄 FILTERED PENDING INVITATIONS:', {
        originalCount: invitations.length,
        pendingCount: pending.length,
        pendingInvitations: pending
      });
      
      setPendingInvitations(pending);
      console.log('✅ Successfully set pending invitations state:', pending.length, 'invitations');
      
      // Force a re-render check
      setTimeout(() => {
        console.log('🔄 STATE CHECK - pendingInvitations length:', pending.length);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error loading pending invitations:', error);
      setPendingInvitations([]);
    }
  };

  // Set current company by ID
  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      console.log('🔄 Switching to company:', company.name, 'ID:', company.id);
      setCurrentCompany(company);
      localStorage.setItem('currentCompanyId', company.id);
      
      // Clear pending invitations first, then fetch new ones
      setPendingInvitations([]);
      console.log('🧹 Cleared pending invitations before switch');
      
      // Force refresh of pending invitations when switching companies
      setTimeout(() => {
        console.log('⏰ Triggered pending invitations fetch for switched company');
        fetchPendingInvitations();
      }, 200);
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
