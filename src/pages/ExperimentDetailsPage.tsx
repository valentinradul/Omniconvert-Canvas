
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ExperimentEditDialog from '@/components/experiments/details/ExperimentEditDialog';
import ExperimentStatusCard from '@/components/experiments/details/ExperimentStatusCard';
import ExperimentMetricsCard from '@/components/experiments/details/ExperimentMetricsCard';
import HypothesisGoalCard from '@/components/experiments/details/HypothesisGoalCard';
import ExperimentNotesCard from '@/components/experiments/details/ExperimentNotesCard';
import ExperimentDocumentationCard from '@/components/experiments/details/ExperimentDocumentationCard';
import ExperimentNextStepsCard from '@/components/experiments/details/ExperimentNextStepsCard';

const ExperimentDetailsPage: React.FC = () => {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  
  const { 
    experiments, 
    getHypothesisById, 
    getIdeaById, 
    editExperiment,
    deleteExperiment,
    getAllUserNames,
    getExperimentDuration
  } = useApp();
  
  const experiment = experiments.find(e => e.id === experimentId);
  const hypothesis = experiment ? getHypothesisById(experiment.hypothesisId) : undefined;
  const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const allUsers = getAllUserNames();
  
  if (!experiment || !hypothesis || !idea) {
    return <div>Loading...</div>;
  }

  const handleDelete = () => {
    deleteExperiment(experiment.id);
    navigate('/experiments');
    toast.success('Experiment deleted successfully!');
  };

  const duration = getExperimentDuration(experiment);
  const responsible = experiment.responsibleUserId ? 
    allUsers.find(u => u.id === experiment.responsibleUserId)?.name : undefined;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => navigate('/experiments')} className="mb-4">
            Back to Experiments
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
          <p className="text-muted-foreground">
            Created on {new Date(experiment.createdAt).toLocaleDateString()}
            {responsible && ` • Responsible: ${responsible}`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExperimentEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            experiment={experiment}
            allUsers={allUsers}
            onSave={editExperiment}
          />
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            Edit Experiment
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Experiment</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this
                  experiment and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <ExperimentStatusCard experiment={experiment} duration={duration} />
      
      {/* Financial metrics card */}
      <ExperimentMetricsCard 
        totalCost={experiment.totalCost} 
        totalReturn={experiment.totalReturn} 
      />
      
      <HypothesisGoalCard hypothesis={hypothesis} />
      
      <ExperimentNotesCard notes={experiment.notes} />
      
      {/* Documentation & References Card */}
      <ExperimentDocumentationCard observationContent={experiment.observationContent} />
      
      <ExperimentNextStepsCard status={experiment.status} />
    </div>
  );
};

export default ExperimentDetailsPage;
