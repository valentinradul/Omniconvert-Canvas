
import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { useToast } from '@/components/ui/use-toast';

// Generate a proper UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const storedValue = localStorage.getItem('departments');
    return storedValue ? JSON.parse(storedValue) : [
      { id: generateUUID(), name: 'Marketing' },
      { id: generateUUID(), name: 'Sales' },
      { id: generateUUID(), name: 'Product' }
    ];
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);

  const addDepartment = (name: string) => {
    setDepartments([...departments, { id: generateUUID(), name }]);
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
