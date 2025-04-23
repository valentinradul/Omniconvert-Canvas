
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
    
    const newCompany: Company = {
      id: companyData.id,
      name: companyData.name,
      createdAt: new Date(companyData.created_at),
      createdBy: companyData.created_by
    };
    
    return newCompany;
  } catch (error: any) {
    console.error('Error creating company 2:', error.message);
    throw error;
  }
};
