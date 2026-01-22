
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user, session } = useAuth();
  const { currentCompany, companies, isLoading: companyLoading } = useCompany();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();
  const location = useLocation();
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // Ensure minimum loading time to prevent flash redirects
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Debug authentication state
  useEffect(() => {
    console.log('Protected Route:', { 
      isAuthenticated, 
      authLoading,
      userId: user?.id || 'No user',
      hasSession: !!session,
      companiesCount: companies?.length || 0,
      currentCompany: currentCompany?.name || 'No company selected',
      companyLoading,
      isSuperAdmin,
      superAdminLoading,
      minLoadingComplete,
      path: location.pathname 
    });
  }, [isAuthenticated, authLoading, user, session, currentCompany, companies, companyLoading, isSuperAdmin, superAdminLoading, minLoadingComplete, location.pathname]);

  // Show loading state while checking authentication or company data
  // Also wait for minimum loading time to prevent flash redirects on OAuth callback
  if (authLoading || superAdminLoading || !minLoadingComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login. Session:', !!session, 'User:', !!user);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Super admins can now access regular routes - admin panel moved to account settings

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
