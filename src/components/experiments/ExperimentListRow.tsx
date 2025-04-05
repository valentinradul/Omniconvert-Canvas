
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { formatDistance } from 'date-fns';
import { Experiment, Hypothesis, GrowthIdea } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ExperimentListRowProps {
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

const ExperimentListRow: React.FC<ExperimentListRowProps> = ({
  experiment,
  hypothesis,
  idea,
  responsible,
  duration,
}) => {
  const navigate = useNavigate();
  
  return (
    <TableRow key={experiment.id}>
      <TableCell>
        <div className="font-medium">{idea?.title || 'Experiment'}</div>
        <div className="text-sm text-muted-foreground">
          Created {formatDistance(new Date(experiment.createdAt), new Date(), { addSuffix: true })}
        </div>
      </TableCell>
      <TableCell>{hypothesis?.metric || 'N/A'}</TableCell>
      <TableCell><StatusBadge status={experiment.status} /></TableCell>
      <TableCell>{responsible || 'Unassigned'}</TableCell>
      <TableCell>
        <div className="text-sm space-y-1">
          <div>In status: {duration.daysInStatus} days</div>
          <div>Running: {duration.daysRunning} days</div>
          {duration.daysRemaining !== null && (
            <div className="font-medium">Remaining: {duration.daysRemaining} days</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/experiment-details/${experiment.id}`)}
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ExperimentListRow;
