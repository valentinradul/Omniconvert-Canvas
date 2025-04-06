
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Company {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member';
  created_at: string;
}

export interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: 'manager' | 'member';
  invited_by: string;
  created_at: string;
  accepted: boolean;
}

export async function createCompany(name: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert({ name })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
      return null;
    }
    
    return data as Company;
  } catch (error) {
    console.error('Exception in createCompany:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
}

export async function getUserCompanies(): Promise<Company[]> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*');
      
    if (error) {
      console.error('Error fetching user companies:', error);
      return [];
    }
    
    return data as Company[];
  } catch (error) {
    console.error('Exception in getUserCompanies:', error);
    return [];
  }
}

export async function getCurrentUserCompanyRole(companyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .single();
      
    if (error || !data) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data.role;
  } catch (error) {
    console.error('Exception in getCurrentUserCompanyRole:', error);
    return null;
  }
}

export async function inviteTeamMember(companyId: string, email: string, role: 'manager' | 'member'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_invitations')
      .insert({
        company_id: companyId,
        email,
        role
      });
      
    if (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to invite team member');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in inviteTeamMember:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
}

export async function getCompanyInvitations(companyId: string): Promise<CompanyInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) {
      console.error('Error fetching company invitations:', error);
      return [];
    }
    
    return data as CompanyInvitation[];
  } catch (error) {
    console.error('Exception in getCompanyInvitations:', error);
    return [];
  }
}

export async function getUserInvitations(): Promise<CompanyInvitation[]> {
  try {
    const { user } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('email', user.email);
      
    if (error) {
      console.error('Error fetching user invitations:', error);
      return [];
    }
    
    return data as CompanyInvitation[];
  } catch (error) {
    console.error('Exception in getUserInvitations:', error);
    return [];
  }
}

export async function acceptInvitation(invitationId: string): Promise<boolean> {
  try {
    // First update the invitation to accepted
    const { error: updateError } = await supabase
      .from('company_invitations')
      .update({ accepted: true })
      .eq('id', invitationId);
      
    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      toast.error('Failed to accept invitation');
      return false;
    }
    
    // Get the invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
      
    if (fetchError || !invitation) {
      console.error('Error fetching invitation details:', fetchError);
      toast.error('Failed to process invitation');
      return false;
    }
    
    // Create company member entry
    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: invitation.company_id,
        role: invitation.role
      });
      
    if (memberError) {
      console.error('Error creating company membership:', memberError);
      toast.error('Failed to join company');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in acceptInvitation:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
}

export async function rejectInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_invitations')
      .delete()
      .eq('id', invitationId);
      
    if (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Failed to reject invitation');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in rejectInvitation:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
}

export async function getCompanyMembers(companyId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('company_id', companyId);
      
    if (error) {
      console.error('Error fetching company members:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getCompanyMembers:', error);
    return [];
  }
}

export async function updateCompanyMemberRole(
  memberId: string, 
  role: 'owner' | 'manager' | 'member'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_members')
      .update({ role })
      .eq('id', memberId);
      
    if (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in updateCompanyMemberRole:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
}

export async function removeCompanyMember(memberId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_members')
      .delete()
      .eq('id', memberId);
      
    if (error) {
      console.error('Error removing company member:', error);
      toast.error('Failed to remove team member');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in removeCompanyMember:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
}
