
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ALL_STATUSES, ExperimentStatus, Experiment } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ObservationContentEditor from '@/components/ObservationContentEditor';

interface TeamMember {
  id: string;
  name: string;
}

interface ExperimentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment: Experiment;
  allUsers: TeamMember[];
  onSave: (id: string, updates: Partial<Experiment>) => void;
}

const ExperimentEditDialog: React.FC<ExperimentEditDialogProps> = ({
  open,
  onOpenChange,
  experiment,
  allUsers,
  onSave
}) => {
  const [status, setStatus] = useState<ExperimentStatus>(experiment.status);
  const [startDate, setStartDate] = useState<Date | null>(experiment.startDate);
  const [endDate, setEndDate] = useState<Date | null>(experiment.endDate);
  const [notes, setNotes] = useState(experiment.notes || '');
  const [responsibleUserId, setResponsibleUserId] = useState<string | undefined>(experiment.responsibleUserId);
  const [totalCost, setTotalCost] = useState<string>(experiment.totalCost?.toString() || '');
  const [totalReturn, setTotalReturn] = useState<string>(experiment.totalReturn?.toString() || '');
  const [observationContent, setObservationContent] = useState(experiment.observationContent || { text: '', imageUrls: [], externalUrls: [] });

  // Calculate ROI when both cost and return are available
  const calculateROI = () => {
    const cost = parseFloat(totalCost);
    const returnValue = parseFloat(totalReturn);

    if (isNaN(cost) || isNaN(returnValue) || cost === 0) {
      return null;
    }

    return ((returnValue - cost) / cost * 100).toFixed(2);
  };

  const roi = calculateROI();

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
      const parsedCost = totalCost ? parseFloat(totalCost) : undefined;
      const parsedReturn = totalReturn ? parseFloat(totalReturn) : undefined;

      onSave(experiment.id, {
        status,
        startDate,
        endDate,
        notes,
        responsibleUserId,
        totalCost: parsedCost,
        totalReturn: parsedReturn,
        observationContent
      });
      
      onOpenChange(false);
      toast.success('Experiment updated successfully!');
    } catch (error) {
      toast.error('Error updating experiment');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Experiment</DialogTitle>
            <DialogDescription>
              Update your experiment details and status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
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
            
            <div className="grid gap-3">
              <Label htmlFor="responsible">Responsible Person</Label>
              <Select
                value={responsibleUserId}
                onValueChange={setResponsibleUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to someone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
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
                      {startDate ? format(startDate, "PPP") : "No start date"}
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
                      {endDate ? format(endDate, "PPP") : "No end date"}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost (optional)</Label>
                <Input 
                  id="totalCost"
                  type="number"
                  step="0.01"
                  value={totalCost} 
                  onChange={(e) => setTotalCost(e.target.value)} 
                  placeholder="Enter total cost" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalReturn">Total Return (optional)</Label>
                <Input 
                  id="totalReturn"
                  type="number"
                  step="0.01"
                  value={totalReturn} 
                  onChange={(e) => setTotalReturn(e.target.value)} 
                  placeholder="Enter total return" 
                />
              </div>

              <div className="space-y-2">
                <Label>ROI</Label>
                <Input 
                  readOnly
                  value={roi ? `${roi}%` : "N/A"}
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Add any details about the experiment"
                rows={3}
              />
            </div>
            
            <div className="grid gap-3">
              <Label>Documentation & References</Label>
              <ObservationContentEditor 
                value={observationContent} 
                onChange={setObservationContent} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExperimentEditDialog;
