
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GrowthIdea, Hypothesis, Experiment } from '@/types';
import { ArrowUpIcon, ArrowDownIcon, BarChart3, Brain, Lightbulb, Beaker } from 'lucide-react';

interface StatisticsPanelProps {
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  filteredIdeas: GrowthIdea[];
  filteredHypotheses: Hypothesis[];
  filteredExperiments: Experiment[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  ideas,
  hypotheses,
  experiments,
  filteredIdeas,
  filteredHypotheses,
  filteredExperiments
}) => {
  // Calculate statistics for active hypotheses and experiments
  const activeHypotheses = filteredHypotheses.filter(h => 
    h.status === 'Selected For Testing' || h.status === 'Testing'
  ).length;

  const runningExperiments = filteredExperiments.filter(e => 
    e.status === 'In Progress' || e.status === 'Planned'
  ).length;
  
  const completedExperiments = filteredExperiments.filter(e => 
    e.status === 'Winning' || e.status === 'Losing' || e.status === 'Inconclusive'
  );
  
  const winningExperiments = filteredExperiments.filter(e => e.status === 'Winning');
  const winRate = completedExperiments.length > 0 
    ? Math.round((winningExperiments.length / completedExperiments.length) * 100)
    : 0;

  // Calculate trend indicators (simple example - showing increase if filtered count > 50% of total)
  const ideasTrend = filteredIdeas.length > ideas.length * 0.5;
  const hypothesesTrend = activeHypotheses > hypotheses.filter(h => 
    h.status === 'Selected For Testing' || h.status === 'Testing'
  ).length * 0.5;
  const experimentsTrend = runningExperiments > experiments.filter(e => 
    e.status === 'In Progress' || e.status === 'Planned'
  ).length * 0.5;

  console.log('StatisticsPanel - Active Hypotheses:', activeHypotheses);
  console.log('StatisticsPanel - Running Experiments:', runningExperiments);
  console.log('StatisticsPanel - All hypotheses:', filteredHypotheses.map(h => ({ id: h.id, status: h.status })));
  console.log('StatisticsPanel - All experiments:', filteredExperiments.map(e => ({ id: e.id, status: e.status })));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-soft-purple p-3 rounded-full">
            <Lightbulb size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ideas</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{filteredIdeas.length}</p>
              {ideasTrend ? 
                <ArrowUpIcon size={16} className="text-green-500" /> : 
                <ArrowDownIcon size={16} className="text-amber-500" />
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-soft-blue p-3 rounded-full">
            <Brain size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Hypotheses</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{activeHypotheses}</p>
              {hypothesesTrend ? 
                <ArrowUpIcon size={16} className="text-green-500" /> : 
                <ArrowDownIcon size={16} className="text-amber-500" />
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-soft-green p-3 rounded-full">
            <Beaker size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Running Experiments</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{runningExperiments}</p>
              {experimentsTrend ? 
                <ArrowUpIcon size={16} className="text-green-500" /> : 
                <ArrowDownIcon size={16} className="text-amber-500" />
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-soft-peach p-3 rounded-full">
            <BarChart3 size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{winRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPanel;
