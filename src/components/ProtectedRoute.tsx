
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { currentCompany, companies, isLoading: companyLoading } = useCompany();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();
  const location = useLocation();

  // Debug authentication state
  useEffect(() => {
    console.log('Protected Route:', { 
      isAuthenticated, 
      authLoading,
      userId: user?.id || 'No user', 
      companiesCount: companies?.length || 0,
      currentCompany: currentCompany?.name || 'No company selected',
      companyLoading,
      isSuperAdmin,
      superAdminLoading,
      path: location.pathname 
    });
  }, [isAuthenticated, authLoading, user, currentCompany, companies, companyLoading, isSuperAdmin, superAdminLoading, location.pathname]);

  // Show loading state while checking authentication or company data
  if (authLoading || superAdminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user is super admin and trying to access regular routes, redirect to super admin
  if (isSuperAdmin && !location.pathname.startsWith('/super-admin')) {
    console.log('Super admin accessing regular route, redirecting to super admin panel');
    return <Navigate to="/super-admin" replace />;
  }

  // If authenticated but company data is still loading for non-super-admin users
  if (!isSuperAdmin && companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Loading company data...</p>
      </div>
    );
  }

  // Render children routes if authenticated (with or without company)
  console.log('Authenticated, rendering outlet');
  return <Outlet />;
};

export default ProtectedRoute;
