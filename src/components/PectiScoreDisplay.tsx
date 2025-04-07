
import React from 'react';
import { PECTI } from '@/types';
import { Progress } from '@/components/ui/progress';

interface PectiScoreDisplayProps {
  pecti: PECTI;
  showProgressBar?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PectiScoreDisplay: React.FC<PectiScoreDisplayProps> = ({ 
  pecti, 
  showProgressBar = true,
  showPercentage = false,
  size = 'md'
}) => {
  const getTotal = () => {
    const { potential, expense, confidence, time, impact } = pecti;
    return potential + expense + confidence + time + impact;
  };
  
  const getPercentage = () => {
    const total = getTotal();
    const maxPossible = 50; // 5 categories, each with max value of 10
    return Math.round((total / maxPossible) * 100);
  };
  
  const getLabel = () => {
    const percentage = getPercentage();
    
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Moderate';
    if (percentage >= 20) return 'Low';
    return 'Very Low';
  };
  
  const getClassName = () => {
    if (size === 'sm') return 'text-xs';
    if (size === 'lg') return 'text-lg';
    return 'text-sm';
  };
  
  // Calculate base circle size based on the component size
  const getCircleSize = () => {
    if (size === 'sm') return 'w-12 h-12';
    if (size === 'lg') return 'w-24 h-24';
    return 'w-16 h-16';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`${getCircleSize()} rounded-full bg-gray-100 flex items-center justify-center relative mb-2`}>
        <div className={`text-center ${getClassName()}`}>
          <div className="font-bold">
            {getPercentage()}%
          </div>
          <div className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
            {getLabel()}
          </div>
        </div>
      </div>
      
      {showProgressBar && (
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs">
            <span>P</span>
            <span>{pecti.potential}</span>
          </div>
          <Progress value={pecti.potential * 10} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>E</span>
            <span>{pecti.expense}</span>
          </div>
          <Progress value={pecti.expense * 10} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>C</span>
            <span>{pecti.confidence}</span>
          </div>
          <Progress value={pecti.confidence * 10} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>T</span>
            <span>{pecti.time}</span>
          </div>
          <Progress value={pecti.time * 10} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>I</span>
            <span>{pecti.impact}</span>
          </div>
          <Progress value={pecti.impact * 10} className="h-1" />
        </div>
      )}
      
      {showPercentage && !showProgressBar && (
        <div className={`${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          PECTI Score: {getPercentage()}%
        </div>
      )}
    </div>
  );
};

export default PectiScoreDisplay;
