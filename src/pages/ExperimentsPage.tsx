
import React from 'react';
import { useApp } from '@/context/AppContext';
import ExperimentsTable from '@/components/experiments/ExperimentsTable';
import EmptyExperiments from '@/components/experiments/EmptyExperiments';
import { useExperimentSorting } from '@/hooks/useExperimentSorting';

const ExperimentsPage: React.FC = () => {
  const { experiments, hypotheses, getHypothesisById, getIdeaById, editExperiment } = useApp();
  
  const { 
    sortedExperiments, 
    sortField, 
    sortDirection, 
    handleSort 
  } = useExperimentSorting({ 
    experiments, 
    getHypothesisById 
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">Track your growth experiments and their results</p>
        </div>
      </div>
      
      {experiments.length === 0 ? (
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
