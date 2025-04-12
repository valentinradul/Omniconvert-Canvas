
import { useState, useEffect } from 'react';
import { Experiment } from '@/types';
import { generateId, getInitialData, mergeDataFromAllSources } from '../utils/dataUtils';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const [experiments, setExperiments] = useState<Experiment[]>(() => {
    // Check for user-specific data first
    if (user?.id) {
      console.log(`Loading experiments for user: ${user.id}`);
      const userKey = `experiments_${user.id}`;
      return getInitialData(userKey, []);
    }
    
    // If no user, try to load from generic key as fallback
    console.log('No user ID found, trying to load experiments from generic key');
    const genericData = getInitialData('experiments', []);
    
    // Try to merge from multiple possible keys
    if (genericData.length === 0) {
      console.log('No experiments found in primary key, attempting to recover from all sources');
      return mergeDataFromAllSources(['experiments', 'experiment_data', 'growth_experiments'], []);
    }
    
    return genericData;
  });
  
  useEffect(() => {
    // Only save data if there's an authenticated user
    if (user?.id) {
      const userKey = `experiments_${user.id}`;
      console.log(`Saving ${experiments.length} experiments to key: ${userKey}`);
      localStorage.setItem(userKey, JSON.stringify(experiments));
    } else {
      console.log('No user ID found, skipping experiments save');
    }
  }, [experiments, user?.id]);

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

  const getExperimentByHypothesisId = (hypothesisId: string) => 
    filteredExperiments.find(e => e.hypothesisId === hypothesisId);
  
  return {
    experiments: filteredExperiments,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId
  };
};
