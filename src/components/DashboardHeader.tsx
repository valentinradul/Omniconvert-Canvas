
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.user_metadata?.full_name || 'User'}</h1>
        <p className="text-muted-foreground">
          Here's an overview of your growth experiments.
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader;
