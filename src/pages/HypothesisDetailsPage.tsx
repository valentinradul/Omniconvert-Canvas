import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PectiWeightsEditor from '@/components/hypothesis/PectiWeightsEditor';
import { DEFAULT_PECTI_WEIGHTS, PECTI, PECTIWeights } from '@/types';
import HypothesisPectiEditor from '@/components/hypothesis/HypothesisPectiEditor';
import { Pencil } from 'lucide-react';

const HypothesisDetailsPage: React.FC = () => {
  const { hypothesisId } = useParams();
  const navigate = useNavigate();
  const { 
    getHypothesisById, 
    getIdeaById, 
    deleteHypothesis,
    getExperimentByHypothesisId,
    pectiWeights,
    updatePectiWeights,
    updateAllHypothesesWeights,
    editHypothesis
  } = useApp();
  
  const [hypothesis, setHypothesis] = useState(getHypothesisById(hypothesisId || ''));
  const [idea, setIdea] = useState(hypothesis ? getIdeaById(hypothesis.ideaId) : undefined);
  const [experiment, setExperiment] = useState(hypothesis ? getExperimentByHypothesisId(hypothesis.id) : undefined);
  const [editingPecti, setEditingPecti] = useState(false);
  const [tempPecti, setTempPecti] = useState<PECTI>(hypothesis ? hypothesis.pectiScore : { potential: 3, ease: 3, cost: 3, time: 3, impact: 3 });
  const [localWeights, setLocalWeights] = useState<PECTIWeights>(pectiWeights);
  
  useEffect(() => {
    const currentHypothesis = getHypothesisById(hypothesisId || '');
    setHypothesis(currentHypothesis);
    
    if (currentHypothesis) {
      setIdea(getIdeaById(currentHypothesis.ideaId));
      setExperiment(getExperimentByHypothesisId(currentHypothesis.id));
      setTempPecti(currentHypothesis.pectiScore);
    } else {
      navigate('/hypotheses');
    }
  }, [hypothesisId, getHypothesisById, getIdeaById, getExperimentByHypothesisId, navigate]);
  
  const handleWeightChange = (category: keyof typeof pectiWeights, value: number) => {
    updatePectiWeights({ [category]: value });
  };

  const handleLocalWeightChange = (category: keyof PECTIWeights, value: number) => {
    setLocalWeights(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  const handleResetWeights = () => {
    updatePectiWeights(DEFAULT_PECTI_WEIGHTS);
    setLocalWeights(DEFAULT_PECTI_WEIGHTS);
    toast.success("PECTI weights reset to default values");
  };
  
  const handleSaveWeights = () => {
    updatePectiWeights(localWeights);
    toast.success("PECTI weights saved successfully");
  };

  const handlePectiChange = (category: keyof PECTI, value: number) => {
    setTempPecti(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSavePecti = () => {
    if (hypothesis) {
      editHypothesis(hypothesis.id, { pectiScore: tempPecti });
      setHypothesis(getHypothesisById(hypothesisId || ''));
      setEditingPecti(false);
      toast.success('PECTI scores updated successfully');
    }
  };

  const handleCancelPecti = () => {
    setTempPecti(hypothesis ? hypothesis.pectiScore : { potential: 3, ease: 3, cost: 3, time: 3, impact: 3 });
    setEditingPecti(false);
  };
  
  const handleUpdateAllHypotheses = () => {
    updateAllHypothesesWeights();
    toast.success("All hypotheses now use the default weights");
  };
  
  if (!hypothesis || !idea) {
    return <div>Loading...</div>;
  }
  
  const handleDelete = () => {
    deleteHypothesis(hypothesis.id);
    navigate('/hypotheses');
    toast.success('Hypothesis deleted successfully!');
  };
  
  const createExperiment = () => {
    navigate(`/create-experiment/${hypothesis.id}`);
  };
  
  const totalPectiScore = 
    hypothesis.pectiScore.potential + 
    hypothesis.pectiScore.ease + 
    hypothesis.pectiScore.cost + 
    hypothesis.pectiScore.time + 
    hypothesis.pectiScore.impact;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => navigate('/hypotheses')} className="mb-4">
            Back to Hypotheses
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
          <p className="text-muted-foreground">
            Created on {new Date(hypothesis.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Hypothesis</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this
                  hypothesis and all associated data.
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
      
      <Card>
        <CardHeader>
          <CardTitle>Hypothesis Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              <span className="font-medium">Because we observed:</span> {hypothesis.observation}
            </p>
            <p>
              <span className="font-medium">We will do:</span> {hypothesis.initiative}
            </p>
            <p>
              <span className="font-medium">With the measurable goal to improve:</span> {hypothesis.metric}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="score">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="score">PECTI Score</TabsTrigger>
          <TabsTrigger value="weights">Criteria Weights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="score" className="p-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>PECTI Score: {totalPectiScore}/25</CardTitle>
                  <CardDescription>
                    Evaluating Potential, Ease, Cost, Time, and Impact with custom weights applied
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setEditingPecti(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingPecti ? (
                <HypothesisPectiEditor
                  pectiValues={tempPecti}
                  weights={localWeights}
                  onPectiChange={handlePectiChange}
                  onWeightsChange={handleLocalWeightChange}
                  onSave={handleSavePecti}
                  onCancel={handleCancelPecti}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <PectiScoreDisplay pecti={hypothesis.pectiScore} weights={pectiWeights} />
                  <div className="grid grid-cols-5 gap-6 mt-6 text-center">
                    <div>
                      <p className="font-medium">Potential</p>
                      <p className="text-muted-foreground text-sm">Growth potential</p>
                      <p className="text-xs text-primary">Weight: {pectiWeights.potential.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Ease</p>
                      <p className="text-muted-foreground text-sm">Implementation ease</p>
                      <p className="text-xs text-primary">Weight: {pectiWeights.ease.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cost</p>
                      <p className="text-muted-foreground text-sm">Low cost = high score</p>
                      <p className="text-xs text-primary">Weight: {pectiWeights.cost.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-muted-foreground text-sm">Quick = high score</p>
                      <p className="text-xs text-primary">Weight: {pectiWeights.time.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Impact</p>
                      <p className="text-muted-foreground text-sm">Business impact</p>
                      <p className="text-xs text-primary">Weight: {pectiWeights.impact.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weights" className="p-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Weights Settings</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={handleUpdateAllHypotheses}
                >
                  Apply Weights To All Hypotheses
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PectiWeightsEditor 
                weights={pectiWeights}
                onWeightsChange={handleWeightChange}
                onSave={handleSaveWeights}
                onReset={handleResetWeights}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {experiment ? (
        <Card>
          <CardHeader>
            <CardTitle>Experiment</CardTitle>
            <CardDescription>
              This hypothesis has an associated experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Status: {experiment.status}</p>
                <p className="text-muted-foreground">
                  {experiment.startDate ? `Started: ${new Date(experiment.startDate).toLocaleDateString()}` : 'Not started yet'}
                </p>
              </div>
              <Button onClick={() => navigate(`/experiment-details/${experiment.id}`)}>
                View Experiment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-xl font-medium">No experiment yet</h3>
          <p className="text-muted-foreground mb-4">Create an experiment to test this hypothesis</p>
          <Button onClick={createExperiment}>Create Experiment</Button>
        </div>
      )}
    </div>
  );
};

export default HypothesisDetailsPage;
