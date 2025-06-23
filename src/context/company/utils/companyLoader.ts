
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyMember, CompanyRole, CompanyInvitation } from '@/types';

// Load user companies
export const loadUserCompanies = async (userId: string) => {
  try {
    console.log("Loading user companies for:", userId);
    
    const { data: memberData, error: memberError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId);
      
    if (memberError) {
      console.error("Error fetching company members:", memberError);
      throw memberError;
    }
    
    console.log("Company member data:", memberData);
    
    if (memberData.length > 0) {
      const companyIds = memberData.map(m => m.company_id);
      
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);
        
      if (companiesError) {
        console.error("Error fetching companies:", companiesError);
        throw companiesError;
      }
      
      console.log("Companies data:", companiesData);
      
      const formattedCompanies: Company[] = companiesData.map(c => ({
        id: c.id,
        name: c.name,
        createdAt: new Date(c.created_at),
        createdBy: c.created_by
      }));
      
      return formattedCompanies;
    } else {
      console.log("User has no companies");
      return [];
    }
  } catch (error: any) {
    console.error('Error loading companies:', error.message);
    throw error;
  }
};

// Load user role in company
export const loadUserRole = async (userId: string, companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();
      
    if (error) throw error;
    
    return data.role as CompanyRole;
  } catch (error: any) {
    console.error('Error loading user role:', error.message);
    throw error;
  }
};

// Load company members
export const loadCompanyMembers = async (companyId: string) => {
  try {
    // Get all company members first
    const { data: membersData, error: membersError } = await supabase
      .from('company_members')
      .select('id, company_id, user_id, role, created_at')
      .eq('company_id', companyId);
      
    if (membersError) {
      console.error('Error fetching company members:', membersError);
      throw membersError;
    }
    
    // Initialize array for formatted member data
    const formattedMembers: CompanyMember[] = [];
    
    // Loop through each member and fetch their profile data separately
    for (const member of membersData) {
      try {
        // Get profile for this user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', member.user_id)
          .single();
        
        // Add member to array with profile data if available
        formattedMembers.push({
          id: member.id,
          companyId: member.company_id,
          userId: member.user_id,
          role: member.role as CompanyRole,
          createdAt: new Date(member.created_at),
          profile: profileError ? null : {
            fullName: profileData?.full_name,
            avatarUrl: profileData?.avatar_url
          }
        });
      } catch (profileFetchError) {
        console.error(`Error fetching profile for user ${member.user_id}:`, profileFetchError);
        // Still add the member even if profile fetch fails, just with null profile
        formattedMembers.push({
          id: member.id,
          companyId: member.company_id,
          userId: member.user_id,
          role: member.role as CompanyRole,
          createdAt: new Date(member.created_at),
          profile: null
        });
      }
    }
    
    return formattedMembers;
  } catch (error: any) {
    console.error('Error loading company members:', error.message);
    throw error;
  }
};

// Load company invitations
export const loadCompanyInvitations = async (companyId: string) => {
  try {
    console.log('Loading company invitations for company:', companyId);
    
    const { data, error } = await supabase
      .from('company_invitations')
      .select('id, company_id, email, role, accepted, invited_by, created_at')
      .eq('company_id', companyId)
      .eq('accepted', false)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error loading company invitations:', error);
      throw error;
    }
    
    console.log('Loaded company invitations:', data);
    
    const formattedInvitations: CompanyInvitation[] = (data || []).map(i => ({
      id: i.id,
      companyId: i.company_id,
      email: i.email,
      role: i.role as CompanyRole,
      accepted: i.accepted,
      invitedBy: i.invited_by,
      createdAt: new Date(i.created_at)
    }));
    
    return formattedInvitations;
  } catch (error: any) {
    console.error('Error loading company invitations:', error.message);
    throw error;
  }
};

// Load user invitations
export const loadUserInvitations = async (userEmail: string) => {
  try {
    console.log('Loading invitations for email:', userEmail);
    
    const { data, error } = await supabase
      .from('company_invitations')
      .select('id, company_id, email, role, accepted, invited_by, created_at')
      .eq('email', userEmail)
      .eq('accepted', false);
      
    if (error) {
      console.error('Error loading invitations:', error);
      throw error;
    }
    
    console.log('Loaded invitations:', data);
    
    const formattedInvitations: CompanyInvitation[] = (data || []).map(i => ({
      id: i.id,
      companyId: i.company_id,
      email: i.email,
      role: i.role as CompanyRole,
      accepted: i.accepted,
      invitedBy: i.invited_by,
      createdAt: new Date(i.created_at)
    }));
    
    return formattedInvitations;
  } catch (error: any) {
    console.error('Error loading invitations:', error.message);
    throw error;
  }
};
