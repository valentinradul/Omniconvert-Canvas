
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { format, formatDistance } from 'date-fns';
import { ALL_STATUSES } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ExperimentsPage: React.FC = () => {
  const { experiments, hypotheses, getAllUserNames, getHypothesisById, getIdeaById, getExperimentDuration } = useApp();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterResponsible, setFilterResponsible] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  const allUsers = getAllUserNames();
  
  const filteredExperiments = experiments.filter(experiment => {
    // Filter by status
    if (filterStatus && experiment.status !== filterStatus) {
      return false;
    }
    
    // Filter by responsible person
    if (filterResponsible && experiment.responsibleUserId !== filterResponsible) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const hypothesis = getHypothesisById(experiment.hypothesisId);
      const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
      
      const searchLower = searchQuery.toLowerCase();
      const ideaTitle = idea?.title?.toLowerCase() || '';
      const hypothesisMetric = hypothesis?.metric?.toLowerCase() || '';
      const experimentNotes = experiment.notes?.toLowerCase() || '';
      
      if (!ideaTitle.includes(searchLower) && 
          !hypothesisMetric.includes(searchLower) && 
          !experimentNotes.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">Track your growth experiments and their results</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search experiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-1/3">
          <div className="w-1/2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2">
            <Select value={filterResponsible} onValueChange={setFilterResponsible}>
              <SelectTrigger>
                <SelectValue placeholder="Responsible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {experiments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-medium">No experiments yet</h3>
          <p className="text-muted-foreground mb-4">Create experiments from your hypotheses</p>
          <Button onClick={() => navigate('/hypotheses')}>View Hypotheses</Button>
        </div>
      ) : (
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExperiments.map(experiment => {
              const hypothesis = getHypothesisById(experiment.hypothesisId);
              const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
              const duration = getExperimentDuration(experiment);
              const responsible = experiment.responsibleUserId ? 
                allUsers.find(u => u.id === experiment.responsibleUserId)?.name : undefined;
              
              return (
                <Card key={experiment.id} className="relative">
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={experiment.status} />
                  </div>
                  <CardHeader>
                    <CardTitle className="pr-24">
                      {idea?.title || 'Experiment'}
                    </CardTitle>
                    <CardDescription>
                      Created {format(new Date(experiment.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hypothesis && (
                      <p className="text-sm">
                        <span className="font-medium">Goal:</span> {hypothesis.metric}
                      </p>
                    )}
                    
                    {responsible && (
                      <p className="text-sm">
                        <span className="font-medium">Responsible:</span> {responsible}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <div className="text-sm flex justify-between">
                        <span className="font-medium">Time in current status:</span>
                        <span>{duration.daysInStatus} days</span>
                      </div>
                      
                      <div className="text-sm flex justify-between">
                        <span className="font-medium">Running for:</span>
                        <span>{duration.daysRunning} days</span>
                      </div>
                      
                      {duration.daysRemaining !== null && (
                        <div className="text-sm flex justify-between">
                          <span className="font-medium">Days remaining:</span>
                          <span className="font-bold">{duration.daysRemaining} days</span>
                        </div>
                      )}
                      
                      {duration.daysTotal !== null && (
                        <div className="text-sm flex justify-between">
                          <span className="font-medium">Total duration:</span>
                          <span>{duration.daysTotal} days</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">Start Date</p>
                        <p className="text-muted-foreground">
                          {experiment.startDate 
                            ? format(new Date(experiment.startDate), 'MMM d, yyyy') 
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">End Date</p>
                        <p className="text-muted-foreground">
                          {experiment.endDate 
                            ? format(new Date(experiment.endDate), 'MMM d, yyyy') 
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => navigate(`/experiment-details/${experiment.id}`)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      )}
      
      <TabsContent value="list" className="mt-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Experiment</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExperiments.map(experiment => {
                const hypothesis = getHypothesisById(experiment.hypothesisId);
                const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
                const duration = getExperimentDuration(experiment);
                const responsible = experiment.responsibleUserId ? 
                  allUsers.find(u => u.id === experiment.responsibleUserId)?.name : undefined;
                
                return (
                  <TableRow key={experiment.id}>
                    <TableCell>
                      <div className="font-medium">{idea?.title || 'Experiment'}</div>
                      <div className="text-sm text-muted-foreground">
                        Created {formatDistance(new Date(experiment.createdAt), new Date(), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>{hypothesis?.metric || 'N/A'}</TableCell>
                    <TableCell><StatusBadge status={experiment.status} /></TableCell>
                    <TableCell>{responsible || 'Unassigned'}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>In status: {duration.daysInStatus} days</div>
                        <div>Running: {duration.daysRunning} days</div>
                        {duration.daysRemaining !== null && (
                          <div className="font-medium">Remaining: {duration.daysRemaining} days</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/experiment-details/${experiment.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </div>
  );
};

export default ExperimentsPage;
