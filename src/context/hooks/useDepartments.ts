
import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { generateId } from '../utils/dataUtils';

// Function to check if a string is a valid UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Function to migrate old departments to have proper UUIDs
const migrateDepartments = (departments: Department[]): Department[] => {
  return departments.map(dept => ({
    ...dept,
    id: isValidUUID(dept.id) ? dept.id : generateId()
  }));
};

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const storedValue = localStorage.getItem('departments');
    
    if (storedValue) {
      try {
        const parsedDepartments = JSON.parse(storedValue);
        // Migrate any departments with invalid UUIDs
        const migratedDepartments = migrateDepartments(parsedDepartments);
        
        // Check if migration was needed
        const needsMigration = parsedDepartments.some((dept: Department) => !isValidUUID(dept.id));
        if (needsMigration) {
          console.log('Migrating departments to use proper UUIDs');
          // Save the migrated departments immediately
          localStorage.setItem('departments', JSON.stringify(migratedDepartments));
        }
        
        return migratedDepartments;
      } catch (error) {
        console.error('Error parsing stored departments, using defaults');
      }
    }
    
    // Default departments with proper UUIDs
    return [
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
    const newDepartment = { id: generateId(), name };
    setDepartments([...departments, newDepartment]);
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
