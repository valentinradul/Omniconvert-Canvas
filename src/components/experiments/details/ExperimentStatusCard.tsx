
import React from 'react';
import { format } from 'date-fns';
import StatusBadge from '@/components/StatusBadge';
import { Experiment } from '@/types';

interface ExperimentStatusCardProps {
  experiment: Experiment;
  duration: {
    daysInStatus: number;
    daysRunning: number;
    daysRemaining: number | null;
  };
}

const ExperimentStatusCard: React.FC<ExperimentStatusCardProps> = ({
  experiment,
  duration
}) => {
  return (
    <div className="flex justify-between items-center bg-accent/50 p-4 rounded-lg">
      <div>
        <h3 className="font-medium">Status</h3>
        <StatusBadge status={experiment.status} />
      </div>
      <div>
        <h3 className="font-medium">Duration</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>In status: {duration.daysInStatus} days</div>
          <div>Running: {duration.daysRunning} days</div>
          {duration.daysRemaining !== null && (
            <div className="font-medium">Remaining: {duration.daysRemaining} days</div>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-medium">Dates</h3>
        <p className="text-sm text-muted-foreground">
          {experiment.startDate 
            ? format(new Date(experiment.startDate), 'MMM d, yyyy') 
            : 'Not started'} 
          {' — '} 
          {experiment.endDate 
            ? format(new Date(experiment.endDate), 'MMM d, yyyy') 
            : 'No end date'}
        </p>
      </div>
    </div>
  );
};

export default ExperimentStatusCard;
