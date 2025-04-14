
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Loader2 } from 'lucide-react';
import CreateCompanyDialog from './company/CreateCompanyDialog';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { currentCompany, companies, isLoading: companyLoading } = useCompany();
  const location = useLocation();
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = React.useState(false);

  // Debug authentication state
  useEffect(() => {
    console.log('Protected Route:', { 
      isAuthenticated, 
      authLoading,
      userId: user?.id || 'No user', 
      companiesCount: companies?.length || 0,
      currentCompany: currentCompany?.name || 'No company selected',
      companyLoading,
      path: location.pathname 
    });
  }, [isAuthenticated, authLoading, user, currentCompany, companies, companyLoading, location.pathname]);

  // Show loading state while checking authentication or company data
  if (authLoading) {
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

  // If authenticated but company data is still loading
  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Loading company data...</p>
      </div>
    );
  }

  // If user has no companies, show create company dialog
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
          <p className="text-muted-foreground mb-6">
            You need to create a company to use the application.
          </p>
        </div>
        <CreateCompanyDialog 
          open={true} 
          onClose={() => {}} // Empty function as we want to force company creation
        />
      </div>
    );
  }

  // If user has companies but none selected
  if (!currentCompany) {
    console.log('No company selected, rendering company selector');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Select a Company</h1>
          <p className="text-muted-foreground mb-6">
            Please select a company to continue.
          </p>
        </div>
        {/* Display company selector here */}
      </div>
    );
  }

  // Render children routes if authenticated and company is selected
  console.log('Authenticated with company, rendering outlet');
  return <Outlet />;
};

export default ProtectedRoute;
