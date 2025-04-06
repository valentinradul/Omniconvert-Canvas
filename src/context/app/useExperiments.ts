
import { useState, useEffect } from 'react';
import { Experiment } from '@/types';
import { generateId, getInitialData, calculateExperimentDuration } from './utils';

export const useExperiments = (
  activeCompany: { id: string } | null, 
  user: { id?: string; user_metadata?: { full_name?: string }; email?: string } | null
) => {
  const [experiments, setExperiments] = useState<Experiment[]>(() => 
    getInitialData('experiments', [])
  );

  useEffect(() => {
    localStorage.setItem('experiments', JSON.stringify(experiments));
  }, [experiments]);

  const addExperiment = (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt'>) => {
    const now = new Date();
    setExperiments([
      ...experiments,
      {
        ...experiment,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        statusUpdatedAt: now,
        userId: experiment.userId || user?.id,
        userName: experiment.userName || user?.user_metadata?.full_name || user?.email,
        company_id: activeCompany?.id
      }
    ]);
  };
  
  const editExperiment = (id: string, experimentUpdates: Partial<Experiment>) => {
    const now = new Date();
    
    setExperiments(experiments.map(experiment => {
      if (experiment.id !== id) return experiment;
      
      // If status is changing, update statusUpdatedAt
      const statusIsChanging = experimentUpdates.status && experiment.status !== experimentUpdates.status;
      
      return {
        ...experiment,
        ...experimentUpdates,
        updatedAt: now,
        statusUpdatedAt: statusIsChanging ? now : experiment.statusUpdatedAt || experiment.createdAt
      };
    }));
  };
  
  const deleteExperiment = (id: string) => {
    setExperiments(experiments.filter(experiment => experiment.id !== id));
  };

  const getExperimentByHypothesisId = (hypothesisId: string) => 
    experiments.find(e => e.hypothesisId === hypothesisId);

  const getExperimentDuration = (experiment: Experiment) => {
    return calculateExperimentDuration(experiment);
  };

  return {
    experiments,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId,
    getExperimentDuration
  };
};
