
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { ObservationContent, calculatePectiPercentage } from '@/types';
import ObservationContentEditor from '@/components/ObservationContentEditor';
import DraftIndicator from '@/components/DraftIndicator';
import { useDraftState } from '@/hooks/useDraftState';

const CreateHypothesisPage: React.FC = () => {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { getIdeaById, addHypothesis } = useApp();

  const [idea, setIdea] = useState(getIdeaById(ideaId || ''));
  
  const defaultValues = {
    observation: '',
    observationContent: {
      text: '',
      imageUrls: [],
      externalUrls: []
    } as ObservationContent,
    initiative: '',
    metric: '',
    potential: 3,
    ease: 3,
    cost: 3,
    time: 3,
    impact: 3
  };

  const {
    formData,
    hasSavedDraft,
    updateField,
    clearDraft,
    saveDraft,
    clearDraftOnSubmit
  } = useDraftState({
    storageKey: `hypothesis-draft-${ideaId}`,
    defaultValues
  });
  
  // Calculated PECTI percentage
  const pectiPercentage = calculatePectiPercentage({
    potential: formData.potential as 1 | 2 | 3 | 4 | 5,
    ease: formData.ease as 1 | 2 | 3 | 4 | 5,
    cost: formData.cost as 1 | 2 | 3 | 4 | 5,
    time: formData.time as 1 | 2 | 3 | 4 | 5,
    impact: formData.impact as 1 | 2 | 3 | 4 | 5,
  });
  
  useEffect(() => {
    const currentIdea = getIdeaById(ideaId || '');
    setIdea(currentIdea);
    
    if (!currentIdea) {
      navigate('/ideas');
    }
  }, [ideaId, getIdeaById, navigate]);

  useEffect(() => {
    // Sync regular observation text with observationContent.text
    updateField('observationContent', {
      ...formData.observationContent,
      text: formData.observation
    });
  }, [formData.observation]);
  
  if (!idea) {
    return <div>Loading...</div>;
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.observation || !formData.initiative || !formData.metric) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const newHypothesis = {
        ideaId: idea.id,
        observation: formData.observation,
        observationContent: formData.observationContent,
        initiative: formData.initiative,
        metric: formData.metric,
        pectiScore: {
          potential: formData.potential as 1 | 2 | 3 | 4 | 5,
          ease: formData.ease as 1 | 2 | 3 | 4 | 5,
          cost: formData.cost as 1 | 2 | 3 | 4 | 5,
          time: formData.time as 1 | 2 | 3 | 4 | 5,
          impact: formData.impact as 1 | 2 | 3 | 4 | 5,
        }
      };
      
      addHypothesis(newHypothesis);
      
      // Clear the saved draft after successful submission
      clearDraftOnSubmit();
      
      toast.success('Hypothesis created successfully!');
      navigate('/hypotheses');
    } catch (error) {
      toast.error('Error creating hypothesis');
      console.error(error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={() => navigate('/ideas')}>
          Back to Ideas
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create Hypothesis</h1>
      
      <DraftIndicator
        hasSavedDraft={hasSavedDraft}
        onSaveDraft={saveDraft}
        onClearDraft={clearDraft}
        showButtons={false}
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Based on Idea: {idea.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{idea.description}</p>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Hypothesis Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="observation">Because we observed</Label>
              <Textarea 
                id="observation" 
                value={formData.observation} 
                onChange={(e) => updateField('observation', e.target.value)} 
                placeholder="E.g. that users are dropping off during onboarding"
              />
            </div>
            
            <div className="grid gap-3 border-l-4 border-l-primary/20 pl-4">
              <ObservationContentEditor 
                value={formData.observationContent} 
                onChange={(content) => updateField('observationContent', content)}
                showTextArea={false}
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="initiative">We will do</Label>
              <Textarea 
                id="initiative" 
                value={formData.initiative} 
                onChange={(e) => updateField('initiative', e.target.value)} 
                placeholder="E.g. simplify the onboarding process by reducing steps"
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="metric">With the measurable goal to improve</Label>
              <Input 
                id="metric" 
                value={formData.metric} 
                onChange={(e) => updateField('metric', e.target.value)} 
                placeholder="E.g. completion rate by 20%"
              />
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md">
              <p className="font-medium mb-2">Preview:</p>
              <p>
                <span className="text-muted-foreground">Because we observed</span>{' '}
                <span className="font-medium">{formData.observation || '...'}</span>,{' '}
                <span className="text-muted-foreground">we will do</span>{' '}
                <span className="font-medium">{formData.initiative || '...'}</span>,{' '}
                <span className="text-muted-foreground">with the measurable goal to improve</span>{' '}
                <span className="font-medium">{formData.metric || '...'}</span>.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>PECTI Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Potential (P): {formData.potential}</Label>
                  <span className="text-xs text-muted-foreground">How much potential does this idea have?</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[formData.potential]}
                  onValueChange={(value) => updateField('potential', value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Ease (E): {formData.ease}</Label>
                  <span className="text-xs text-muted-foreground">How easy will it be to implement?</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[formData.ease]}
                  onValueChange={(value) => updateField('ease', value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Cost (C): {formData.cost}</Label>
                  <span className="text-xs text-muted-foreground">How expensive will it be? (1 = high cost, 5 = low cost)</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[formData.cost]}
                  onValueChange={(value) => updateField('cost', value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Time (T): {formData.time}</Label>
                  <span className="text-xs text-muted-foreground">How quickly can it be implemented? (1 = slow, 5 = fast)</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[formData.time]}
                  onValueChange={(value) => updateField('time', value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Impact (I): {formData.impact}</Label>
                  <span className="text-xs text-muted-foreground">How significant will the impact be?</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[formData.impact]}
                  onValueChange={(value) => updateField('impact', value[0])}
                />
              </div>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Total PECTI Score: {formData.potential + formData.ease + formData.cost + formData.time + formData.impact} / 25</p>
                  <div className={`text-sm font-bold px-2 py-1 rounded ${
                    pectiPercentage >= 70 ? 'bg-green-100 text-green-800' : 
                    pectiPercentage >= 40 ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {pectiPercentage}%
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className={`text-center rounded-md p-2 pecti-score-${formData.potential}`}>P: {formData.potential}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${formData.ease}`}>E: {formData.ease}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${formData.cost}`}>C: {formData.cost}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${formData.time}`}>T: {formData.time}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${formData.impact}`}>I: {formData.impact}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <DraftIndicator
          hasSavedDraft={hasSavedDraft}
          onSaveDraft={saveDraft}
          onClearDraft={clearDraft}
        />
        
        <div className="flex justify-end gap-3">
          <Button type="submit" size="lg">Create Hypothesis</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateHypothesisPage;
