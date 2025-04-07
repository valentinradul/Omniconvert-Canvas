
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

const CreateHypothesisPage: React.FC = () => {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { getIdeaById, addHypothesis } = useApp();

  const [idea, setIdea] = useState(getIdeaById(ideaId || ''));
  
  // Form state
  const [observation, setObservation] = useState('');
  const [observationContent, setObservationContent] = useState<ObservationContent>({
    text: '',
    imageUrls: [],
    externalUrls: []
  });
  const [initiative, setInitiative] = useState('');
  const [metric, setMetric] = useState('');
  
  // PECTI scores
  const [potential, setPotential] = useState<number>(3);
  const [ease, setEase] = useState<number>(3);
  const [cost, setCost] = useState<number>(3);
  const [time, setTime] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  
  // Calculated PECTI percentage
  const pectiPercentage = calculatePectiPercentage({
    potential: potential as 1 | 2 | 3 | 4 | 5,
    ease: ease as 1 | 2 | 3 | 4 | 5,
    cost: cost as 1 | 2 | 3 | 4 | 5,
    time: time as 1 | 2 | 3 | 4 | 5,
    impact: impact as 1 | 2 | 3 | 4 | 5,
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
    setObservationContent(prev => ({
      ...prev,
      text: observation
    }));
  }, [observation]);
  
  if (!idea) {
    return <div>Loading...</div>;
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!observation || !initiative || !metric) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const newHypothesis = {
        ideaId: idea.id,
        observation,
        observationContent,
        initiative,
        metric,
        pectiScore: {
          potential: potential as 1 | 2 | 3 | 4 | 5,
          ease: ease as 1 | 2 | 3 | 4 | 5,
          cost: cost as 1 | 2 | 3 | 4 | 5,
          time: time as 1 | 2 | 3 | 4 | 5,
          impact: impact as 1 | 2 | 3 | 4 | 5,
        }
      };
      
      addHypothesis(newHypothesis);
      toast.success('Hypothesis created successfully!');
      navigate('/hypotheses');
    } catch (error) {
      toast.error('Error creating hypothesis');
      console.error(error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => navigate('/ideas')} className="mb-4">
        Back to Ideas
      </Button>
      
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create Hypothesis</h1>
      
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
                value={observation} 
                onChange={(e) => setObservation(e.target.value)} 
                placeholder="E.g. that users are dropping off during onboarding"
              />
            </div>
            
            <div className="grid gap-3 border-l-4 border-l-primary/20 pl-4">
              <ObservationContentEditor 
                value={observationContent} 
                onChange={setObservationContent}
                showTextArea={false}
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="initiative">We will do</Label>
              <Textarea 
                id="initiative" 
                value={initiative} 
                onChange={(e) => setInitiative(e.target.value)} 
                placeholder="E.g. simplify the onboarding process by reducing steps"
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="metric">With the measurable goal to improve</Label>
              <Input 
                id="metric" 
                value={metric} 
                onChange={(e) => setMetric(e.target.value)} 
                placeholder="E.g. completion rate by 20%"
              />
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md">
              <p className="font-medium mb-2">Preview:</p>
              <p>
                <span className="text-muted-foreground">Because we observed</span>{' '}
                <span className="font-medium">{observation || '...'}</span>,{' '}
                <span className="text-muted-foreground">we will do</span>{' '}
                <span className="font-medium">{initiative || '...'}</span>,{' '}
                <span className="text-muted-foreground">with the measurable goal to improve</span>{' '}
                <span className="font-medium">{metric || '...'}</span>.
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
                  <Label>Potential (P): {potential}</Label>
                  <span className="text-xs text-muted-foreground">How much potential does this idea have?</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[potential]}
                  onValueChange={(value) => setPotential(value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Ease (E): {ease}</Label>
                  <span className="text-xs text-muted-foreground">How easy will it be to implement?</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[ease]}
                  onValueChange={(value) => setEase(value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Cost (C): {cost}</Label>
                  <span className="text-xs text-muted-foreground">How expensive will it be? (1 = high cost, 5 = low cost)</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[cost]}
                  onValueChange={(value) => setCost(value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Time (T): {time}</Label>
                  <span className="text-xs text-muted-foreground">How quickly can it be implemented? (1 = slow, 5 = fast)</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[time]}
                  onValueChange={(value) => setTime(value[0])}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Impact (I): {impact}</Label>
                  <span className="text-xs text-muted-foreground">How significant will the impact be?</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[impact]}
                  onValueChange={(value) => setImpact(value[0])}
                />
              </div>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Total PECTI Score: {potential + ease + cost + time + impact} / 25</p>
                  <div className={`text-sm font-bold px-2 py-1 rounded ${
                    pectiPercentage >= 70 ? 'bg-green-100 text-green-800' : 
                    pectiPercentage >= 40 ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {pectiPercentage}%
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className={`text-center rounded-md p-2 pecti-score-${potential}`}>P: {potential}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${ease}`}>E: {ease}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${cost}`}>C: {cost}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${time}`}>T: {time}</div>
                  <div className={`text-center rounded-md p-2 pecti-score-${impact}`}>I: {impact}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" size="lg">Create Hypothesis</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateHypothesisPage;
