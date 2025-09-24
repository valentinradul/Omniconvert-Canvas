import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Experiment, ExperimentStatus } from '@/types/experiments';
import { Calendar } from 'lucide-react';
import { useExperiments } from '@/context/hooks/useExperiments';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';
import { TimePeriod, TimeInterval } from './PeriodSelector';
import { getPeriodDateRange, getIntervalSteps } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const statusOptions: { status: ExperimentStatus; label: string; color: string }[] = [
    { status: 'In Progress', label: 'Active Experiments', color: 'bg-green-500' },
    { status: 'Planned', label: 'Planned', color: 'bg-blue-500' },
    { status: 'Blocked', label: 'Blocked', color: 'bg-red-500' },
    { status: 'Winning', label: 'Winning', color: 'bg-emerald-500' },
    { status: 'Losing', label: 'Losing', color: 'bg-orange-500' },
    { status: 'Inconclusive', label: 'Inconclusive', color: 'bg-gray-500' },
  ];

  const filteredExperiments = useMemo(() => {
    const { start: periodStart, end: periodEnd } = getPeriodDateRange(selectedPeriod);
    
    return experiments.filter(exp => {
      if (!selectedStatuses.includes(exp.status)) return false;
      
      // Filter by selected period
      if (selectedPeriod !== 'all-time' && exp.startDate) {
        const expStart = new Date(exp.startDate);
        return expStart >= periodStart && expStart <= periodEnd;
      }
      
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
      if (startDate >= step.start && startDate <= step.end) {
        startStepIndex = index;
      }
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
          <div className="overflow-x-auto">
            {/* Timeline Headers */}
            <div className="flex mb-4">
              <div className="min-w-[300px] flex-shrink-0" /> {/* Space for experiment names */}
              <div className="flex border-l border-border">
                {timelineData.steps.map((step, i) => (
                  <div key={i} className="w-24 text-center py-2 border-r border-border bg-muted/30">
                    <div className="text-xs font-medium text-primary">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experiment Rows */}
            <div className="space-y-2">
              {filteredExperiments.map((experiment) => {
                const stepSpan = getExperimentStepSpan(experiment);
                const isActive = experiment.status === 'In Progress';
                
                return (
                  <div key={experiment.id} className="flex items-center border border-border rounded">
                    {/* Experiment Info */}
                    <div className="min-w-[300px] flex-shrink-0 p-3 border-r border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="cursor-pointer hover:underline" onClick={() => navigate(`/experiments/${experiment.id}`)}>
                            <h4 className="font-medium text-sm truncate text-primary">
                              {experiment.title || `Experiment #${experiment.id.slice(0, 8)}`}
                            </h4>
                            {(experiment.totalReturn || experiment.totalCost) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Net: ${((experiment.totalReturn || 0) - (experiment.totalCost || 0)).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {experiment.status}
                            </Badge>
                            {isActive && (
                              <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline Grid */}
                    <div className="flex">
                      {timelineData.steps.map((_, i) => {
                        const isInRange = i >= stepSpan.start && i < stepSpan.start + stepSpan.duration;
                        
                        return (
                          <div key={i} className="w-24 h-12 border-r border-border relative bg-background">
                            {isInRange && (
                              <div 
                                className={`absolute inset-y-2 inset-x-1 rounded ${
                                  isActive ? 'bg-primary' : 'bg-primary/70'
                                }`}
                              />
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
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentTimeline;