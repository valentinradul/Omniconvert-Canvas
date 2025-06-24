import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import ExperimentsTable from '@/components/experiments/ExperimentsTable';
import EmptyExperiments from '@/components/experiments/EmptyExperiments';
import { useExperimentSorting } from '@/hooks/useExperimentSorting';
import { Experiment } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const navigate = useNavigate();
  const { experiments, hypotheses, getHypothesisById, getIdeaById, editExperiment } = useApp();
  const [draftExperiments, setDraftExperiments] = useState<Experiment[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
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

  // Filter hypotheses that don't already have experiments
  const availableHypotheses = hypotheses.filter(hypothesis => 
    !allExperiments.some(experiment => experiment.hypothesisId === hypothesis.id)
  );

  const handleCreateExperiment = (hypothesisId: string) => {
    setIsCreateDialogOpen(false);
    navigate(`/create-experiment/${hypothesisId}`);
  };
  
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
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Experiment</DialogTitle>
              <DialogDescription>
                Select a hypothesis to create an experiment for. Only hypotheses without existing experiments are shown.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {availableHypotheses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hypotheses available for experiments. All hypotheses already have experiments or there are no hypotheses created yet.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      navigate('/hypotheses');
                    }}
                  >
                    Go to Hypotheses
                  </Button>
                </div>
              ) : (
                availableHypotheses.map(hypothesis => {
                  const idea = getIdeaById(hypothesis.ideaId);
                  return (
                    <Card key={hypothesis.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => handleCreateExperiment(hypothesis.id)}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{idea?.title || 'Untitled Idea'}</CardTitle>
                        <CardDescription className="text-sm">
                          Created by {hypothesis.userName || 'Unknown'} • {hypothesis.createdAt.toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Observation:</span> {hypothesis.observation}
                          </div>
                          <div>
                            <span className="font-medium">Initiative:</span> {hypothesis.initiative}
                          </div>
                          <div>
                            <span className="font-medium">Metric:</span> {hypothesis.metric}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
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
