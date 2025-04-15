
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types';

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
