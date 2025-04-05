
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Hypothesis } from '@/types';
import { toast } from 'sonner';
import HypothesisPectiEditor from './HypothesisPectiEditor';

interface HypothesisEditDialogProps {
  hypothesis: Hypothesis;
  open: boolean;
  onClose: () => void;
  onSave: (updatedHypothesis: Partial<Hypothesis>) => void;
}

const HypothesisEditDialog: React.FC<HypothesisEditDialogProps> = ({
  hypothesis,
  open,
  onClose,
  onSave
}) => {
  const [observation, setObservation] = useState(hypothesis.observation);
  const [initiative, setInitiative] = useState(hypothesis.initiative);
  const [metric, setMetric] = useState(hypothesis.metric);
  const [pectiValues, setPectiValues] = useState({...hypothesis.pectiScore});

  const handlePectiChange = (category: keyof typeof pectiValues, value: number) => {
    setPectiValues(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedHypothesis: Partial<Hypothesis> = {
      observation,
      initiative,
      metric,
      pectiScore: pectiValues
    };
    
    onSave(updatedHypothesis);
    toast.success('Hypothesis updated successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Hypothesis</DialogTitle>
            <DialogDescription>
              Update the details of your hypothesis and PECTI scores.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="observation">Observation</Label>
              <Textarea 
                id="observation" 
                value={observation} 
                onChange={(e) => setObservation(e.target.value)}
                placeholder="What did you observe?"
                rows={3}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="initiative">Initiative</Label>
              <Textarea 
                id="initiative" 
                value={initiative} 
                onChange={(e) => setInitiative(e.target.value)}
                placeholder="What will you do?"
                rows={3}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="metric">Metric</Label>
              <Textarea 
                id="metric" 
                value={metric} 
                onChange={(e) => setMetric(e.target.value)}
                placeholder="What metric will improve?"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-2 mt-2">
              <Label>PECTI Scores</Label>
              <HypothesisPectiEditor 
                pectiValues={pectiValues}
                onPectiChange={handlePectiChange}
                onSave={() => {}}
                onCancel={() => {}}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HypothesisEditDialog;
