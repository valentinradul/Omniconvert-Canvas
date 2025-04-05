import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_STATUSES, ExperimentStatus, ObservationContent } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ObservationContentEditor from '@/components/ObservationContentEditor';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import { useConfetti } from '@/context/ConfettiContext';

const CreateExperimentPage: React.FC = () => {
  const { hypothesisId } = useParams();
  const navigate = useNavigate();
  const { getHypothesisById, getIdeaById, addExperiment } = useApp();
  const { triggerConfetti } = useConfetti();

  const [hypothesis, setHypothesis] = useState(getHypothesisById(hypothesisId || ''));
  const [idea, setIdea] = useState(hypothesis ? getIdeaById(hypothesis.ideaId) : undefined);
  
  // Form state
  const [status, setStatus] = useState<ExperimentStatus>('Planned');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [observationContent, setObservationContent] = useState<ObservationContent>({
    text: '',
    imageUrls: [],
    externalUrls: []
  });
  
  useEffect(() => {
    const currentHypothesis = getHypothesisById(hypothesisId || '');
    setHypothesis(currentHypothesis);
    
    if (currentHypothesis) {
      setIdea(getIdeaById(currentHypothesis.ideaId));
    } else {
      navigate('/hypotheses');
    }
  }, [hypothesisId, getHypothesisById, getIdeaById, navigate]);
  
  if (!hypothesis || !idea) {
    return <div>Loading...</div>;
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!status) {
      toast.error('Please select a status');
      return;
    }
    
    // If end date is set, it must be after start date
    if (startDate && endDate && endDate < startDate) {
      toast.error('End date must be after start date');
      return;
    }
    
    try {
      const newExperiment = {
        hypothesisId: hypothesis.id,
        status,
        startDate,
        endDate,
        notes,
        observationContent
      };
      
      addExperiment(newExperiment);
      
      // Trigger confetti when experiment is created
      triggerConfetti();
      
      toast.success('Experiment created successfully!');
      navigate('/experiments');
    } catch (error) {
      toast.error('Error creating experiment');
      console.error(error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => navigate('/hypotheses')} className="mb-4">
        Back to Hypotheses
      </Button>
      
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create Experiment</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Based on Hypothesis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="font-medium">{idea.title}</p>
            <p><span className="text-muted-foreground">Because we observed:</span> {hypothesis.observation}</p>
            <p><span className="text-muted-foreground">We will do:</span> {hypothesis.initiative}</p>
            <p><span className="text-muted-foreground">With the goal to improve:</span> {hypothesis.metric}</p>
            
            {hypothesis.pectiScore && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">PECTI Score:</p>
                <PectiScoreDisplay pecti={hypothesis.pectiScore} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Experiment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value) => setStatus(value as ExperimentStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ALL_STATUSES.map(stat => (
                      <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Add any details about how the experiment will be conducted"
              />
            </div>
            
            <div className="grid gap-3 border-t border-border pt-4 mt-4">
              <Label>Documentation & References</Label>
              <ObservationContentEditor 
                value={observationContent} 
                onChange={setObservationContent} 
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" size="lg">Create Experiment</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateExperimentPage;
