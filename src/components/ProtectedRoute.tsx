
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  const location = useLocation();

  // Debug authentication state
  useEffect(() => {
    console.log('Protected Route:', { 
      isAuthenticated, 
      authLoading, 
      currentCompany: currentCompany?.name || 'No company selected',
      companyLoading,
      path: location.pathname 
    });
  }, [isAuthenticated, authLoading, currentCompany, companyLoading, location.pathname]);

  // Show loading state while checking authentication or company data
  if (authLoading || companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Loading application data...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render children routes if authenticated
  console.log('Authenticated, rendering outlet');
  return <Outlet />;
};

export default ProtectedRoute;
