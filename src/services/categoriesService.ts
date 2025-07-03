import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  company_id: string;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchCategories = async (companyId?: string): Promise<Category[]> => {
  if (!companyId) return [];
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name');
    
  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
  
  return data || [];
};

export const createCategory = async (name: string, companyId: string, departmentId?: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: name.trim(),
      company_id: companyId,
      department_id: departmentId || null
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }
  
  return data;
};

export const updateCategory = async (id: string, name: string, departmentId?: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ 
      name: name.trim(),
      department_id: departmentId || null
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }
  
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
    
  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
};