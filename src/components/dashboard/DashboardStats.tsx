
import React from 'react';
import { Experiment, Hypothesis, HypothesisStatus } from '@/types';

interface DashboardStatsProps {
  ideasCount: number;
  hypotheses: Hypothesis[];
  experiments: Experiment[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ ideasCount, hypotheses, experiments }) => {
  // Calculate win rate
  const completedExperiments = experiments.filter(e => 
    e.status === 'Winning' || e.status === 'Losing' || e.status === 'Inconclusive'
  );
  
  const winningExperiments = experiments.filter(e => e.status === 'Winning');
  const winRate = completedExperiments.length > 0 
    ? Math.round((winningExperiments.length / completedExperiments.length) * 100)
    : 0;

  const activeHypotheses = hypotheses.filter(h => 
    h.status === 'Selected For Testing' || h.status === 'Testing'
  ).length;
  
  const completedHypotheses = hypotheses.filter(h => h.status === 'Completed').length;
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Growth Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Total Ideas</p>
          <p className="text-3xl font-bold">{ideasCount}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Active Hypotheses</p>
          <p className="text-3xl font-bold">{activeHypotheses}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-3xl font-bold">{completedHypotheses}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-3xl font-bold">{winRate}%</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
