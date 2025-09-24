import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export type TimePeriod = 'last-month' | 'last-3-months' | 'this-quarter' | 'last-quarter' | 'this-year' | 'last-year' | 'all-time';
export type TimeInterval = 'weekly' | 'monthly' | 'quarterly';

interface PeriodSelectorProps {
  selectedPeriod: TimePeriod;
  selectedInterval: TimeInterval;
  onPeriodChange: (period: TimePeriod) => void;
  onIntervalChange: (interval: TimeInterval) => void;
}

const periodOptions = [
  { value: 'last-month' as TimePeriod, label: 'Last Month' },
  { value: 'last-3-months' as TimePeriod, label: 'Last 3 Months' },
  { value: 'this-quarter' as TimePeriod, label: 'This Quarter' },
  { value: 'last-quarter' as TimePeriod, label: 'Last Quarter' },
  { value: 'this-year' as TimePeriod, label: 'This Year' },
  { value: 'last-year' as TimePeriod, label: 'Last Year' },
  { value: 'all-time' as TimePeriod, label: 'All Time' },
];

const intervalOptions = [
  { value: 'weekly' as TimeInterval, label: 'Weekly' },
  { value: 'monthly' as TimeInterval, label: 'Monthly' },
  { value: 'quarterly' as TimeInterval, label: 'Quarterly' },
];

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  selectedInterval,
  onPeriodChange,
  onIntervalChange,
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Period:</span>
          </div>
          
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">View:</span>
          </div>
          
          <Select value={selectedInterval} onValueChange={onIntervalChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodSelector;