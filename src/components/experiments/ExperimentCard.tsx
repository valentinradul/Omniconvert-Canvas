
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { ExperimentStatus } from '@/types';

interface ExperimentCardProps {
  experiment: {
    id: string;
    status?: ExperimentStatus; // Make status optional
    startDate?: Date;
    endDate?: Date;
    notes?: string;
  };
  hypothesis?: {
    initiative?: string; // Make initiative optional
    metric?: string; // Make metric optional
  };
  idea?: {
    title: string;
  };
  responsible?: string;
  duration: {
    daysRunning: number;
    daysRemaining: number | null;
    daysTotal: number | null;
  };
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  hypothesis,
  idea,
  responsible,
  duration
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/experiment-details/${experiment.id}`);
  };

  return (
    <Card 
      className="h-full cursor-pointer flex flex-col hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="py-4 flex-grow">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">{idea?.title || "Unknown Idea"}</h3>
          {experiment.status && <StatusBadge status={experiment.status} />}
        </div>
        
        {hypothesis && (
          <div className="mb-4">
            <p className="text-sm">{hypothesis.initiative || "No initiative"}</p>
            <p className="text-xs text-muted-foreground">{hypothesis.metric || "No metric"}</p>
          </div>
        )}
        
        <div className="text-xs space-y-1">
          {responsible && (
            <p className="text-muted-foreground">Responsible: {responsible}</p>
          )}
          <p>Running for {duration.daysRunning} days</p>
          {duration.daysRemaining !== null && (
            <p className="text-muted-foreground">{duration.daysRemaining} days remaining</p>
          )}
        </div>
        
        {experiment.notes && (
          <div className="mt-3 border-t pt-2">
            <p className="text-xs line-clamp-2">{experiment.notes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/experiment-details/${experiment.id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExperimentCard;
