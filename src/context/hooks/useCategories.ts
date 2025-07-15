
import { useState, useEffect } from 'react';
import { Category, fetchCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoriesService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCategories = (currentCompany: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch categories when company changes
  useEffect(() => {
    const loadCategories = async () => {
      if (!currentCompany?.id) {
        setCategories([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const data = await fetchCategories(currentCompany.id);
        setCategories(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load categories',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentCompany?.id) {
      loadCategories();
      
      // Set up real-time subscription for category changes
      const channel = supabase
        .channel('categories-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'categories',
            filter: `company_id=eq.${currentCompany.id}`
          },
          (payload) => {
            console.log('Real-time category change:', payload);
            // Refetch categories when any change occurs
            loadCategories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCategories([]);
      setIsLoading(false);
    }
  }, [currentCompany, toast]);
  
  const addCategory = async (name: string, departmentId?: string): Promise<Category | null> => {
    if (!currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: 'Company required',
        description: 'Please select a company to add categories.',
      });
      return null;
    }
    
    try {
      const newCategory = await createCategory(name, currentCompany.id, departmentId);
      // Real-time subscription will handle the update
      
      toast({
        title: 'Category created',
        description: 'The category has been created successfully.',
      });
      
      return newCategory;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create category',
        description: error.message,
      });
      return null;
    }
  };
  
  const editCategory = async (id: string, name: string, departmentId?: string): Promise<void> => {
    try {
      await updateCategory(id, name, departmentId);
      // Real-time subscription will handle the update
      
      toast({
        title: 'Category updated',
        description: 'The category has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update category',
        description: error.message,
      });
    }
  };
  
  const removeCategory = async (id: string): Promise<void> => {
    try {
      await deleteCategory(id);
      // Real-time subscription will handle the update
      
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete category',
        description: error.message,
      });
    }
  };
  
  return {
    categories,
    isLoading,
    addCategory,
    editCategory,
    removeCategory
  };
};
