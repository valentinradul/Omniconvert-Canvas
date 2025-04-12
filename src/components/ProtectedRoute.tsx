
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { isLoading: appDataLoading } = useApp();
  const location = useLocation();
  const isLoading = authLoading || appDataLoading;

  // Debug authentication state
  useEffect(() => {
    console.log('Protected Route:', { 
      isAuthenticated, 
      authLoading,
      appDataLoading,
      user: user?.id ? { id: user.id, email: user.email } : 'No user',
      path: location.pathname 
    });
  }, [isAuthenticated, authLoading, appDataLoading, location.pathname, user]);

  // Show loading state while checking authentication or loading app data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-24"></div>
          <p className="mt-4 text-gray-500">
            {authLoading ? "Verifying authentication..." : "Loading your data..."}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    toast.error('Please log in to access this page');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render children routes if authenticated
  console.log('Authenticated, rendering outlet');
  return <Outlet />;
};

export default ProtectedRoute;
