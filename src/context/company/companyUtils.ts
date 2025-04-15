import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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

// Load user invitations
export const loadUserInvitations = async (userEmail: string) => {
  try {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('email', userEmail)
      .eq('accepted', false);
      
    if (error) throw error;
    
    const formattedInvitations: CompanyInvitation[] = data.map(i => ({
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
    // Get company members with profile data using a different approach
    // First get company members
    const { data: membersData, error: membersError } = await supabase
      .from('company_members')
      .select('id, company_id, user_id, role, created_at')
      .eq('company_id', companyId);
      
    if (membersError) throw membersError;
    
    // Now get profile data for each member
    const formattedMembers: CompanyMember[] = [];
    
    for (const member of membersData) {
      // Get profile for this user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', member.user_id)
        .single();
      
      // Even if there's an error getting profile, still add the member with null profile
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
    }
    
    return formattedMembers;
  } catch (error: any) {
    console.error('Error loading company members:', error.message);
    throw error;
  }
};

// Create company
export const createCompanyAPI = async (name: string, userId: string) => {
  try {
    console.log("Creating company:", name, "for user:", userId);

    // Insert into companies table with explicit column names
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ 
        name, 
        created_by: userId 
      })
      .select()
      .single();
    
    if (companyError) {
      console.error("Error creating company:", companyError);
      throw companyError;
    }
    
    console.log("Company created:", companyData);
    
    // Add user as company owner with explicit column names
    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: companyData.id,
        user_id: userId,
        role: 'owner'
      });
      
    if (memberError) {
      console.error("Error adding company member:", memberError);
      throw memberError;
    }
    
    const newCompany: Company = {
      id: companyData.id,
      name: companyData.name,
      createdAt: new Date(companyData.created_at),
      createdBy: companyData.created_by
    };
    
    return newCompany;
  } catch (error: any) {
    console.error('Error creating company:', error.message);
    throw error;
  }
};
