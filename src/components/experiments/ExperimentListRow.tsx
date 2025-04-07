
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { ExperimentStatus } from '@/types';

interface ExperimentListRowProps {
  experiment: {
    id: string;
    status: ExperimentStatus;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
  };
  hypothesis?: {
    initiative: string;
    metric: string;
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

const ExperimentListRow: React.FC<ExperimentListRowProps> = ({
  experiment,
  hypothesis,
  idea,
  responsible,
  duration
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/experiment-details/${experiment.id}`);
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleClick}
    >
      <TableCell>
        <div className="font-medium">{idea?.title || "Unknown"}</div>
        <div className="text-xs text-muted-foreground">
          {experiment.notes && experiment.notes.length > 60 ? 
            `${experiment.notes.substring(0, 60)}...` : 
            experiment.notes || "No notes"}
        </div>
      </TableCell>
      <TableCell>
        {hypothesis ? (
          <div>
            <div className="mb-1">{hypothesis.initiative}</div>
            <div className="text-xs text-muted-foreground">{hypothesis.metric}</div>
          </div>
        ) : (
          "Unknown"
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={experiment.status} />
      </TableCell>
      <TableCell>{responsible || "Unassigned"}</TableCell>
      <TableCell>
        <div className="text-sm">
          {duration.daysRunning} days running
          {duration.daysRemaining !== null && (
            <span className="text-xs block text-muted-foreground">
              {duration.daysRemaining} days remaining
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/experiment-details/${experiment.id}`);
          }}
        >
          View Details
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ExperimentListRow;
