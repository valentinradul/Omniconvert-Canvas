import React, { useState } from 'react';
import { format, subDays, subMonths, subWeeks, startOfMonth, startOfQuarter, startOfYear, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DatePreset = 
  | 'custom'
  | 'all-time'
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-7-days'
  | 'last-week'
  | 'last-28-days'
  | 'last-30-days'
  | 'this-month'
  | 'last-month'
  | 'last-90-days'
  | 'quarter-to-date'
  | 'this-year'
  | 'last-calendar-year';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { key: DatePreset; label: string }[] = [
  { key: 'all-time', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this-week', label: 'This week (Mon - Today)' },
  { key: 'last-7-days', label: 'Last 7 days' },
  { key: 'last-week', label: 'Last week (Mon - Sun)' },
  { key: 'last-28-days', label: 'Last 28 days' },
  { key: 'last-30-days', label: 'Last 30 days' },
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'last-90-days', label: 'Last 90 days' },
  { key: 'quarter-to-date', label: 'Quarter to date' },
  { key: 'this-year', label: 'This year (Jan - Today)' },
  { key: 'last-calendar-year', label: 'Last calendar year' },
];

// Data range for "All Time" - based on actual data in the system (2024)
const ALL_TIME_START = new Date(2024, 0, 1);
const ALL_TIME_END = new Date(2024, 11, 31);

const getPresetRange = (preset: DatePreset): DateRange => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (preset) {
    case 'all-time':
      return { from: ALL_TIME_START, to: ALL_TIME_END };
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    case 'this-week':
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
    case 'last-7-days':
      return { from: subDays(today, 6), to: today };
    case 'last-week':
      const lastWeekEnd = subDays(startOfWeek(today, { weekStartsOn: 1 }), 1);
      const lastWeekStart = startOfWeek(lastWeekEnd, { weekStartsOn: 1 });
      return { from: lastWeekStart, to: lastWeekEnd };
    case 'last-28-days':
      return { from: subDays(today, 27), to: today };
    case 'last-30-days':
      return { from: subDays(today, 29), to: today };
    case 'this-month':
      return { from: startOfMonth(today), to: today };
    case 'last-month':
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: subDays(startOfMonth(today), 1) };
    case 'last-90-days':
      return { from: subDays(today, 89), to: today };
    case 'quarter-to-date':
      return { from: startOfQuarter(today), to: today };
    case 'this-year':
      return { from: startOfYear(today), to: today };
    case 'last-calendar-year':
      const lastYear = subMonths(today, 12);
      return { from: startOfYear(lastYear), to: subDays(startOfYear(today), 1) };
    default:
      return { from: subDays(today, 29), to: today };
  }
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('all-time');
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(value.to);

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      setTempFrom(range.from);
      setTempTo(range.to);
    }
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setTempFrom(value.from);
    setTempTo(value.to);
    setOpen(false);
  };

  const displayText = `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[280px]",
            !value && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayText}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="w-[180px] border-r p-2 space-y-1 max-h-[400px] overflow-y-auto">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  selectedPreset === preset.key
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "hover:bg-muted"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar section */}
          <div className="p-3">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Start date</label>
                <div className="border rounded px-3 py-1.5 text-sm min-w-[120px]">
                  {tempFrom ? format(tempFrom, 'MMM d, yyyy') : 'Select'}
                </div>
              </div>
              <span className="text-muted-foreground mt-4">—</span>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">End date</label>
                <div className="border rounded px-3 py-1.5 text-sm min-w-[120px]">
                  {tempTo ? format(tempTo, 'MMM d, yyyy') : 'Select'}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <CalendarComponent
                mode="range"
                selected={{ from: tempFrom, to: tempTo }}
                onSelect={(range) => {
                  setTempFrom(range?.from);
                  setTempTo(range?.to);
                  if (range?.from && range?.to) {
                    setSelectedPreset('custom');
                  }
                }}
                numberOfMonths={2}
                defaultMonth={new Date(2024, 0)}
                className="rounded-md border-0 pointer-events-auto"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
