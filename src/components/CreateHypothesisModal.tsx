
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GrowthIdea } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateHypothesisModalProps {
  idea: GrowthIdea;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const PectiOptions = [1, 2, 3, 4, 5];

const CreateHypothesisModal: React.FC<CreateHypothesisModalProps> = ({
  idea,
  open,
  onClose,
  onComplete
}) => {
  const { addHypothesis } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [observation, setObservation] = useState("");
  const [initiative, setInitiative] = useState("");
  const [metric, setMetric] = useState("");
  const [potential, setPotential] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [ease, setEase] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [cost, setCost] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [time, setTime] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [impact, setImpact] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!observation || !initiative || !metric) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    addHypothesis({
      ideaId: idea.id,
      observation,
      initiative,
      metric,
      pectiScore: {
        potential,
        ease,
        cost,
        time,
        impact
      },
      status: "Backlog",
      userId: user?.id,
      userName: user?.user_metadata?.full_name || user?.email
    });
    
    toast({
      title: "Hypothesis Created",
      description: "Your hypothesis has been created successfully."
    });
    
    // Reset form and close modal
    setObservation("");
    setInitiative("");
    setMetric("");
    setPotential(3);
    setEase(3);
    setCost(3);
    setTime(3);
    setImpact(3);
    
    onComplete();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Hypothesis from Idea</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="idea-title">Idea</Label>
            <Input id="idea-title" value={idea.title} readOnly className="bg-muted" />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="observation" className="flex justify-between">
              <span>Observation</span>
              <span className="text-xs text-muted-foreground">Required</span>
            </Label>
            <Textarea 
              id="observation" 
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="We observed that..."
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="initiative" className="flex justify-between">
              <span>Initiative</span>
              <span className="text-xs text-muted-foreground">Required</span>
            </Label>
            <Textarea 
              id="initiative" 
              value={initiative}
              onChange={(e) => setInitiative(e.target.value)}
              placeholder="If we..."
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="metric" className="flex justify-between">
              <span>Success Metric</span>
              <span className="text-xs text-muted-foreground">Required</span>
            </Label>
            <Input 
              id="metric" 
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              placeholder="Then we'll see..."
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label>PECTI Score</Label>
            
            <div className="grid grid-cols-5 gap-4">
              {/* Potential */}
              <div className="space-y-1">
                <Label className="text-xs">Potential</Label>
                <RadioGroup 
                  value={potential.toString()} 
                  onValueChange={(value) => setPotential(Number(value) as 1 | 2 | 3 | 4 | 5)}
                  className="flex flex-col gap-1"
                >
                  {PectiOptions.map((option) => (
                    <div key={`potential-${option}`} className="flex items-center">
                      <RadioGroupItem value={option.toString()} id={`potential-${option}`} className="size-3" />
                      <Label htmlFor={`potential-${option}`} className="ml-1 text-xs">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Ease */}
              <div className="space-y-1">
                <Label className="text-xs">Ease</Label>
                <RadioGroup 
                  value={ease.toString()} 
                  onValueChange={(value) => setEase(Number(value) as 1 | 2 | 3 | 4 | 5)}
                  className="flex flex-col gap-1"
                >
                  {PectiOptions.map((option) => (
                    <div key={`ease-${option}`} className="flex items-center">
                      <RadioGroupItem value={option.toString()} id={`ease-${option}`} className="size-3" />
                      <Label htmlFor={`ease-${option}`} className="ml-1 text-xs">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Cost */}
              <div className="space-y-1">
                <Label className="text-xs">Cost</Label>
                <RadioGroup 
                  value={cost.toString()} 
                  onValueChange={(value) => setCost(Number(value) as 1 | 2 | 3 | 4 | 5)}
                  className="flex flex-col gap-1"
                >
                  {PectiOptions.map((option) => (
                    <div key={`cost-${option}`} className="flex items-center">
                      <RadioGroupItem value={option.toString()} id={`cost-${option}`} className="size-3" />
                      <Label htmlFor={`cost-${option}`} className="ml-1 text-xs">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Time */}
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <RadioGroup 
                  value={time.toString()} 
                  onValueChange={(value) => setTime(Number(value) as 1 | 2 | 3 | 4 | 5)}
                  className="flex flex-col gap-1"
                >
                  {PectiOptions.map((option) => (
                    <div key={`time-${option}`} className="flex items-center">
                      <RadioGroupItem value={option.toString()} id={`time-${option}`} className="size-3" />
                      <Label htmlFor={`time-${option}`} className="ml-1 text-xs">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Impact */}
              <div className="space-y-1">
                <Label className="text-xs">Impact</Label>
                <RadioGroup 
                  value={impact.toString()} 
                  onValueChange={(value) => setImpact(Number(value) as 1 | 2 | 3 | 4 | 5)}
                  className="flex flex-col gap-1"
                >
                  {PectiOptions.map((option) => (
                    <div key={`impact-${option}`} className="flex items-center">
                      <RadioGroupItem value={option.toString()} id={`impact-${option}`} className="size-3" />
                      <Label htmlFor={`impact-${option}`} className="ml-1 text-xs">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Hypothesis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateHypothesisModal;
