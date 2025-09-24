
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyMember, CompanyInvitation, CompanyRole } from '@/types';

export function useCompanyData(userId: string | undefined) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [userCompanyRole, setUserCompanyRole] = useState<CompanyRole | null>(null);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [companyInvitations, setCompanyInvitations] = useState<CompanyInvitation[]>([]);
  const [userIncomingInvitations, setUserIncomingInvitations] = useState<CompanyInvitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserCompanies = useCallback(async () => {
    if (!userId) return;
    
    console.log('🔍 Fetching user companies (NO AUTO-PROCESSING)');
    setIsLoading(true);
    
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select(`
          *,
          companies (
            id,
            name,
            created_at,
            created_by
          )
        `)
        .eq('user_id', userId);

      if (memberError) {
        console.error('❌ Error fetching user companies:', memberError);
        return;
      }

      const userCompanies = memberData?.map(member => ({
        id: (member.companies as any).id,
        name: (member.companies as any).name,
        createdAt: new Date((member.companies as any).created_at),
        createdBy: (member.companies as any).created_by
      })) || [];

      console.log('✅ Fetched user companies:', userCompanies.length);
      setCompanies(userCompanies);
      
      // Store in localStorage for persistence
      localStorage.setItem('userCompanies', JSON.stringify(userCompanies));
      
    } catch (error) {
      console.error('❌ Error in fetchUserCompanies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // FIXED: Only fetch invitations, NO AUTOMATIC PROCESSING
  const fetchUserIncomingInvitations = useCallback(async (userEmail: string) => {
    console.log('📧 Fetching incoming invitations for email (NO AUTO-PROCESSING):', userEmail);
    
    try {
      const { data: invitations, error } = await supabase
        .from('company_invitations')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('email', userEmail.toLowerCase())
        .eq('accepted', false); // Only get non-accepted invitations

      if (error) {
        console.error('❌ Error fetching user invitations:', error);
        return;
      }

      const formattedInvitations = invitations?.map(invitation => ({
        id: invitation.id,
        companyId: invitation.company_id,
        email: invitation.email,
        role: invitation.role as CompanyRole,
        accepted: invitation.accepted,
        createdAt: new Date(invitation.created_at),
        invitedBy: invitation.invited_by,
        companyName: (invitation.companies as any)?.name || 'Unknown Company'
      })) || [];

      console.log('✅ Fetched user incoming invitations (NO AUTO-PROCESSING):', formattedInvitations.length);
      setUserIncomingInvitations(formattedInvitations);
      
    } catch (error) {
      console.error('❌ Error in fetchUserIncomingInvitations:', error);
    }
  }, []);

  const fetchUserRole = useCallback(async () => {
    if (!userId || !currentCompany) return;
    
    try {
      const { data: roleData, error } = await supabase
        .from('company_members')
        .select('role')
        .eq('user_id', userId)
        .eq('company_id', currentCompany.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user role:', error);
        return;
      }

      setUserCompanyRole(roleData?.role as CompanyRole || null);
    } catch (error) {
      console.error('❌ Error in fetchUserRole:', error);
    }
  }, [userId, currentCompany]);

  const fetchCompanyMembers = useCallback(async () => {
    if (!currentCompany) return;
    
    try {
      const { data: members, error } = await supabase
        .from('company_members')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('company_id', currentCompany.id);

      if (error) {
        console.error('❌ Error fetching company members:', error);
        return;
      }

      const formattedMembers = members?.map(member => ({
        id: member.id,
        companyId: member.company_id,
        userId: member.user_id,
        role: member.role as CompanyRole,
        createdAt: new Date(member.created_at),
        profile: {
          fullName: (member.profiles as any)?.full_name || '',
          avatarUrl: (member.profiles as any)?.avatar_url || null
        }
      })) || [];

      setCompanyMembers(formattedMembers);
    } catch (error) {
      console.error('❌ Error in fetchCompanyMembers:', error);
    }
  }, [currentCompany]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!currentCompany) return;
    
    try {
      const { data: invitations, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false);

      if (error) {
        console.error('❌ Error fetching pending invitations:', error);
        return;
      }

      const formattedInvitations = invitations?.map(invitation => ({
        id: invitation.id,
        companyId: invitation.company_id,
        email: invitation.email,
        role: invitation.role as CompanyRole,
        accepted: invitation.accepted,
        createdAt: new Date(invitation.created_at),
        invitedBy: invitation.invited_by
      })) || [];

      setPendingInvitations(formattedInvitations);
    } catch (error) {
      console.error('❌ Error in fetchPendingInvitations:', error);
    }
  }, [currentCompany]);

  const switchCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('currentCompanyId', companyId);
    }
  }, [companies]);

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
    userIncomingInvitations,
    setUserIncomingInvitations,
    pendingInvitations,
    setPendingInvitations,
    isLoading,
    fetchUserCompanies,
    fetchUserInvitations: fetchUserIncomingInvitations,
    fetchUserIncomingInvitations,
    fetchUserRole,
    fetchCompanyMembers,
    fetchPendingInvitations,
    switchCompany
  };
}
