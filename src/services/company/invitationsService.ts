import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompanyInvitation } from './types';

export async function inviteTeamMember(companyId: string, email: string, role: 'manager' | 'member'): Promise<boolean> {
  try {
    console.log(`Starting invitation process for ${email} with role ${role} in company ${companyId}`);
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('No authenticated user found', userError);
      toast.error('You must be logged in to invite team members');
      return false;
    }
    
    console.log(`Current user ID: ${userData.user.id}`);
    
    // Check if the invitation already exists
    const { data: existingInvitation, error: checkError } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('company_id', companyId)
      .eq('email', email)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing invitation:', checkError);
      toast.error('Failed to check for existing invitation');
      return false;
    }
    
    if (existingInvitation) {
      console.log(`Invitation already exists for ${email}`);
      toast.error('An invitation has already been sent to this email');
      return false;
    }
    
    // Create the invitation
    const { data, error } = await supabase
      .from('company_invitations')
      .insert({
        company_id: companyId,
        email: email,
        role: role,
        invited_by: userData.user.id
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to invite team member');
      return false;
    }
    
    console.log('Invitation created successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception in inviteTeamMember:', error);
    toast.error('An unexpected error occurred when sending the invitation');
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
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('email', userData.user.email);
      
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
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error('You must be logged in to accept invitations');
      return false;
    }
    
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
        user_id: userData.user.id,
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
