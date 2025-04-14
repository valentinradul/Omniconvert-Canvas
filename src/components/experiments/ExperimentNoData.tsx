
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ExperimentNoData: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h3 className="text-xl font-medium">No experiments yet</h3>
      <p className="text-muted-foreground mb-4">Create experiments from your hypotheses</p>
      <Button onClick={() => navigate('/hypotheses')}>View Hypotheses</Button>
    </div>
  );
};

export default ExperimentNoData;
