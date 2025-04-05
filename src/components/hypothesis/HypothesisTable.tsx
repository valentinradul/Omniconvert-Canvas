
import React from 'react';
import { Department, Hypothesis, PECTI } from '@/types';
import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import HypothesisTableRow from './HypothesisTableRow';

interface HypothesisTableProps {
  hypotheses: Hypothesis[];
  departments: Department[];
  experiments: { hypothesisId: string }[];
  getIdeaById: (id: string) => any;
  calculatePectiPercentage: (pecti: PECTI) => number;
  onSortChange: (field: 'pectiScore' | 'createdAt') => void;
  onEditPecti: (hypothesisId: string, pectiValues: PECTI) => void;
  sortField: 'pectiScore' | 'createdAt';
}

const HypothesisTable: React.FC<HypothesisTableProps> = ({
  hypotheses,
  departments,
  experiments,
  getIdeaById,
  calculatePectiPercentage,
  onSortChange,
  onEditPecti,
  sortField
}) => {
  const handleEditPecti = (hypothesis: Hypothesis, editedPecti: PECTI) => {
    onEditPecti(hypothesis.id, editedPecti);
  };

  return (
    <Table className="border rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Hypothesis</TableHead>
          <TableHead>Related Idea</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="cursor-pointer" onClick={() => onSortChange('pectiScore')}>
            <div className="flex items-center">
              PECTI Score
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hypotheses.map((hypothesis) => {
          const idea = getIdeaById(hypothesis.ideaId);
          const hasExperiment = experiments.some(e => e.hypothesisId === hypothesis.id);
          const department = departments.find(d => d.id === idea?.departmentId);
          
          return (
            <HypothesisTableRow
              key={hypothesis.id}
              hypothesis={hypothesis}
              idea={idea}
              department={department}
              hasExperiment={hasExperiment}
              calculatePectiPercentage={calculatePectiPercentage}
              onEditPecti={handleEditPecti}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};

export default HypothesisTable;
