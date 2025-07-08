
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';

interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

export const useDepartments = (currentCompany?: { id: string } | null) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userCompanyRole } = useCompany();
  
  useEffect(() => {
    if (currentCompany) {
      fetchDepartments();
    } else {
      setDepartments([]);
      setLoading(false);
    }
  }, [currentCompany, userCompanyRole]);

  const fetchDepartments = async () => {
    if (!currentCompany) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If user is owner or admin, show all departments
      if (userCompanyRole === 'owner' || userCompanyRole === 'admin') {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('name');

        if (error) throw error;
        setDepartments(data || []);
      } else {
        // For regular members, only show departments they have access to
        const { data, error } = await supabase
          .from('departments')
          .select(`
            *,
            member_department_permissions!inner (
              member_id,
              company_members!inner (
                user_id
              )
            )
          `)
          .eq('company_id', currentCompany.id)
          .eq('member_department_permissions.company_members.user_id', user.id)
          .order('name');

        if (error) throw error;
        setDepartments(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch departments'
      });
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (name: string) => {
    if (!currentCompany) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('departments')
        .insert({
          name: name.trim(),
          company_id: currentCompany.id,
          created_by: user.id
        });

      if (error) throw error;

      await fetchDepartments();
      
      toast({
        title: 'Success',
        description: 'Department created successfully'
      });
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create department'
      });
    }
  };
  
  const editDepartment = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ name: name.trim() })
        .eq('id', id);

      if (error) throw error;

      await fetchDepartments();
      
      toast({
        title: 'Success',
        description: 'Department updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update department'
      });
    }
  };
  
  const deleteDepartment = async (id: string, ideas?: any[]) => {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchDepartments();
      
      toast({
        title: 'Success',
        description: 'Department deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete department'
      });
    }
  };

  const getDepartmentById = (id: string) => {
    const department = departments.find(d => d.id === id);
    console.log('Looking for department with ID:', id, 'found:', department);
    return department;
  };
  
  return {
    departments,
    loading,
    addDepartment,
    editDepartment,
    deleteDepartment,
    getDepartmentById,
    refetch: fetchDepartments
  };
};
