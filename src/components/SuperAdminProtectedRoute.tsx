
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();

  // Show loading state while checking authentication or super admin status
  if (authLoading || superAdminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
        <p className="text-lg">Checking super admin access...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 max-w-md">
            You don't have permission to access the Super Admin Dashboard. 
            Only authorized super administrators can access this area.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render super admin routes if user is super admin
  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
