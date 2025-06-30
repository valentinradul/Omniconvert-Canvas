
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyMember, CompanyInvitation, CompanyRole } from '@/types';

// Load user companies
export const loadUserCompanies = async (userId: string): Promise<Company[]> => {
  console.log('Loading companies for user:', userId);
  
  try {
    // First, get all companies the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('company_members')
      .select(`
        company_id,
        companies (
          id,
          name,
          created_by,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error loading user companies:', memberError);
      throw memberError;
    }

    console.log('Raw member data:', memberData);

    if (!memberData || memberData.length === 0) {
      console.log('No companies found for user');
      return [];
    }

    // Transform the data to match our Company type
    const companies: Company[] = memberData
      .filter(member => member.companies) // Filter out any null companies
      .map(member => {
        const company = member.companies as any;
        return {
          id: company.id,
          name: company.name,
          createdAt: new Date(company.created_at),
          createdBy: company.created_by
        };
      });

    console.log('Transformed companies:', companies);
    return companies;
  } catch (error) {
    console.error('Error in loadUserCompanies:', error);
    throw error;
  }
};

// Load user invitations
export const loadUserInvitations = async (userEmail: string): Promise<CompanyInvitation[]> => {
  console.log('Loading invitations for email:', userEmail);
  
  try {
    const { data, error } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        email,
        role,
        accepted,
        created_at,
        invited_by,
        companies (
          id,
          name
        )
      `)
      .eq('email', userEmail)
      .eq('accepted', false);

    if (error) {
      console.error('Error loading invitations:', error);
      throw error;
    }

    console.log('Raw invitation data:', data);

    if (!data || data.length === 0) {
      console.log('No invitations found for user');
      return [];
    }

    // Transform the data
    const invitations: CompanyInvitation[] = data.map(invitation => ({
      id: invitation.id,
      companyId: invitation.company_id,
      email: invitation.email,
      role: invitation.role as CompanyRole,
      accepted: invitation.accepted,
      createdAt: new Date(invitation.created_at),
      invitedBy: invitation.invited_by,
      companyName: (invitation.companies as any)?.name || 'Unknown Company'
    }));

    console.log('Transformed invitations:', invitations);
    return invitations;
  } catch (error) {
    console.error('Error in loadUserInvitations:', error);
    throw error;
  }
};

// Load user role in company
export const loadUserRole = async (userId: string, companyId: string): Promise<CompanyRole | null> => {
  console.log('Loading user role for:', { userId, companyId });
  
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user role:', error);
      throw error;
    }

    console.log('User role data:', data);
    return data?.role as CompanyRole || null;
  } catch (error) {
    console.error('Error in loadUserRole:', error);
    throw error;
  }
};

// Load company members
export const loadCompanyMembers = async (companyId: string): Promise<CompanyMember[]> => {
  console.log('Loading members for company:', companyId);
  
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error loading company members:', error);
      throw error;
    }

    console.log('Raw member data:', data);

    if (!data || data.length === 0) {
      console.log('No members found for company');
      return [];
    }

    // Transform the data
    const members: CompanyMember[] = data.map(member => ({
      id: member.id,
      userId: member.user_id,
      role: member.role as CompanyRole,
      createdAt: new Date(member.created_at),
      name: (member.profiles as any)?.full_name || 'Unknown User',
      email: '', // We'll need to get this separately if needed
      avatarUrl: (member.profiles as any)?.avatar_url || null
    }));

    console.log('Transformed members:', members);
    return members;
  } catch (error) {
    console.error('Error in loadCompanyMembers:', error);
    throw error;
  }
};

// Load company invitations (pending)
export const loadCompanyInvitations = async (companyId: string): Promise<CompanyInvitation[]> => {
  console.log('Loading pending invitations for company:', companyId);
  
  try {
    const { data, error } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        email,
        role,
        accepted,
        created_at,
        invited_by,
        companies (
          name
        )
      `)
      .eq('company_id', companyId)
      .eq('accepted', false);

    if (error) {
      console.error('Error loading company invitations:', error);
      throw error;
    }

    console.log('Raw invitation data:', data);

    if (!data || data.length === 0) {
      console.log('No pending invitations found for company');
      return [];
    }

    // Transform the data
    const invitations: CompanyInvitation[] = data.map(invitation => ({
      id: invitation.id,
      companyId: invitation.company_id,
      email: invitation.email,
      role: invitation.role as CompanyRole,
      accepted: invitation.accepted,
      createdAt: new Date(invitation.created_at),
      invitedBy: invitation.invited_by,
      companyName: (invitation.companies as any)?.name || 'Unknown Company'
    }));

    console.log('Transformed invitations:', invitations);
    return invitations;
  } catch (error) {
    console.error('Error in loadCompanyInvitations:', error);
    throw error;
  }
};
