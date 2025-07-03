import React from 'react';
import { Navigate } from 'react-router-dom';
import CategoryManagement from '@/components/categories/CategoryManagement';
import { useCompany } from '@/context/company/CompanyContext';

const CategorySettingsPage: React.FC = () => {
  const { userCompanyRole } = useCompany();
  
  // Only allow owners and admins to access this page
  if (userCompanyRole !== 'owner' && userCompanyRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Category Settings</h1>
        <p className="text-muted-foreground">Manage growth idea categories for your company.</p>
      </div>
      
      <CategoryManagement />
    </div>
  );
};

export default CategorySettingsPage;