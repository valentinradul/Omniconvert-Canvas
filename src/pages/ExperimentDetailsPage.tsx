
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_STATUSES, ExperimentStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ObservationContentEditor from '@/components/ObservationContentEditor';

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
  
  // Form state
  const [status, setStatus] = useState<ExperimentStatus | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState<string | undefined>(undefined);
  const [totalCost, setTotalCost] = useState<string>('');
  const [totalReturn, setTotalReturn] = useState<string>('');
  const [observationContent, setObservationContent] = useState<any>({ text: '', imageUrls: [], externalUrls: [] });
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const allUsers = getAllUserNames();
  
  useEffect(() => {
    if (experiment) {
      setStatus(experiment.status);
      setStartDate(experiment.startDate);
      setEndDate(experiment.endDate);
      setNotes(experiment.notes);
      setResponsibleUserId(experiment.responsibleUserId);
      setTotalCost(experiment.totalCost?.toString() || '');
      setTotalReturn(experiment.totalReturn?.toString() || '');
      setObservationContent(experiment.observationContent || { text: '', imageUrls: [], externalUrls: [] });
    } else {
      navigate('/experiments');
    }
  }, [experiment, navigate]);
  
  if (!experiment || !hypothesis || !idea) {
    return <div>Loading...</div>;
  }

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
      const parsedCost = totalCost ? parseFloat(totalCost) : undefined;
      const parsedReturn = totalReturn ? parseFloat(totalReturn) : undefined;

      editExperiment(experiment.id, {
        status: status as ExperimentStatus,
        startDate,
        endDate,
        notes,
        responsibleUserId,
        totalCost: parsedCost,
        totalReturn: parsedReturn,
        observationContent
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
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Experiment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <form onSubmit={handleEdit}>
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
          <h3 className="font-medium">Duration</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>In status: {duration.daysInStatus} days</div>
            <div>Running: {duration.daysRunning} days</div>
            {duration.daysRemaining !== null && (
              <div className="font-medium">Remaining: {duration.daysRemaining} days</div>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-medium">Dates</h3>
          <p className="text-sm text-muted-foreground">
            {experiment.startDate 
              ? format(new Date(experiment.startDate), 'MMM d, yyyy') 
              : 'Not started'} 
            {' — '} 
            {experiment.endDate 
              ? format(new Date(experiment.endDate), 'MMM d, yyyy') 
              : 'No end date'}
          </p>
        </div>
      </div>
      
      {/* Financial metrics card */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
              <p className="text-2xl font-semibold">
                {experiment.totalCost !== undefined ? `$${experiment.totalCost.toFixed(2)}` : '—'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Return</h3>
              <p className="text-2xl font-semibold">
                {experiment.totalReturn !== undefined ? `$${experiment.totalReturn.toFixed(2)}` : '—'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">ROI</h3>
              <p className="text-2xl font-semibold">
                {experiment.totalCost && experiment.totalReturn ? 
                  `${((experiment.totalReturn - experiment.totalCost) / experiment.totalCost * 100).toFixed(2)}%` : 
                  '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
      
      {/* Documentation & References Card */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation & References</CardTitle>
        </CardHeader>
        <CardContent>
          {experiment.observationContent?.text || 
           (experiment.observationContent?.imageUrls && experiment.observationContent.imageUrls.length > 0) ||
           (experiment.observationContent?.externalUrls && experiment.observationContent.externalUrls.length > 0) ? (
            <div className="space-y-4">
              {experiment.observationContent.text && (
                <div className="prose max-w-none">
                  {experiment.observationContent.text}
                </div>
              )}
              
              {experiment.observationContent.imageUrls && experiment.observationContent.imageUrls.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {experiment.observationContent.imageUrls.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-md overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Documentation image ${i+1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {experiment.observationContent.externalUrls && experiment.observationContent.externalUrls.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">External Links</h3>
                  <ul className="space-y-2">
                    {experiment.observationContent.externalUrls.map((link, i) => (
                      <li key={i}>
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No documentation or references added yet.</p>
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
