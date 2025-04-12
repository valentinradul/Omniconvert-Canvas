
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PECTI, PECTIWeights } from '@/types';
import HypothesisHeader from '@/components/hypothesis/HypothesisHeader';
import HypothesisStatement from '@/components/hypothesis/HypothesisStatement';
import PectiScoreTab from '@/components/hypothesis/PectiScoreTab';
import WeightsTab from '@/components/hypothesis/WeightsTab';
import ExperimentSection from '@/components/hypothesis/ExperimentSection';

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
  const [isEditing, setIsEditing] = useState(false);
  
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
    updatePectiWeights({ 
      potential: 2.5, 
      ease: 1.5, 
      cost: 1.5, 
      time: 1.0, 
      impact: 3.5 
    });
    setLocalWeights({ 
      potential: 2.5, 
      ease: 1.5, 
      cost: 1.5, 
      time: 1.0, 
      impact: 3.5 
    });
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

  const handleSaveEdits = (updatedHypothesis: Partial<typeof hypothesis>) => {
    if (hypothesis) {
      editHypothesis(hypothesis.id, updatedHypothesis);
      setHypothesis(getHypothesisById(hypothesisId || ''));
      setIsEditing(false);
    }
  };
  
  if (!hypothesis || !idea) {
    return <div>Loading...</div>;
  }
  
  const handleDelete = () => {
    deleteHypothesis(hypothesis.id);
    navigate('/hypotheses');
    toast.success('Hypothesis deleted successfully!');
  };
  
  return (
    <div className="space-y-6">
      <HypothesisHeader
        ideaTitle={idea.title}
        hypothesisCreatedAt={hypothesis.createdAt}
        onDelete={handleDelete}
        onEditClick={() => setIsEditing(true)}
        isEditing={isEditing}
      />
      
      <HypothesisStatement
        hypothesis={hypothesis}
        isEditing={isEditing}
        onSave={handleSaveEdits}
        onCancel={() => setIsEditing(false)}
      />
      
      {!isEditing && (
        <Tabs defaultValue="score">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="score">PECTI Score</TabsTrigger>
            <TabsTrigger value="weights">Criteria Weights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="score" className="p-1">
            <PectiScoreTab
              pectiScore={hypothesis.pectiScore}
              weights={pectiWeights}
              editingPecti={editingPecti}
              tempPecti={tempPecti}
              localWeights={localWeights}
              onEditPectiClick={() => setEditingPecti(true)}
              onPectiChange={handlePectiChange}
              onLocalWeightChange={handleLocalWeightChange}
              onSavePecti={handleSavePecti}
              onCancelPecti={handleCancelPecti}
            />
          </TabsContent>
          
          <TabsContent value="weights" className="p-1">
            <WeightsTab
              weights={pectiWeights}
              onWeightChange={handleWeightChange}
              onSaveWeights={handleSaveWeights}
              onResetWeights={handleResetWeights}
              onUpdateAllHypotheses={handleUpdateAllHypotheses}
            />
          </TabsContent>
        </Tabs>
      )}
      
      {!isEditing && (
        <ExperimentSection
          experiment={experiment}
          hypothesisId={hypothesis.id}
        />
      )}
    </div>
  );
};

export default HypothesisDetailsPage;
