import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyMember, CompanyInvitation, CompanyRole } from '@/types';

// Load user companies - enhanced to ensure all accessible companies are loaded
export const loadUserCompanies = async (userId: string): Promise<Company[]> => {
  console.log('Loading companies for user:', userId);
  
  try {
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
      console.error('Error loading user companies:', memberError);
      throw memberError;
    }

    console.log('Raw member data:', memberData);

    if (!memberData || memberData.length === 0) {
      console.log('No companies found for user - checking for accepted invitations...');
      
      // Check if user has accepted invitations that haven't been converted to memberships yet
      const { data: acceptedInvitations } = await supabase
        .from('company_invitations')
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
        .eq('email', (await supabase.auth.getUser()).data.user?.email || '')
        .eq('accepted', true);

      if (acceptedInvitations && acceptedInvitations.length > 0) {
        console.log('Found accepted invitations without memberships, creating memberships...');
        
        // Create missing memberships for accepted invitations
        for (const invitation of acceptedInvitations) {
          const { error: insertError } = await supabase
            .from('company_members')
            .insert({
              user_id: userId,
              company_id: invitation.company_id,
              role: invitation.role
            });
            
          if (insertError) {
            console.error('Error creating membership from invitation:', insertError);
          } else {
            console.log('Created membership for company:', invitation.company_id);
          }
        }
        
        // Retry loading companies after creating memberships
        return await loadUserCompanies(userId);
      }
      
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

// Load company invitations (pending) - ENHANCED with better debugging and data verification
export const loadCompanyInvitations = async (companyId: string): Promise<CompanyInvitation[]> => {
  console.log('=== LOADING PENDING INVITATIONS ===');
  console.log('Company ID:', companyId);
  
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
      .eq('accepted', false); // Only get pending (not accepted) invitations

    console.log('Raw database query result:', { data, error });

    if (error) {
      console.error('Database error loading company invitations:', error);
      throw error;
    }

    console.log('Raw pending invitations data from DB:', data);
    console.log('Number of records returned from DB:', data?.length || 0);

    if (!data || data.length === 0) {
      console.log('No pending invitations found in database for company:', companyId);
      return [];
    }

    // Transform the data with detailed logging
    const invitations: CompanyInvitation[] = data.map((invitation, index) => {
      console.log(`Transforming invitation ${index + 1}:`, invitation);
      
      const transformed = {
        id: invitation.id,
        companyId: invitation.company_id,
        email: invitation.email,
        role: invitation.role as CompanyRole,
        accepted: invitation.accepted,
        createdAt: new Date(invitation.created_at),
        invitedBy: invitation.invited_by,
        companyName: (invitation.companies as any)?.name || 'Unknown Company'
      };
      
      console.log(`Transformed invitation ${index + 1}:`, transformed);
      return transformed;
    });

    console.log('=== FINAL TRANSFORMED INVITATIONS ===');
    console.log('Total invitations:', invitations.length);
    invitations.forEach((inv, i) => {
      console.log(`Final invitation ${i + 1}:`, {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        companyName: inv.companyName,
        accepted: inv.accepted
      });
    });
    
    return invitations;
  } catch (error) {
    console.error('Error in loadCompanyInvitations:', error);
    throw error;
  }
};
