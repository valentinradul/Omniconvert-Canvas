import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Experiment, ExperimentStatus } from '@/types/experiments';
import { Clock, Calendar } from 'lucide-react';

interface ExperimentTimelineProps {
  experiments: Experiment[];
}

const ExperimentTimeline: React.FC<ExperimentTimelineProps> = ({ experiments }) => {
  const [selectedStatuses, setSelectedStatuses] = useState<ExperimentStatus[]>(['In Progress']);

  const statusOptions: { status: ExperimentStatus; label: string; color: string }[] = [
    { status: 'In Progress', label: 'Active Experiments', color: 'bg-green-500' },
    { status: 'Planned', label: 'Planned', color: 'bg-blue-500' },
    { status: 'Blocked', label: 'Blocked', color: 'bg-red-500' },
    { status: 'Winning', label: 'Winning', color: 'bg-emerald-500' },
    { status: 'Losing', label: 'Losing', color: 'bg-orange-500' },
    { status: 'Inconclusive', label: 'Inconclusive', color: 'bg-gray-500' },
  ];

  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => selectedStatuses.includes(exp.status));
  }, [experiments, selectedStatuses]);

  const handleStatusToggle = (status: ExperimentStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const calculateProgress = (experiment: Experiment) => {
    if (!experiment.startDate) return 0;
    
    const startDate = new Date(experiment.startDate);
    const currentDate = new Date();
    const endDate = experiment.endDate ? new Date(experiment.endDate) : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // Default 30 days if no end date
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    
    if (elapsed < 0) return 0;
    if (elapsed > totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  };

  const getWeeksRunning = (experiment: Experiment) => {
    if (!experiment.startDate) return 0;
    
    const startDate = new Date(experiment.startDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks;
  };

  const getStatusColor = (status: ExperimentStatus) => {
    return statusOptions.find(opt => opt.status === status)?.color || 'bg-gray-500';
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
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No experiments match the selected filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExperiments.map((experiment) => {
              const progress = calculateProgress(experiment);
              const weeksRunning = getWeeksRunning(experiment);
              
              return (
                <div key={experiment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(experiment.status)}`} />
                      <h4 className="font-medium truncate">
                        Experiment #{experiment.id.slice(0, 8)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {experiment.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {weeksRunning} week{weeksRunning !== 1 ? 's' : ''} running
                        </span>
                      </div>
                      {experiment.startDate && (
                        <div className="text-xs mt-1">
                          Started: {new Date(experiment.startDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-md ml-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentTimeline;