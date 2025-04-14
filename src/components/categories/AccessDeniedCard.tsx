
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Link } from 'react-router-dom';

const AccessDeniedCard: React.FC = () => {
  const { user } = useAuth();
  const { roles, refetch } = useUserRole();
  
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to access this area.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Only administrators can access this section. Please contact your team administrator for assistance.</p>
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">Debug Information:</p>
            <p>User: {user?.email || 'Not logged in'}</p>
            <p>User ID: {user?.id || 'Unknown'}</p>
            <p>Current Roles: {roles?.length ? roles.join(', ') : 'No roles assigned'}</p>
            <p>Admin Required: Yes</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={refetch}>
            Refresh Permissions
          </Button>
          <Button asChild>
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccessDeniedCard;
