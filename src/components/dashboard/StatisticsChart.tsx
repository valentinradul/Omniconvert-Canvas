import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Experiment } from '@/types/experiments';

interface StatisticsChartProps {
  hypotheses: Record<string, number>;
  experiments: Experiment[];
  winRate: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

const StatisticsChart: React.FC<StatisticsChartProps> = ({ 
  hypotheses,
  experiments,
  winRate
}) => {
  const hypothesesData = Object.entries(hypotheses).map(([status, count]) => ({
    status,
    count
  }));

  const experimentsByStatus = experiments.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const experimentsData = Object.entries(experimentsByStatus).map(([status, count]) => ({
    status,
    count
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Hypotheses by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={hypothesesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experiments Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={experimentsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                outerRadius={40}
                fill="#8884d8"
                dataKey="count"
              >
                {experimentsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsChart;