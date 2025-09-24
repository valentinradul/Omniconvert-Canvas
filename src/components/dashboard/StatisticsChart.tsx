
import React from 'react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { HypothesisStatus, Experiment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Generate sample data for visualization
const generateChartData = (
  hypothesesByStatus: Record<HypothesisStatus, number>,
  experiments: Experiment[]
) => {
  // Count winning vs non-winning experiments by month
  const experimentsByMonth = experiments.reduce((acc: any, exp) => {
    const month = new Date(exp.createdAt).toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { winning: 0, losing: 0 };
    }
    if (exp.status === 'Winning') {
      acc[month].winning++;
    } else if (exp.status === 'Losing' || exp.status === 'Inconclusive') {
      acc[month].losing++;
    }
    return acc;
  }, {});
  
  // Convert to array format for chart
  const chartData = Object.entries(experimentsByMonth).map(([name, data]: [string, any]) => ({
    name,
    winning: data.winning,
    losing: data.losing
  }));
  
  // Ensure we have at least some data
  if (chartData.length === 0) {
    return [
      { name: 'Jan', winning: 0, losing: 0 },
      { name: 'Feb', winning: 0, losing: 0 },
      { name: 'Mar', winning: 0, losing: 0 },
    ];
  }
  
  return chartData;
};

interface StatisticsChartProps {
  hypotheses: Record<HypothesisStatus, number>;
  experiments: Experiment[];
  winRate: number;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ 
  hypotheses,
  experiments,
  winRate
}) => {
  const chartData = generateChartData(hypotheses, experiments);
  
  const config = {
    winning: { color: '#10b981' },  // green-500
    losing: { color: '#f97316' }    // orange-500
  };
  
  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Experiment Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ChartContainer config={config}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWinning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorLosing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis width={40} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Area 
                  type="monotone" 
                  dataKey="winning" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorWinning)" 
                  name="Winning"
                />
                <Area 
                  type="monotone" 
                  dataKey="losing" 
                  stroke="#f97316" 
                  fillOpacity={1} 
                  fill="url(#colorLosing)"
                  name="Losing/Inconclusive"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsChart;
