
import { useState, useEffect } from 'react';
import { Department } from '@/types';
import { generateId, getInitialData } from '../utils/dataUtils';

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>(() => 
    getInitialData('departments', [
      { id: generateId(), name: 'Marketing' },
      { id: generateId(), name: 'Sales' },
      { id: generateId(), name: 'Product' }
    ])
  );
  
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
      alert('Cannot delete department that has ideas associated with it.');
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
