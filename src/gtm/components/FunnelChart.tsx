import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FunnelChartProps {
  data: {
    companies: number;
    meetings: number;
    opportunities: number;
    customers: number;
  };
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  const chartData = [
    {
      stage: 'Companies',
      value: data.companies,
      percentage: 100,
    },
    {
      stage: 'Meetings',
      value: Math.round(data.meetings),
      percentage: data.companies > 0 ? (data.meetings / data.companies) * 100 : 0,
    },
    {
      stage: 'Opportunities',
      value: Math.round(data.opportunities),
      percentage: data.companies > 0 ? (data.opportunities / data.companies) * 100 : 0,
    },
    {
      stage: 'Customers',
      value: Math.round(data.customers),
      percentage: data.companies > 0 ? (data.customers / data.companies) * 100 : 0,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-primary">
            Value: {new Intl.NumberFormat().format(data.value)}
          </p>
          <p className="text-muted-foreground">
            Rate: {data.percentage.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="stage"
            fontSize={12}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <YAxis
            fontSize={12}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
