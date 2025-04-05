
import React from 'react';
import { PECTI, calculatePectiPercentage } from '@/types';

interface PectiScoreDisplayProps {
  pecti: PECTI;
  showPercentage?: boolean;
}

const PectiScoreDisplay: React.FC<PectiScoreDisplayProps> = ({ 
  pecti,
  showPercentage = true
}) => {
  const { potential, ease, cost, time, impact } = pecti;
  const percentageScore = calculatePectiPercentage(pecti);

  const renderScoreBadge = (score: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center pecti-score-${score}`}>
        {score}
      </span>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-3 justify-center">
        {renderScoreBadge(potential, 'P')}
        {renderScoreBadge(ease, 'E')}
        {renderScoreBadge(cost, 'C')}
        {renderScoreBadge(time, 'T')}
        {renderScoreBadge(impact, 'I')}
      </div>
      
      {showPercentage && (
        <div className="text-center text-sm">
          <span className="font-medium">Overall Score: </span>
          <span className={`font-bold ${percentageScore >= 70 ? 'text-green-600' : percentageScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {percentageScore}%
          </span>
        </div>
      )}
    </div>
  );
};

export default PectiScoreDisplay;
