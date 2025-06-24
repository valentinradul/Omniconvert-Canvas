
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ExperimentsTable from '@/components/experiments/ExperimentsTable';
import EmptyExperiments from '@/components/experiments/EmptyExperiments';
import { useExperimentSorting } from '@/hooks/useExperimentSorting';
import { Experiment } from '@/types';

// Helper function to get all draft experiments from localStorage
const getDraftExperiments = (getHypothesisById: (id: string) => any): Experiment[] => {
  const drafts: Experiment[] = [];
  
  // Scan localStorage for draft experiments
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('create-experiment-')) {
      try {
        const draftData = JSON.parse(localStorage.getItem(key) || '{}');
        const hypothesisId = key.replace('create-experiment-', '');
        const hypothesis = getHypothesisById(hypothesisId);
        
        if (hypothesis && draftData.status) {
          // Create a draft experiment object
          const draftExperiment: Experiment = {
            id: `draft-${hypothesisId}`,
            hypothesisId: hypothesisId,
            startDate: draftData.startDate ? new Date(draftData.startDate) : null,
            endDate: draftData.endDate ? new Date(draftData.endDate) : null,
            status: draftData.status,
            notes: draftData.notes || '',
            observationContent: draftData.observationContent,
            createdAt: new Date(), // Use current time for drafts
            updatedAt: new Date(),
            userId: undefined,
            userName: 'Draft',
            companyId: undefined
          };
          
          drafts.push(draftExperiment);
        }
      } catch (error) {
        console.error('Error parsing draft experiment:', error);
      }
    }
  }
  
  return drafts;
};

const ExperimentsPage: React.FC = () => {
  const { experiments, hypotheses, getHypothesisById, getIdeaById, editExperiment } = useApp();
  const [draftExperiments, setDraftExperiments] = useState<Experiment[]>([]);
  
  // Load draft experiments on component mount and when localStorage changes
  useEffect(() => {
    const loadDrafts = () => {
      const drafts = getDraftExperiments(getHypothesisById);
      setDraftExperiments(drafts);
    };
    
    loadDrafts();
    
    // Listen for localStorage changes to update drafts
    const handleStorageChange = () => {
      loadDrafts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for focus events to catch changes made in the same tab
    window.addEventListener('focus', loadDrafts);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadDrafts);
    };
  }, [getHypothesisById]);
  
  // Combine regular experiments with draft experiments
  const allExperiments = [...experiments, ...draftExperiments];
  
  const { 
    sortedExperiments, 
    sortField, 
    sortDirection, 
    handleSort 
  } = useExperimentSorting({ 
    experiments: allExperiments, 
    getHypothesisById 
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">
            Track your growth experiments and their results
            {draftExperiments.length > 0 && (
              <span className="ml-2 text-amber-600">
                ({draftExperiments.length} draft{draftExperiments.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
      </div>
      
      {allExperiments.length === 0 ? (
        <EmptyExperiments />
      ) : (
        <ExperimentsTable
          experiments={sortedExperiments}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
          getHypothesisById={getHypothesisById}
          getIdeaById={getIdeaById}
          editExperiment={editExperiment}
        />
      )}
    </div>
  );
};

export default ExperimentsPage;
