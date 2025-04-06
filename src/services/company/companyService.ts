
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Company } from './types';

export async function createCompany(name: string): Promise<Company | null> {
  try {
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error('You must be logged in to create a company');
      return null;
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert({ 
        name,
        created_by: userData.user.id 
      })
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
