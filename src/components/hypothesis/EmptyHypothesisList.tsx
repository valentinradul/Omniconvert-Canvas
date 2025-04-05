
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmptyHypothesisList: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h3 className="text-xl font-medium">No hypotheses found</h3>
      <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new hypothesis</p>
      <Button onClick={() => navigate('/ideas')}>View Ideas</Button>
    </div>
  );
};

export default EmptyHypothesisList;
