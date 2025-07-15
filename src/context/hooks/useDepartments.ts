import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  ideas_count?: number;
}

export const useDepartments = (currentCompany?: { id: string } | null) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshDepartments } = useApp();
  
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

      // If user is owner or admin, fetch all departments with ideas count
      if (memberData.role === 'owner' || memberData.role === 'admin') {
        // First get departments
        const { data: departmentsData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('name');

        if (deptError) throw deptError;

        // Then get ideas count for each department
        const departmentsWithCount = await Promise.all(
          (departmentsData || []).map(async (dept) => {
            const { count } = await supabase
              .from('ideas')
              .select('*', { count: 'exact', head: true })
              .eq('departmentid', dept.id);
            
            return {
              ...dept,
              ideas_count: count || 0
            };
          })
        );

        console.log('Admin/Owner - All departments:', departmentsWithCount);
        setDepartments(departmentsWithCount);
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
          setDepartments([]);
        } else if (permissionData && permissionData.length > 0) {
          // Extract departments from the joined data and get ideas count
          const allowedDepartments = await Promise.all(
            permissionData.map(async (perm) => {
              const { count } = await supabase
                .from('ideas')
                .select('*', { count: 'exact', head: true })
                .eq('departmentid', perm.departments.id);
              
              return {
                ...perm.departments,
                ideas_count: count || 0
              };
            }).filter(Boolean)
          );
          console.log('Member - Specific departments:', allowedDepartments);
          setDepartments(allowedDepartments);
        } else {
          // No specific permissions found - this means they have access to all departments
          const { data: allDepts, error: allDeptsError } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', currentCompany.id)
            .order('name');

          if (allDeptsError) throw allDeptsError;

          // Get ideas count for each department
          const departmentsWithCount = await Promise.all(
            (allDepts || []).map(async (dept) => {
              const { count } = await supabase
                .from('ideas')
                .select('*', { count: 'exact', head: true })
                .eq('departmentid', dept.id);
              
              return {
                ...dept,
                ideas_count: count || 0
              };
            })
          );

          console.log('Member - All departments (no restrictions):', departmentsWithCount);
          setDepartments(departmentsWithCount);
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
      // Refresh departments in AppContext as well
      if (refreshDepartments) {
        await refreshDepartments();
      }
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
      // Refresh departments in AppContext as well
      if (refreshDepartments) {
        await refreshDepartments();
      }
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
      // Refresh departments in AppContext as well
      if (refreshDepartments) {
        await refreshDepartments();
      }
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
