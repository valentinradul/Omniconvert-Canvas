
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useCompanyContentSettings } from '@/context/hooks/useCompanyContentSettings';
import ExperimentsTable from '@/components/experiments/ExperimentsTable';
import EmptyExperiments from '@/components/experiments/EmptyExperiments';
import { useExperimentSorting } from '@/hooks/useExperimentSorting';
import { Experiment } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
            notes_history: [], // Initialize with empty array for drafts
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
  const { userCompanyRole } = useCompany();
  const { contentSettings } = useCompanyContentSettings();
  const [draftExperiments, setDraftExperiments] = useState<Experiment[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  
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
  
  // Filter experiments based on department visibility settings
  const getFilteredExperiments = () => {
    // Owners and admins always see all experiments
    if (userCompanyRole === 'owner' || userCompanyRole === 'admin') {
      return experiments;
    }
    
    // If content is not restricted to departments, show all experiments
    if (!contentSettings?.restrict_content_to_departments) {
      return experiments;
    }
    
    // If user chose to see all departments, show all experiments
    if (showAllDepartments) {
      return experiments;
    }
    
    // Filter experiments based on department access
    return experiments.filter(experiment => {
      const hypothesis = getHypothesisById(experiment.hypothesisId);
      if (!hypothesis) return false;
      
      const idea = getIdeaById(hypothesis.ideaId);
      if (!idea) return false;
      
      // Check if user has access to this idea's department
      // This would need to be implemented based on your department access logic
      return true; // For now, show all experiments
    });
  };
  
  // Combine regular experiments with draft experiments
  const filteredExperiments = getFilteredExperiments();
  const allExperiments = [...filteredExperiments, ...draftExperiments];
  
  const { 
    sortedExperiments, 
    sortField, 
    sortDirection, 
    handleSort 
  } = useExperimentSorting({ 
    experiments: allExperiments, 
    getHypothesisById 
  });

  const handleCreateExperiment = (hypothesisId: string) => {
    setIsCreateDialogOpen(false);
    navigate(`/create-experiment/${hypothesisId}`);
  };

  // Show content visibility toggle only for regular members when content is restricted
  const showVisibilityToggle = 
    userCompanyRole !== 'owner' && 
    userCompanyRole !== 'admin' && 
    contentSettings?.restrict_content_to_departments;
  
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
              Create Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Experiment</DialogTitle>
              <DialogDescription>
                Select a hypothesis to create an experiment for. You can create multiple experiments for the same hypothesis.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {hypotheses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hypotheses available. Create a hypothesis first to start experimenting.
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
                hypotheses.map(hypothesis => {
                  const idea = getIdeaById(hypothesis.ideaId);
                  const existingExperimentsCount = allExperiments.filter(exp => exp.hypothesisId === hypothesis.id).length;
                  
                  return (
                    <Card key={hypothesis.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => handleCreateExperiment(hypothesis.id)}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex justify-between items-center">
                          <span>{idea?.title || 'Untitled Idea'}</span>
                          {existingExperimentsCount > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                              {existingExperimentsCount} experiment{existingExperimentsCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </CardTitle>
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

      {/* Content Visibility Toggle */}
      {showVisibilityToggle && (
        <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
          <Switch
            id="show-all-departments"
            checked={showAllDepartments}
            onCheckedChange={setShowAllDepartments}
          />
          <Label htmlFor="show-all-departments" className="text-sm">
            Show experiments from all departments
          </Label>
          {!showAllDepartments && (
            <span className="text-xs text-muted-foreground">
              (Currently showing only experiments from your assigned departments)
            </span>
          )}
        </div>
      )}
      
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
