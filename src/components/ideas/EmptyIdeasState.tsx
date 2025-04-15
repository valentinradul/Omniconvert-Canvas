
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyIdeasStateProps {
  onAddIdeaClick: () => void;
}

const EmptyIdeasState: React.FC<EmptyIdeasStateProps> = ({ onAddIdeaClick }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Growth Ideas Yet</CardTitle>
        <CardDescription>Create your first growth idea to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Growth ideas are the foundation of your experiments. Start by adding a new idea!</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onAddIdeaClick}>Add Your First Idea</Button>
      </CardFooter>
    </Card>
  );
};

export default EmptyIdeasState;
