
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit, FileEdit } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import { Experiment, ExperimentStatus } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface ExperimentTableRowProps {
  experiment: Experiment;
  hypothesis: any;
  idea: any;
  statusOptions: ExperimentStatus[];
  handleStatusChange: (experimentId: string, newStatus: ExperimentStatus) => void;
}

const ExperimentTableRow: React.FC<ExperimentTableRowProps> = ({ 
  experiment, 
  hypothesis, 
  idea, 
  statusOptions, 
  handleStatusChange 
}) => {
  const navigate = useNavigate();
  const isDraft = experiment.id.startsWith('draft-');
  const responsibleName = experiment.userName || hypothesis?.userName || 'Unassigned';
  
  return (
    <TableRow key={experiment.id} className={isDraft ? 'bg-amber-50/50' : ''}>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {idea?.title || 'Experiment'}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {hypothesis?.initiative || 'No hypothesis description'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {isDraft ? (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            Draft
          </span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 p-0 flex items-center gap-1">
                <StatusBadge status={experiment.status} />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {statusOptions.map(status => (
                <DropdownMenuItem 
                  key={status}
                  className={`
                    status-dropdown-${status.toLowerCase().replace(' ', '-')}
                  `}
                  onClick={() => handleStatusChange(experiment.id, status)}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
      <TableCell>
        {hypothesis?.pectiScore ? (
          <PectiScoreDisplay 
            pecti={hypothesis.pectiScore} 
            size="sm"
          />
        ) : (
          <span className="text-muted-foreground text-sm">No score</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{responsibleName}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm space-y-1">
          <div>
            <span className="font-medium">Start:</span>{' '}
            {experiment.startDate 
              ? new Date(experiment.startDate).toLocaleDateString() 
              : 'Not set'}
          </div>
          <div>
            <span className="font-medium">End:</span>{' '}
            {experiment.endDate 
              ? new Date(experiment.endDate).toLocaleDateString() 
              : 'Not set'}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="space-x-2">
          {isDraft ? (
            <Button 
              size="sm"
              onClick={() => navigate(`/create-experiment/${hypothesis?.id}`)}
            >
              <FileEdit className="h-3.5 w-3.5 mr-1" />
              Continue Draft
            </Button>
          ) : (
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate(`/experiment-details/${experiment.id}`)}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit Experiment
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ExperimentTableRow;
