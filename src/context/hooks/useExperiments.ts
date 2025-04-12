
import { useState, useEffect } from 'react';
import { Experiment } from '@/types';
import { generateId, getInitialData, saveData } from '../utils/dataUtils';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const userId = user?.id;
  
  const [experiments, setExperiments] = useState<Experiment[]>(() => 
    getInitialData('experiments', [], userId)
  );
  
  useEffect(() => {
    saveData('experiments', experiments, userId);
  }, [experiments, userId]);

  const filteredExperiments = experiments.filter(experiment => 
    !currentCompany || experiment.companyId === currentCompany.id || !experiment.companyId
  );
  
  const addExperiment = (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    setExperiments([
      ...experiments,
      {
        ...experiment,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        userId: experiment.userId || user?.id,
        userName: experiment.userName || user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editExperiment = (id: string, experimentUpdates: Partial<Experiment>) => {
    setExperiments(experiments.map(experiment => 
      experiment.id === id ? { ...experiment, ...experimentUpdates, updatedAt: new Date() } : experiment
    ));
  };
  
  const deleteExperiment = (id: string) => {
    setExperiments(experiments.filter(experiment => experiment.id !== id));
  };

  const getExperimentByHypothesisId = (hypothesisId: string) => filteredExperiments.find(e => e.hypothesisId === hypothesisId);
  
  return {
    experiments: filteredExperiments,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId
  };
};
