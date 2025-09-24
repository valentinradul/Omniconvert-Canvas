import React from 'react';
import { Navigate } from 'react-router-dom';
import CompanyManagement from '@/components/company/CompanyManagement';
import { useCompany } from '@/context/company/CompanyContext';

const CompanyManagementPage: React.FC = () => {
  const { userCompanyRole } = useCompany();
  
  // Only allow owners and admins to access this page
  if (userCompanyRole !== 'owner' && userCompanyRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Company Management</h1>
        <p className="text-muted-foreground">Manage companies where you have administrative access.</p>
      </div>
      
      <CompanyManagement />
    </div>
  );
};

export default CompanyManagementPage;