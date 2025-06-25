
import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '../utils/dataUtils';

// Function to check if a string is a valid UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Function to migrate old departments to have proper UUIDs
const migrateDepartments = (departments: Department[]): Department[] => {
  let migrationNeeded = false;
  const migratedDepartments = departments.map(dept => {
    if (!isValidUUID(dept.id)) {
      migrationNeeded = true;
      console.log('Migrating department:', dept.name, 'from ID:', dept.id, 'to new UUID');
      return { ...dept, id: generateId() };
    }
    return dept;
  });
  
  if (migrationNeeded) {
    console.log('Department migration completed:', migratedDepartments);
  }
  
  return migratedDepartments;
};

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const storedValue = localStorage.getItem('departments');
    
    if (storedValue) {
      try {
        const parsedDepartments = JSON.parse(storedValue);
        // Always migrate any departments with invalid UUIDs
        const migratedDepartments = migrateDepartments(parsedDepartments);
        
        // Check if migration was needed
        const needsMigration = parsedDepartments.some((dept: Department) => !isValidUUID(dept.id));
        if (needsMigration) {
          console.log('Migrating departments to use proper UUIDs and saving immediately');
          // Save the migrated departments immediately
          localStorage.setItem('departments', JSON.stringify(migratedDepartments));
        }
        
        return migratedDepartments;
      } catch (error) {
        console.error('Error parsing stored departments, using defaults');
      }
    }
    
    // Default departments with proper UUIDs
    const defaultDepartments = [
      { id: generateId(), name: 'Marketing' },
      { id: generateId(), name: 'Sales' },
      { id: generateId(), name: 'Product' }
    ];
    
    // Save defaults to localStorage immediately
    localStorage.setItem('departments', JSON.stringify(defaultDepartments));
    console.log('Created default departments with UUIDs:', defaultDepartments);
    
    return defaultDepartments;
  });
  
  const { toast } = useToast();
  
  // Force save departments to localStorage whenever they change
  useEffect(() => {
    console.log('Saving departments to localStorage:', departments);
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);

  const addDepartment = (name: string) => {
    const newDepartment = { id: generateId(), name };
    console.log('Adding new department with UUID:', newDepartment);
    setDepartments([...departments, newDepartment]);
  };
  
  const editDepartment = (id: string, name: string) => {
    console.log('Editing department:', id, 'to name:', name);
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
    
    console.log('Deleting department:', id);
    setDepartments(departments.filter(dept => dept.id !== id));
  };

  const getDepartmentById = (id: string) => {
    const department = departments.find(d => d.id === id);
    console.log('Looking for department with ID:', id, 'found:', department);
    return department;
  };
  
  return {
    departments,
    addDepartment,
    editDepartment,
    deleteDepartment,
    getDepartmentById
  };
};
