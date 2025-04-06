
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import LoadingCard from '@/components/categories/LoadingCard';
import AccessDeniedCard from '@/components/categories/AccessDeniedCard';
import { toast } from '@/components/ui/use-toast';

type AdminRouteProps = {
  fallbackPath?: string;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ fallbackPath = '/dashboard' }) => {
  const { isAdmin, isLoading, error, refetch, roles } = useUserRole();
  const { user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!isLoading) {
      console.log('Admin route check:', {
        path: location.pathname,
        userId: user?.id,
        email: user?.email,
        isAdmin,
        roles,
        isLoading,
        hasError: !!error
      });
    }
  }, [isLoading, isAdmin, error, location.pathname, user, roles]);
  
  // Show loading state while checking admin status
  if (isLoading) {
    return <LoadingCard />;
  }
  
  // Handle error state
  if (error) {
    console.error('Error checking admin status:', error);
    return (
      <div className="space-y-4">
        <AccessDeniedCard />
        <div className="flex justify-center">
          <button 
            onClick={() => {
              toast({
                title: "Retrying...",
                description: "Attempting to check permissions again."
              });
              refetch();
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // If not admin, redirect to fallback
  if (!isAdmin) {
    console.log('Not an admin, redirecting from', location.pathname, 'to', fallbackPath, 'Roles:', roles);
    return <Navigate to={fallbackPath} replace state={{ from: location, accessDenied: true }} />;
  }
  
  // User is admin, render outlet
  console.log('Admin access granted to', location.pathname);
  return <Outlet />;
};

export default AdminRoute;
