
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

type AdminRouteProps = {
  fallbackPath?: string;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ fallbackPath = '/dashboard' }) => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
