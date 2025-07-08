import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  
  useEffect(() => {
    if (currentCompany) {
      fetchDepartments();
    } else {
      setDepartments([]);
      setLoading(false);
    }
  }, [currentCompany]);

  const fetchDepartments = async () => {
    if (!currentCompany) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, get user's role in the company
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('role, id')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .single();

      if (memberError) throw memberError;

      console.log('User role in company:', memberData.role, 'Member ID:', memberData.id);

      // If user is owner or admin, fetch all departments
      if (memberData.role === 'owner' || memberData.role === 'admin') {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('name');

        if (error) throw error;
        console.log('Admin/Owner - All departments:', data);
        setDepartments(data || []);
      } else {
        // For regular members, check if they have specific department permissions
        const { data: permissionData, error: permissionError } = await supabase
          .from('member_department_permissions')
          .select(`
            department_id,
            departments!inner(
              id,
              name,
              company_id,
              created_at
            )
          `)
          .eq('member_id', memberData.id);

        console.log('Member department permissions query result:', permissionData, permissionError);

        if (permissionError) {
          console.error('Error fetching department permissions:', permissionError);
          // If there's an error, set empty departments to be safe
          setDepartments([]);
        } else if (permissionData && permissionData.length > 0) {
          // Extract departments from the joined data
          const allowedDepartments = permissionData.map(perm => perm.departments).filter(Boolean);
          console.log('Member - Specific departments:', allowedDepartments);
          setDepartments(allowedDepartments);
        } else {
          // No specific permissions found - this means they have access to all departments
          // This is the default behavior when no restrictions are set
          const { data: allDepts, error: allDeptsError } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', currentCompany.id)
            .order('name');

          if (allDeptsError) throw allDeptsError;
          console.log('Member - All departments (no restrictions):', allDepts);
          setDepartments(allDepts || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch departments'
      });
      setDepartments([]);
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
