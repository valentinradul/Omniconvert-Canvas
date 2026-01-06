import React from 'react';

interface ROIGaugeProps {
  value: number;
}

export const ROIGauge: React.FC<ROIGaugeProps> = ({ value }) => {
  const getColor = (roi: number) => {
    if (roi < 0) return 'hsl(0, 84%, 60%)'; // red
    if (roi < 100) return 'hsl(45, 93%, 47%)'; // amber
    if (roi < 300) return 'hsl(160, 84%, 39%)'; // emerald
    return 'hsl(160, 84%, 29%)'; // dark emerald
  };

  const getLabel = (roi: number) => {
    if (roi < 0) return 'Loss';
    if (roi < 100) return 'Low ROI';
    if (roi < 300) return 'Good ROI';
    return 'Excellent ROI';
  };

  const normalizedValue = Math.max(-100, Math.min(500, value));
  const percentage = ((normalizedValue + 100) / 600) * 100;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Gauge Container */}
      <div className="relative w-32 h-32">
        {/* Background Circle */}
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={getColor(value)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
            className="transition-all duration-500"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: getColor(value) }}>
            {value.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: getColor(value) }}>
          {getLabel(value)}
        </p>
      </div>

      {/* ROI Scale Reference */}
      <div className="text-xs text-muted-foreground text-center">
        <div className="flex justify-between w-48">
          <span>-100%</span>
          <span>0%</span>
          <span>100%</span>
          <span>300%</span>
          <span>500%+</span>
        </div>
        <div className="flex justify-between w-48 mt-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="w-2 h-2 bg-border rounded-full"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
