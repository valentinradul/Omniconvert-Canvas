
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

type AdminRouteProps = {
  fallbackPath?: string;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ fallbackPath = '/dashboard' }) => {
  const { isAdmin, isLoading } = useUserRole();
  const location = useLocation();
  
  // Show loading state while checking admin status
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // If not admin, redirect to fallback
  if (!isAdmin) {
    console.log('Not an admin, redirecting from', location.pathname);
    return <Navigate to={fallbackPath} replace />;
  }
  
  // User is admin, render outlet
  console.log('Admin access granted to', location.pathname);
  return <Outlet />;
};

export default AdminRoute;
