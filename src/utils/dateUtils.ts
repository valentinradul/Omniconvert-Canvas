import { TimePeriod, TimeInterval } from '@/components/dashboard/PeriodSelector';

export const getPeriodDateRange = (period: TimePeriod): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (period) {
    case 'last-month':
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      end.setDate(0); // Last day of previous month
      break;
    
    case 'last-3-months':
      start.setMonth(now.getMonth() - 3);
      start.setDate(1);
      break;
    
    case 'this-quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start.setMonth(currentQuarter * 3);
      start.setDate(1);
      break;
    
    case 'last-quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      if (lastQuarter < 0) {
        start.setFullYear(now.getFullYear() - 1);
        start.setMonth(9); // Q4 of previous year
      } else {
        start.setMonth(lastQuarter * 3);
      }
      start.setDate(1);
      
      const endQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      end.setMonth((endQuarter + 1) * 3);
      end.setDate(0); // Last day of quarter
      break;
    
    case 'this-year':
      start.setMonth(0);
      start.setDate(1);
      break;
    
    case 'last-year':
      start.setFullYear(now.getFullYear() - 1);
      start.setMonth(0);
      start.setDate(1);
      end.setFullYear(now.getFullYear() - 1);
      end.setMonth(11);
      end.setDate(31);
      break;
    
    case 'all-time':
      start.setFullYear(2020); // Reasonable start date
      start.setMonth(0);
      start.setDate(1);
      break;
  }

  return { start, end };
};

export const getIntervalSteps = (
  startDate: Date, 
  endDate: Date, 
  interval: TimeInterval
): Array<{ start: Date; end: Date; label: string }> => {
  const steps = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const stepStart = new Date(current);
    let stepEnd = new Date(current);
    let label = '';

    switch (interval) {
      case 'weekly':
        stepEnd.setDate(current.getDate() + 6);
        label = `Week of ${stepStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}`;
        current.setDate(current.getDate() + 7);
        break;
      
      case 'monthly':
        stepEnd.setMonth(current.getMonth() + 1);
        stepEnd.setDate(0); // Last day of month
        label = stepStart.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
        break;
      
      case 'quarterly':
        stepEnd.setMonth(current.getMonth() + 3);
        stepEnd.setDate(0); // Last day of quarter
        const quarter = Math.floor(stepStart.getMonth() / 3) + 1;
        label = `Q${quarter} ${stepStart.getFullYear()}`;
        current.setMonth(current.getMonth() + 3);
        current.setDate(1);
        break;
    }

    if (stepEnd > endDate) {
      stepEnd = new Date(endDate);
    }

    steps.push({ start: stepStart, end: stepEnd, label });
  }

  return steps;
};