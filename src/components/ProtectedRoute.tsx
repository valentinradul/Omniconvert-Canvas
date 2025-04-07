
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Debug authentication state
  useEffect(() => {
    console.log('Protected Route:', { 
      isAuthenticated, 
      isLoading, 
      path: location.pathname 
    });
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
