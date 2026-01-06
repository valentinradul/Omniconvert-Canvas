import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EmailScheduleTableProps {
  weeklyData: { week: number; emails: number; cohorts?: number[] }[];
}

export const EmailScheduleTable: React.FC<EmailScheduleTableProps> = ({ weeklyData }) => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const hasCohortData = weeklyData.length > 0 && weeklyData[0].cohorts && weeklyData[0].cohorts.length > 0;
  const maxCohorts = hasCohortData ? weeklyData[0].cohorts!.length : 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Week</TableHead>
          <TableHead className="text-right">Total Emails</TableHead>
          {hasCohortData && Array.from({ length: maxCohorts }, (_, index) => (
            <TableHead key={index} className="text-right">Email {index + 1}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {weeklyData.map((data) => (
          <TableRow key={data.week}>
            <TableCell className="font-medium">Week {data.week}</TableCell>
            <TableCell className="text-right font-semibold">{formatNumber(data.emails)}</TableCell>
            {hasCohortData && data.cohorts && data.cohorts.map((count, index) => (
              <TableCell key={index} className="text-right text-sm text-muted-foreground">
                {formatNumber(count)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
