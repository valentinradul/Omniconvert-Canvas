import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EmailScheduleChartProps {
  weeklyData: { week: number; emails: number; cohorts?: number[] }[];
}

export const EmailScheduleChart: React.FC<EmailScheduleChartProps> = ({ weeklyData }) => {
  const chartData = weeklyData.map(data => {
    const baseData: Record<string, any> = {
      week: `Week ${data.week}`,
      emails: Math.round(data.emails)
    };

    // Add cohort data if available
    if (data.cohorts && data.cohorts.length > 0) {
      data.cohorts.forEach((count, index) => {
        baseData[`email${index + 1}`] = Math.round(count);
      });
    }

    return baseData;
  });

  const cohortColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(220, 70%, 60%)',
    'hsl(280, 70%, 60%)'
  ];

  const hasCohortData = weeklyData.length > 0 && weeklyData[0].cohorts && weeklyData[0].cohorts.length > 0;
  const maxCohorts = hasCohortData ? weeklyData[0].cohorts!.length : 0;

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {hasCohortData ? (
            payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {`Email ${index + 1}: ${new Intl.NumberFormat('en-US').format(entry.value)}`}
              </p>
            ))
          ) : (
            <p style={{ color: payload[0].color }}>
              {`Total Emails: ${new Intl.NumberFormat('en-US').format(payload[0].value)}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="week" className="fill-muted-foreground" />
        <YAxis className="fill-muted-foreground" />
        <Tooltip content={customTooltip} />
        {hasCohortData ? (
          // Render stacked bars for each cohort
          Array.from({ length: maxCohorts }, (_, index) => (
            <Bar
              key={index}
              dataKey={`email${index + 1}`}
              stackId="emails"
              fill={cohortColors[index % cohortColors.length]}
              name={`Email ${index + 1}`}
            />
          ))
        ) : (
          // Render single bar for total emails
          <Bar dataKey="emails" fill="hsl(var(--primary))" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};
