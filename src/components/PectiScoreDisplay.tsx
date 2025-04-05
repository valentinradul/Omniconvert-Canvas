
import React from 'react';
import { PECTI } from '@/types';

interface PectiScoreDisplayProps {
  pecti: PECTI;
}

const PectiScoreDisplay: React.FC<PectiScoreDisplayProps> = ({ pecti }) => {
  const { potential, ease, cost, time, impact } = pecti;

  const renderScoreBadge = (score: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center pecti-score-${score}`}>
        {score}
      </span>
    </div>
  );

  return (
    <div className="flex gap-3 justify-center">
      {renderScoreBadge(potential, 'P')}
      {renderScoreBadge(ease, 'E')}
      {renderScoreBadge(cost, 'C')}
      {renderScoreBadge(time, 'T')}
      {renderScoreBadge(impact, 'I')}
    </div>
  );
};

export default PectiScoreDisplay;
