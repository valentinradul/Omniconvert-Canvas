
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoadingCard: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Please wait while we check your permissions.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default LoadingCard;
