
import { useState, useEffect } from 'react';
import { Experiment, ExperimentStatus } from '@/types';
import { generateId, getInitialData } from '../utils/dataUtils';
import { toast } from 'sonner';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const [experiments, setExperiments] = useState<Experiment[]>(() => {
    // Only load experiments if there's a user and associate with their ID
    if (user?.id) {
      console.log(`Loading experiments for user: ${user.id}`);
      const userKey = `experiments_${user.id}`;
      const loadedExperiments = getInitialData<any[]>(userKey, []);
      
      // Validate and normalize
      const validatedExperiments = loadedExperiments.map(experiment => ({
        ...experiment,
        status: experiment.status || 'Planning',
      }));
      
      console.log(`Loaded ${validatedExperiments.length} experiments for user ${user.id}`);
      return validatedExperiments;
    }
    
    console.log('No user ID found, skipping experiments fetch');
    return [];
  });
  
  useEffect(() => {
    // Only save data if there's an authenticated user
    if (user?.id) {
      const userKey = `experiments_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(experiments));
      console.log(`Saved ${experiments.length} experiments for user ${user.id}`);
    } else {
      console.log('No user ID found, skipping experiments save');
    }
  }, [experiments, user?.id]);

  const filteredExperiments = experiments.filter(experiment => 
    !currentCompany || experiment.companyId === currentCompany.id || !experiment.companyId
  );
  
  const addExperiment = (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) {
      toast.error('You must be logged in to add experiments');
      return;
    }
    
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
    
    toast.success('Experiment added successfully!');
  };
  
  const editExperiment = (id: string, experimentUpdates: Partial<Experiment>) => {
    setExperiments(experiments.map(experiment => 
      experiment.id === id ? { ...experiment, ...experimentUpdates, updatedAt: new Date() } : experiment
    ));
    
    toast.success('Experiment updated successfully');
  };
  
  const deleteExperiment = (id: string) => {
    setExperiments(experiments.filter(experiment => experiment.id !== id));
    toast.success('Experiment deleted successfully');
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
