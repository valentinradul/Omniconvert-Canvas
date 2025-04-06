
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingCard from '@/components/categories/LoadingCard';
import AccessDeniedCard from '@/components/categories/AccessDeniedCard';

type AdminRouteProps = {
  fallbackPath?: string;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ fallbackPath = '/dashboard' }) => {
  const { isAdmin, isLoading, error } = useUserRole();
  const location = useLocation();
  
  useEffect(() => {
    if (!isLoading) {
      console.log('Admin route check:', {
        path: location.pathname,
        isAdmin,
        isLoading,
        hasError: !!error
      });
    }
  }, [isLoading, isAdmin, error, location.pathname]);
  
  // Show loading state while checking admin status
  if (isLoading) {
    return <LoadingCard />;
  }
  
  // Handle error state
  if (error) {
    console.error('Error checking admin status:', error);
    return <AccessDeniedCard />;
  }
  
  // If not admin, redirect to fallback
  if (!isAdmin) {
    console.log('Not an admin, redirecting from', location.pathname, 'to', fallbackPath);
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }
  
  // User is admin, render outlet
  console.log('Admin access granted to', location.pathname);
  return <Outlet />;
};

export default AdminRoute;
