import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { generateId } from '../utils/dataUtils';
import { useToast } from '@/components/ui/use-toast';

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const storedValue = localStorage.getItem('departments');
    return storedValue ? JSON.parse(storedValue) : [
      { id: generateId(), name: 'Marketing' },
      { id: generateId(), name: 'Sales' },
      { id: generateId(), name: 'Product' }
    ];
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);

  const addDepartment = (name: string) => {
    setDepartments([...departments, { id: generateId(), name }]);
  };
  
  const editDepartment = (id: string, name: string) => {
    setDepartments(departments.map(dept => 
      dept.id === id ? { ...dept, name } : dept
    ));
  };
  
  const deleteDepartment = (id: string, ideas: any[]) => {
    const ideasUsingDepartment = ideas.some(idea => idea.departmentId === id);
    
    if (ideasUsingDepartment) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete department',
        description: 'Cannot delete department that has ideas associated with it.',
      });
      return;
    }
    
    setDepartments(departments.filter(dept => dept.id !== id));
  };

  const getDepartmentById = (id: string) => departments.find(d => d.id === id);
  
  return {
    departments,
    addDepartment,
    editDepartment,
    deleteDepartment,
    getDepartmentById
  };
};
