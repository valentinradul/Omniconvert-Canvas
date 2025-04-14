
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ExperimentListRow from './ExperimentListRow';
import { Experiment, Hypothesis, GrowthIdea } from '@/types';

interface ExperimentListProps {
  experiments: Experiment[];
  getHypothesisById: (id: string) => Hypothesis | undefined;
  getIdeaById: (id: string) => GrowthIdea | undefined;
  getAllUserNames: () => { id: string; name: string }[];
  getExperimentDuration: (experiment: Experiment) => {
    daysRunning: number;
    daysRemaining: number | null;
    daysInStatus: number;
    daysTotal: number | null;
  };
}

const ExperimentList: React.FC<ExperimentListProps> = ({
  experiments,
  getHypothesisById,
  getIdeaById,
  getAllUserNames,
  getExperimentDuration,
}) => {
  const allUsers = getAllUserNames();
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Experiment</TableHead>
            <TableHead>Goal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsible</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.map(experiment => {
            const hypothesis = getHypothesisById(experiment.hypothesisId);
            const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
            const duration = getExperimentDuration(experiment);
            const responsible = experiment.responsibleUserId ? 
              allUsers.find(u => u.id === experiment.responsibleUserId)?.name : undefined;
            
            return (
              <ExperimentListRow
                key={experiment.id}
                experiment={experiment}
                hypothesis={hypothesis}
                idea={idea}
                responsible={responsible}
                duration={duration}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExperimentList;
