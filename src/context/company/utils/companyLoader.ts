
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyMember, CompanyInvitation, CompanyRole } from '@/types';

// Load user companies - enhanced to ensure all accessible companies are loaded
export const loadUserCompanies = async (userId: string): Promise<Company[]> => {
  console.log('🔍 Loading companies for user:', userId);
  
  try {
    // First, get user email for debugging
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      console.error('❌ Could not get user email:', userError);
      return [];
    }
    const userEmail = userData.user.email;
    console.log('📧 User email:', userEmail);

    // Get all companies the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('company_members')
      .select(`
        company_id,
        role,
        companies (
          id,
          name,
          created_by,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (memberError) {
      console.error('❌ Error loading user companies:', memberError);
      throw memberError;
    }

    console.log('📊 Raw member data from company_members table:', memberData);

    // ALWAYS check for accepted invitations, regardless of existing memberships
    console.log('📋 Checking for accepted invitations...');
    
    const { data: acceptedInvitations, error: invitationError } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        role,
        accepted,
        email,
        companies (
          id,
          name,
          created_by,
          created_at
        )
      `)
      .eq('email', userEmail.toLowerCase().trim())
      .eq('accepted', true);

    if (invitationError) {
      console.error('❌ Error checking accepted invitations:', invitationError);
    } else {
      console.log('📋 Accepted invitations found:', acceptedInvitations);
      
      if (acceptedInvitations && acceptedInvitations.length > 0) {
        console.log('🔄 Processing accepted invitations...');
        
        // Check each accepted invitation and create missing memberships
        for (const invitation of acceptedInvitations) {
          console.log('🎯 Processing invitation for company:', invitation.company_id, 'with role:', invitation.role);
          
          // Check if membership already exists for this exact company
          const existingMembership = memberData?.find(member => 
            member.company_id === invitation.company_id
          );
          
          if (!existingMembership) {
            console.log('➕ Creating missing membership for company:', invitation.company_id);
            
            const { error: insertError } = await supabase
              .from('company_members')
              .insert({
                user_id: userId,
                company_id: invitation.company_id,
                role: invitation.role
              });
              
            if (insertError) {
              console.error('❌ Error creating membership from invitation:', insertError);
            } else {
              console.log('✅ Created membership for company:', invitation.company_id);
              
              // Add this company to memberData for processing
              if (invitation.companies) {
                if (!memberData) memberData = [];
                memberData.push({
                  company_id: invitation.company_id,
                  role: invitation.role,
                  companies: invitation.companies
                });
              }
            }
          } else {
            console.log('✅ Membership already exists for company:', invitation.company_id);
          }
        }
      }
    }

    // Also check for unaccepted invitations and log them
    const { data: pendingInvitations, error: pendingError } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        role,
        accepted,
        email,
        companies (
          id,
          name,
          created_by,
          created_at
        )
      `)
      .eq('email', userEmail.toLowerCase().trim())
      .eq('accepted', false);

    if (pendingError) {
      console.error('❌ Error checking pending invitations:', pendingError);
    } else {
      console.log('📨 Pending invitations found:', pendingInvitations);
    }

    if (!memberData || memberData.length === 0) {
      console.log('⚠️ No companies found for user after processing invitations');
      return [];
    }

    // Transform the data to match our Company type
    const companies: Company[] = memberData
      .filter(member => {
        console.log('🔍 Processing member data:', member);
        return member.companies;
      })
      .map(member => {
        const company = member.companies as any;
        console.log('🏢 Transforming company:', company);
        return {
          id: company.id,
          name: company.name,
          createdAt: new Date(company.created_at),
          createdBy: company.created_by
        };
      });

    console.log('✅ Final transformed companies:', companies);
    return companies;
  } catch (error) {
    console.error('💥 Error in loadUserCompanies:', error);
    throw error;
  }
};

// Load user invitations with better error handling
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
      .eq('email', userEmail.toLowerCase().trim())
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

    // Transform the data - include companyId in the returned object
    const members: CompanyMember[] = data.map(member => ({
      id: member.id,
      companyId: companyId, // Add the missing companyId property
      userId: member.user_id,
      role: member.role as CompanyRole,
      createdAt: new Date(member.created_at),
      profile: {
        fullName: (member.profiles as any)?.full_name || null,
        avatarUrl: (member.profiles as any)?.avatar_url || null
      }
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
