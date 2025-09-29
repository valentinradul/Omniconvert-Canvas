import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Experiment, ExperimentStatus } from '@/types/experiments';
import { Calendar, Play, Square } from 'lucide-react';
import { useExperiments } from '@/context/hooks/useExperiments';
import { useHypotheses } from '@/context/hooks/useHypotheses';
import { useIdeas } from '@/context/hooks/useIdeas';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';
import { TimePeriod, TimeInterval } from './PeriodSelector';
import { getPeriodDateRange, getIntervalSteps } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { useContentSettings } from '@/hooks/useContentSettings';

interface ExperimentTimelineProps {
  experiments: Experiment[];
  selectedPeriod: TimePeriod;
  selectedInterval: TimeInterval;
}

const ExperimentTimeline: React.FC<ExperimentTimelineProps> = ({ 
  experiments, 
  selectedPeriod, 
  selectedInterval 
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState<ExperimentStatus[]>(['In Progress']);
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { editExperiment } = useExperiments(user, currentCompany);
  const { hypotheses } = useHypotheses(user, currentCompany, experiments);
  const { ideas } = useIdeas(user, currentCompany, hypotheses);
  const navigate = useNavigate();
  const { data: contentSettings } = useContentSettings();

  // Helper function to get experiment display name
  const getExperimentDisplayName = (experiment: Experiment) => {
    if (experiment.title) return experiment.title;
    
    const hypothesis = hypotheses.find(h => h.id === experiment.hypothesisId);
    if (hypothesis) {
      const idea = ideas.find(i => i.id === hypothesis.ideaId);
      if (idea) return idea.title;
    }
    
    return 'Untitled Experiment';
  };

  // Helper function to get responsible user name
  const getResponsibleUserName = (experiment: Experiment) => {
    return experiment.userName || 'Unassigned';
  };

  // Helper function to get experiment category
  const getExperimentCategory = (experiment: Experiment) => {
    const hypothesis = hypotheses.find(h => h.id === experiment.hypothesisId);
    if (hypothesis) {
      const idea = ideas.find(i => i.id === hypothesis.ideaId);
      if (idea) return idea.category || 'No Category';
    }
    return 'No Category';
  };

  const statusOptions: { status: ExperimentStatus; label: string; color: string }[] = [
    { status: 'In Progress', label: 'Active Experiments', color: 'bg-green-500' },
    { status: 'Planned', label: 'Planned', color: 'bg-blue-500' },
    { status: 'Blocked', label: 'Blocked', color: 'bg-red-500' },
    { status: 'Winning', label: 'Winning', color: 'bg-emerald-500' },
    { status: 'Losing', label: 'Losing', color: 'bg-orange-500' },
    { status: 'Inconclusive', label: 'Inconclusive', color: 'bg-gray-500' },
  ];

  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      // Primary filter: must match selected status
      if (!selectedStatuses.includes(exp.status)) return false;
      
      // Secondary filter: date filtering only for specific periods
      if (selectedPeriod !== 'all-time') {
        const { start: periodStart, end: periodEnd } = getPeriodDateRange(selectedPeriod);
        
        // If experiment has no start date, include it (treat as always active)
        if (!exp.startDate) return true;
        
        const expStart = new Date(exp.startDate);
        const expEnd = exp.endDate ? new Date(exp.endDate) : new Date(); // If no end date, consider it ongoing
        
        // Experiment is active if it overlaps with the selected period
        // (starts before or during period) AND (ends after or during period start)
        return expStart <= periodEnd && expEnd >= periodStart;
      }
      
      // For 'all-time', show all experiments with matching status
      return true;
    });
  }, [experiments, selectedStatuses, selectedPeriod]);

  const hasFinancialData = experiments.some(exp => exp.totalCost || exp.totalReturn);

  const handleStatusToggle = (status: ExperimentStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Calculate timeline based on selected period and interval
  const timelineData = useMemo(() => {
    const { start, end } = getPeriodDateRange(selectedPeriod);
    const steps = getIntervalSteps(start, end, selectedInterval);
    
    return {
      start,
      end,
      steps
    };
  }, [selectedPeriod, selectedInterval]);

  const getExperimentStepSpan = (experiment: Experiment) => {
    if (!experiment.startDate) return { start: 0, duration: 1 };
    
    const startDate = new Date(experiment.startDate);
    const endDate = experiment.endDate ? new Date(experiment.endDate) : new Date();
    
    let startStepIndex = -1;
    let endStepIndex = -1;
    
    // Find which steps the experiment spans
    timelineData.steps.forEach((step, index) => {
      // Check if experiment start date falls within this step
      if (startStepIndex === -1 && startDate >= step.start && startDate <= step.end) {
        startStepIndex = index;
      }
      
      // Check if experiment end date falls within this step
      if (endDate >= step.start && endDate <= step.end) {
        endStepIndex = index;
      }
    });
    
    // If experiment starts before our timeline, start at 0
    if (startStepIndex === -1 && startDate < timelineData.start) {
      startStepIndex = 0;
    }
    
    // If experiment ends after our timeline, end at last step
    if (endStepIndex === -1 && endDate > timelineData.end) {
      endStepIndex = timelineData.steps.length - 1;
    }
    
    // If we still haven't found the start step, find the closest one
    if (startStepIndex === -1) {
      // Find the step that contains or is closest to the start date
      let closestDistance = Infinity;
      timelineData.steps.forEach((step, index) => {
        const stepMiddle = new Date((step.start.getTime() + step.end.getTime()) / 2);
        const distance = Math.abs(startDate.getTime() - stepMiddle.getTime());
        if (distance < closestDistance) {
          closestDistance = distance;
          startStepIndex = index;
        }
      });
    }
    
    // If we haven't found the end step, use the start step
    if (endStepIndex === -1) {
      endStepIndex = startStepIndex;
    }
    
    return {
      start: Math.max(0, startStepIndex),
      duration: Math.max(1, endStepIndex - startStepIndex + 1)
    };
  };


  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Experiment Timeline
        </CardTitle>
        
        {/* Filter Checkboxes */}
        <div className="flex flex-wrap gap-4 mt-4">
          {statusOptions.map(({ status, label, color }) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <label htmlFor={status} className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                {label}
              </label>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No experiments match the selected filters</p>
          </div>
        ) : (
          <div className="relative">
            {/* Container with sticky positioning */}
            <div className="relative overflow-auto max-h-[70vh] border border-border rounded">
              {/* Timeline Headers - Sticky top */}
              <div className="flex sticky top-0 z-20 bg-background border-b border-border min-w-max">
                <div className="w-[400px] flex-shrink-0 sticky left-0 z-30 bg-background border-r border-border">
                  <div className="py-4 px-3 font-medium text-sm text-muted-foreground bg-muted/30">
                    Experiment Details
                  </div>
                </div>
                <div className="flex min-w-max">
                  {timelineData.steps.map((step, i) => (
                    <div key={i} className="w-24 text-center py-4 px-2 border-r border-border bg-muted/30 flex-shrink-0">
                      <div className="text-xs font-medium text-primary">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experiment Rows */}
              <div className="space-y-0">
                {filteredExperiments.map((experiment) => {
                  const stepSpan = getExperimentStepSpan(experiment);
                  const isActive = experiment.status === 'In Progress';
                  const netRevenue = (experiment.totalReturn || 0) - (experiment.totalCost || 0);
                  
                  return (
                    <div key={experiment.id} className="flex items-center border-b border-border hover:bg-muted/30 min-w-max">
                      {/* Experiment Info - Sticky left */}
                      <div className="w-[400px] flex-shrink-0 sticky left-0 z-10 bg-background border-r border-border">
                        <div className="p-3 space-y-2">
                          <div className="cursor-pointer hover:underline" onClick={() => navigate(`/experiments/${experiment.id}`)}>
                            <h4 className="font-medium text-sm text-primary" style={{ 
                              maxWidth: '320px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {getExperimentDisplayName(experiment)}
                            </h4>
                          </div>
                          
                          {/* Responsible and Category */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>👤 {getResponsibleUserName(experiment)}</span>
                            <span>📁 {getExperimentCategory(experiment)}</span>
                          </div>

                          {/* Status and Live indicator */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {experiment.status}
                            </Badge>
                            
                            {/* Net Revenue - larger font, positioned near status */}
                            {contentSettings?.enable_financial_tracking !== false && (
                              <span className={`text-sm font-medium ${
                                netRevenue === 0 ? 'text-black' : 
                                netRevenue > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${netRevenue.toLocaleString()}
                              </span>
                            )}
                            {isActive && (
                              <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Timeline Grid */}
                      <div className="flex relative min-w-max">
                        {timelineData.steps.map((_, i) => {
                          const isInRange = i >= stepSpan.start && i < stepSpan.start + stepSpan.duration;
                          const isFirstInRange = isInRange && i === stepSpan.start;
                          const isLastInRange = isInRange && i === stepSpan.start + stepSpan.duration - 1;
                          
                          return (
                            <div key={i} className="w-24 h-16 border-r border-border relative bg-background flex-shrink-0">
                              {isInRange && (
                                <>
                                  {/* Continuous progress bar */}
                                  <div 
                                    className={`absolute inset-y-4 ${
                                      isFirstInRange ? 'left-3' : 'left-0'
                                    } ${
                                      isLastInRange ? 'right-3' : 'right-0'
                                    } ${
                                      isActive ? 'bg-primary' : 'bg-primary/70'
                                    } h-4`}
                                  />
                                  
                                   {/* Start indicator */}
                                   {isFirstInRange && experiment.startDate && (
                                     <div className="absolute inset-0 flex items-center justify-start pl-2">
                                       <Play className="text-green-600" fill="currentColor" style={{ height: '27px', width: '27px' }} />
                                     </div>
                                   )}
                                   
                                   {/* End indicator */}
                                   {isLastInRange && experiment.endDate && (
                                     <div className="absolute inset-0 flex items-center justify-end pr-2">
                                       <Square className="text-red-600" fill="currentColor" style={{ height: '27px', width: '27px' }} />
                                     </div>
                                   )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentTimeline;