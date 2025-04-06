
import { supabase } from '@/integrations/supabase/client';
import { Company } from './types';

/**
 * Creates a new company for the current user
 */
export const createCompany = async (name: string): Promise<Company | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (!userData.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name,
        created_by: userData.user.id
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Company;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

/**
 * Update a company
 */
export const updateCompany = async (companyId: string, updates: { name?: string }): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Company;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

/**
 * Gets all companies for the current user
 */
export const getUserCompanies = async (): Promise<Company[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (!userData.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('company_members')
      .select('company_id, companies:company_id(*)')
      .eq('user_id', userData.user.id);

    if (error) throw error;

    // Extract the company data from the joined results
    const companies = data.map(item => item.companies) as Company[];
    return companies;
  } catch (error) {
    console.error('Error getting user companies:', error);
    throw error;
  }
};

/**
 * Gets the role of the current user in a company
 */
export const getCurrentUserCompanyRole = async (companyId: string): Promise<string | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (!userData.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase.rpc(
      'get_user_company_role',
      {
        user_id: userData.user.id,
        company_id: companyId
      }
    );

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error getting user company role:', error);
    return null;
  }
};
