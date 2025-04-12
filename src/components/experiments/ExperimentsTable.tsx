
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import ExperimentTableRow from './ExperimentTableRow';
import { Experiment, ExperimentStatus } from '@/types';

type SortField = 'status' | 'createdAt' | 'pectiScore';

interface ExperimentsTableProps {
  experiments: Experiment[];
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: SortField) => void;
  getHypothesisById: (id: string) => any;
  getIdeaById: (id: string) => any;
  editExperiment: (id: string, experimentUpdates: Partial<Experiment>) => void;
}

const ExperimentsTable: React.FC<ExperimentsTableProps> = ({
  experiments,
  sortField,
  sortDirection,
  handleSort,
  getHypothesisById,
  getIdeaById,
  editExperiment
}) => {
  const navigate = useNavigate();
  
  // Status options for dropdown
  const statusOptions: ExperimentStatus[] = [
    'Planned',
    'In Progress',
    'Blocked',
    'Winning',
    'Losing',
    'Inconclusive'
  ];

  const handleStatusChange = (experimentId: string, newStatus: ExperimentStatus) => {
    editExperiment(experimentId, { status: newStatus });
  };

  return (
    <Table className="border rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">Experiment/Idea</TableHead>
          <TableHead 
            className="cursor-pointer" 
            onClick={() => handleSort('status')}
          >
            <div className="flex items-center">
              Status
              {sortField === 'status' && (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer" 
            onClick={() => handleSort('pectiScore')}
          >
            <div className="flex items-center">
              PECTI Score
              {sortField === 'pectiScore' && (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </div>
          </TableHead>
          <TableHead>Responsible</TableHead>
          <TableHead 
            className="cursor-pointer" 
            onClick={() => handleSort('createdAt')}
          >
            <div className="flex items-center">
              Dates
              {sortField === 'createdAt' && (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </div>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {experiments.map(experiment => {
          const hypothesis = getHypothesisById(experiment.hypothesisId);
          const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
          
          return (
            <ExperimentTableRow
              key={experiment.id}
              experiment={experiment}
              hypothesis={hypothesis}
              idea={idea}
              statusOptions={statusOptions}
              handleStatusChange={handleStatusChange}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ExperimentsTable;
