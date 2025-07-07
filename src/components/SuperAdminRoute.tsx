
import React from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Shield } from 'lucide-react';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { isSuperAdmin, isLoading } = useSuperAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have super admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
