
import React from 'react';
import { PECTI, calculatePectiPercentage, PECTIWeights, DEFAULT_PECTI_WEIGHTS } from '@/types';
import { Progress } from '@/components/ui/progress';

interface PectiScoreDisplayProps {
  pecti: PECTI;
  weights?: PECTIWeights;
  showPercentage?: boolean;
  showProgressBar?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PectiScoreDisplay: React.FC<PectiScoreDisplayProps> = ({ 
  pecti,
  weights = DEFAULT_PECTI_WEIGHTS,
  showPercentage = true,
  showProgressBar = false,
  className = '',
  size = 'md'
}) => {
  const { potential, ease, cost, time, impact } = pecti;
  // Always use the provided weights
  const percentageScore = calculatePectiPercentage(pecti, weights);

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

  // Get percentage score color
  const getScoreColor = () => {
    if (percentageScore >= 70) return 'bg-green-500 text-white';
    if (percentageScore >= 40) return 'bg-amber-500 text-white';
    return 'bg-red-500 text-white';
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
      <div className="flex gap-3 justify-center items-center">
        {renderScoreBadge(potential, 'P')}
        {renderScoreBadge(ease, 'E')}
        {renderScoreBadge(cost, 'C')}
        {renderScoreBadge(time, 'T')}
        {renderScoreBadge(impact, 'I')}
        
        {showPercentage && (
          <div className={`ml-1 w-7 h-7 rounded-full flex items-center justify-center font-bold text-lg ${getScoreColor()}`}>
            {percentageScore}
          </div>
        )}
      </div>

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
