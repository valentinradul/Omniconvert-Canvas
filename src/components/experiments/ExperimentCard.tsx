
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import { Experiment, Hypothesis, GrowthIdea } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ExperimentCardProps {
  experiment: Experiment;
  hypothesis?: Hypothesis;
  idea?: GrowthIdea;
  responsible?: string;
  duration: {
    daysRunning: number;
    daysRemaining: number | null;
    daysInStatus: number;
    daysTotal: number | null;
  };
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  hypothesis,
  idea,
  responsible,
  duration,
}) => {
  const navigate = useNavigate();
  
  return (
    <Card key={experiment.id} className="relative">
      <div className="absolute top-3 right-3">
        <StatusBadge status={experiment.status} />
      </div>
      <CardHeader>
        <CardTitle className="pr-24">
          {idea?.title || 'Experiment'}
        </CardTitle>
        <CardDescription>
          Created {format(new Date(experiment.createdAt), 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hypothesis && (
          <p className="text-sm">
            <span className="font-medium">Goal:</span> {hypothesis.metric}
          </p>
        )}
        
        {responsible && (
          <p className="text-sm">
            <span className="font-medium">Responsible:</span> {responsible}
          </p>
        )}
        
        <div className="space-y-1">
          <div className="text-sm flex justify-between">
            <span className="font-medium">Time in current status:</span>
            <span>{duration.daysInStatus} days</span>
          </div>
          
          <div className="text-sm flex justify-between">
            <span className="font-medium">Running for:</span>
            <span>{duration.daysRunning} days</span>
          </div>
          
          {duration.daysRemaining !== null && (
            <div className="text-sm flex justify-between">
              <span className="font-medium">Days remaining:</span>
              <span className="font-bold">{duration.daysRemaining} days</span>
            </div>
          )}
          
          {duration.daysTotal !== null && (
            <div className="text-sm flex justify-between">
              <span className="font-medium">Total duration:</span>
              <span>{duration.daysTotal} days</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-medium">Start Date</p>
            <p className="text-muted-foreground">
              {experiment.startDate 
                ? format(new Date(experiment.startDate), 'MMM d, yyyy') 
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="font-medium">End Date</p>
            <p className="text-muted-foreground">
              {experiment.endDate 
                ? format(new Date(experiment.endDate), 'MMM d, yyyy') 
                : 'Not set'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => navigate(`/experiment-details/${experiment.id}`)}
          className="w-full"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExperimentCard;
