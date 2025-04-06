
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompanyMember } from './types';

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
