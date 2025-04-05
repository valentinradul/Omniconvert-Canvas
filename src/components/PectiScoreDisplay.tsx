
import React from 'react';
import { PECTI, calculatePectiPercentage } from '@/types';
import { Progress } from '@/components/ui/progress';

interface PectiScoreDisplayProps {
  pecti: PECTI;
  showPercentage?: boolean;
  showProgressBar?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PectiScoreDisplay: React.FC<PectiScoreDisplayProps> = ({ 
  pecti,
  showPercentage = true,
  showProgressBar = false,
  className = '',
  size = 'md'
}) => {
  const { potential, ease, cost, time, impact } = pecti;
  const percentageScore = calculatePectiPercentage(pecti);

  const scoreSize = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base'
  };
  
  const labelSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  const renderScoreBadge = (score: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className={`${labelSize[size]} text-gray-500`}>{label}</span>
      <span className={`font-bold rounded-full flex items-center justify-center pecti-score-${score} ${scoreSize[size]}`}>
        {score}
      </span>
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-3 justify-center">
        {renderScoreBadge(potential, 'P')}
        {renderScoreBadge(ease, 'E')}
        {renderScoreBadge(cost, 'C')}
        {renderScoreBadge(time, 'T')}
        {renderScoreBadge(impact, 'I')}
      </div>
      
      {showPercentage && (
        <div className="text-center text-sm">
          <span className="font-medium">Score: </span>
          <span className={`font-bold ${percentageScore >= 70 ? 'text-green-600' : percentageScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {percentageScore}%
          </span>
        </div>
      )}

      {showProgressBar && (
        <Progress 
          value={percentageScore} 
          className={`h-1.5 ${
            percentageScore >= 70 ? 'bg-green-600' : 
            percentageScore >= 40 ? 'bg-amber-600' : 
            'bg-red-600'
          }`}
        />
      )}
    </div>
  );
};

export default PectiScoreDisplay;
