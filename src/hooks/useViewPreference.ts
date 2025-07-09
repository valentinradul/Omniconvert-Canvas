
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';

export const useViewPreference = () => {
  const [viewAllDepartments, setViewAllDepartments] = useState(false);
  const [canViewAllDepartments, setCanViewAllDepartments] = useState(false);
  const { user } = useAuth();
  const { currentCompany, userCompanyRole } = useCompany();

  // Create a unique key for this user and company combination
  const storageKey = `viewPreference_${user?.id}_${currentCompany?.id}`;

  // Check if user has permission to view all departments
  useEffect(() => {
    if (user && currentCompany && userCompanyRole) {
      // Owners and admins always have permission to view all departments
      if (userCompanyRole === 'owner' || userCompanyRole === 'admin') {
        setCanViewAllDepartments(true);
      } else {
        // For regular members, check if they have been granted this permission
        // This would normally come from a database, but for now we'll use localStorage
        // In a real implementation, this should be stored in the database and managed by admins
        const adminGrantedPermission = localStorage.getItem(`adminGrantedViewAll_${user.id}_${currentCompany.id}`);
        setCanViewAllDepartments(adminGrantedPermission === 'true');
      }
    }
  }, [user, currentCompany, userCompanyRole]);

  useEffect(() => {
    if (user && currentCompany && canViewAllDepartments) {
      const savedPreference = localStorage.getItem(storageKey);
      if (savedPreference !== null) {
        setViewAllDepartments(JSON.parse(savedPreference));
      }
    } else {
      // If user doesn't have permission, force to false
      setViewAllDepartments(false);
    }
  }, [user, currentCompany, storageKey, canViewAllDepartments]);

  const toggleViewPreference = () => {
    if (!canViewAllDepartments) {
      return; // Don't allow toggle if user doesn't have permission
    }
    
    const newValue = !viewAllDepartments;
    setViewAllDepartments(newValue);
    if (user && currentCompany) {
      localStorage.setItem(storageKey, JSON.stringify(newValue));
    }
  };

  return {
    viewAllDepartments: viewAllDepartments && canViewAllDepartments,
    toggleViewPreference,
    canViewAllDepartments
  };
};
