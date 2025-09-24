
import React from 'react';
import { Experiment } from '@/types';
import ExperimentTimeline from './ExperimentTimeline';

interface StatisticsChartProps {
  hypotheses: any;
  experiments: Experiment[];
  winRate: number;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ 
  experiments
}) => {
  return <ExperimentTimeline experiments={experiments} />;
};

export default StatisticsChart;
