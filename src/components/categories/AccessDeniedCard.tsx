
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDeniedCard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          Access Denied
        </CardTitle>
        <CardDescription>
          You don't have permission to access this page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center space-y-4">
          <p className="text-muted-foreground">
            This page is restricted to administrators only.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessDeniedCard;
