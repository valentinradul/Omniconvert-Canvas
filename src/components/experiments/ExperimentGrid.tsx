
import React from 'react';
import ExperimentCard from './ExperimentCard';
import { Experiment, Hypothesis, GrowthIdea } from '@/types';

interface ExperimentGridProps {
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

const ExperimentGrid: React.FC<ExperimentGridProps> = ({
  experiments,
  getHypothesisById,
  getIdeaById,
  getAllUserNames,
  getExperimentDuration,
}) => {
  const allUsers = getAllUserNames();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {experiments.map(experiment => {
        const hypothesis = getHypothesisById(experiment.hypothesisId);
        const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
        const duration = getExperimentDuration(experiment);
        const responsible = experiment.responsibleUserId ? 
          allUsers.find(u => u.id === experiment.responsibleUserId)?.name : undefined;
        
        return (
          <ExperimentCard
            key={experiment.id}
            experiment={experiment}
            hypothesis={hypothesis}
            idea={idea}
            responsible={responsible}
            duration={duration}
          />
        );
      })}
    </div>
  );
};

export default ExperimentGrid;
