
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';

export const useViewPreference = () => {
  const [viewAllDepartments, setViewAllDepartments] = useState(false);
  const { user } = useAuth();
  const { currentCompany } = useCompany();

  // Create a unique key for this user and company combination
  const storageKey = `viewPreference_${user?.id}_${currentCompany?.id}`;

  useEffect(() => {
    if (user && currentCompany) {
      const savedPreference = localStorage.getItem(storageKey);
      if (savedPreference !== null) {
        setViewAllDepartments(JSON.parse(savedPreference));
      }
    }
  }, [user, currentCompany, storageKey]);

  const toggleViewPreference = () => {
    const newValue = !viewAllDepartments;
    setViewAllDepartments(newValue);
    if (user && currentCompany) {
      localStorage.setItem(storageKey, JSON.stringify(newValue));
    }
  };

  return {
    viewAllDepartments,
    toggleViewPreference
  };
};
