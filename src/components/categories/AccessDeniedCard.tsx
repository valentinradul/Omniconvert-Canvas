
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AccessDeniedCard: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to manage categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Only administrators can manage the categories. Please contact your team administrator for assistance.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDeniedCard;
