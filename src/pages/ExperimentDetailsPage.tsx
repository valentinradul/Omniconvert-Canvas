
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_STATUSES, ExperimentStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ExperimentDetailsPage: React.FC = () => {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  
  const { 
    experiments, 
    getHypothesisById, 
    getIdeaById, 
    editExperiment,
    deleteExperiment
  } = useApp();
  
  const experiment = experiments.find(e => e.id === experimentId);
  const hypothesis = experiment ? getHypothesisById(experiment.hypothesisId) : undefined;
  const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
  
  // Form state
  const [status, setStatus] = useState<ExperimentStatus | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  useEffect(() => {
    if (experiment) {
      setStatus(experiment.status);
      setStartDate(experiment.startDate);
      setEndDate(experiment.endDate);
      setNotes(experiment.notes);
    } else {
      navigate('/experiments');
    }
  }, [experiment, navigate]);
  
  if (!experiment || !hypothesis || !idea) {
    return <div>Loading...</div>;
  }
  
  const handleEdit = (e: React.FormEvent) => {
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
      editExperiment(experiment.id, {
        status: status as ExperimentStatus,
        startDate,
        endDate,
        notes
      });
      
      setEditDialogOpen(false);
      toast.success('Experiment updated successfully!');
    } catch (error) {
      toast.error('Error updating experiment');
      console.error(error);
    }
  };
  
  const handleDelete = () => {
    deleteExperiment(experiment.id);
    navigate('/experiments');
    toast.success('Experiment deleted successfully!');
  };
  
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
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Experiment</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleEdit}>
                <DialogHeader>
                  <DialogTitle>Edit Experiment</DialogTitle>
                  <DialogDescription>
                    Update your experiment details and status.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                  
                  <div className="grid gap-3">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Add any details about the experiment"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
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
      
      <div className="flex justify-between items-center bg-accent/50 p-4 rounded-lg">
        <div>
          <h3 className="font-medium">Status</h3>
          <StatusBadge status={experiment.status} />
        </div>
        <div>
          <h3 className="font-medium">Timeframe</h3>
          <p className="text-sm text-muted-foreground">
            {experiment.startDate 
              ? new Date(experiment.startDate).toLocaleDateString() 
              : 'Not started'} 
            {' — '} 
            {experiment.endDate 
              ? new Date(experiment.endDate).toLocaleDateString() 
              : 'No end date'}
          </p>
        </div>
        <div>
          <h3 className="font-medium">Last Updated</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(experiment.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Experiment Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p><span className="font-medium">Based on the hypothesis:</span></p>
            <p className="text-muted-foreground">Because we observed {hypothesis.observation}, we will do {hypothesis.initiative}, with the measurable goal to improve {hypothesis.metric}.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Experiment Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {experiment.notes ? (
            <p>{experiment.notes}</p>
          ) : (
            <p className="text-muted-foreground">No notes added yet.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Based on the current status of <StatusBadge status={experiment.status} />, here are recommended next steps:</p>
            
            {experiment.status === 'Planned' && (
              <ul className="list-disc ml-6 space-y-2">
                <li>Set a start date for the experiment</li>
                <li>Prepare necessary resources and tools</li>
                <li>Define clear metrics and tracking mechanisms</li>
                <li>Update the status to "In Progress" once started</li>
              </ul>
            )}
            
            {experiment.status === 'In Progress' && (
              <ul className="list-disc ml-6 space-y-2">
                <li>Monitor results regularly</li>
                <li>Document observations and insights</li>
                <li>Prepare for analysis at experiment conclusion</li>
                <li>Update status based on findings</li>
              </ul>
            )}
            
            {experiment.status === 'Blocked' && (
              <ul className="list-disc ml-6 space-y-2">
                <li>Identify and document the blockers</li>
                <li>Develop action plan to resolve issues</li>
                <li>Consider timeline adjustments</li>
                <li>Update status once blockage is resolved</li>
              </ul>
            )}
            
            {experiment.status === 'Winning' && (
              <ul className="list-disc ml-6 space-y-2">
                <li>Document successful strategies</li>
                <li>Plan for broader implementation</li>
                <li>Share learnings with the team</li>
                <li>Consider follow-up experiments to optimize further</li>
              </ul>
            )}
            
            {experiment.status === 'Losing' && (
              <ul className="list-disc ml-6 space-y-2">
                <li>Analyze what went wrong</li>
                <li>Document lessons learned</li>
                <li>Adjust hypothesis or approach</li>
                <li>Consider new experiments based on learnings</li>
              </ul>
            )}
            
            {experiment.status === 'Inconclusive' && (
              <ul className="list-disc ml-6 space-y-2">
                <li>Review experiment design and metrics</li>
                <li>Identify what made results inconclusive</li>
                <li>Consider adjusting hypothesis or measurement approach</li>
                <li>Plan for a refined experiment if warranted</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperimentDetailsPage;
