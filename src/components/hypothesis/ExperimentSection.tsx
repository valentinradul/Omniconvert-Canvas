
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Experiment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExperimentSectionProps {
  experiment: Experiment | undefined;
  hypothesisId: string;
}

const ExperimentSection: React.FC<ExperimentSectionProps> = ({
  experiment,
  hypothesisId
}) => {
  const navigate = useNavigate();
  
  const createExperiment = () => {
    navigate(`/create-experiment/${hypothesisId}`);
  };

  return (
    <>
      {experiment ? (
        <Card>
          <CardHeader>
            <CardTitle>Experiment</CardTitle>
            <CardDescription>
              This hypothesis has an associated experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Status: {experiment.status}</p>
                <p className="text-muted-foreground">
                  {experiment.startDate ? `Started: ${new Date(experiment.startDate).toLocaleDateString()}` : 'Not started yet'}
                </p>
              </div>
              <Button onClick={() => navigate(`/experiment-details/${experiment.id}`)}>
                View Experiment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-xl font-medium">No experiment yet</h3>
          <p className="text-muted-foreground mb-4">Create an experiment to test this hypothesis</p>
          <Button onClick={createExperiment}>Create Experiment</Button>
        </div>
      )}
    </>
  );
};

export default ExperimentSection;
