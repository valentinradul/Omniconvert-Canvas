
// PECTI scoring types

export type PECTI = {
  potential: 1 | 2 | 3 | 4 | 5;
  ease: 1 | 2 | 3 | 4 | 5;
  cost: 1 | 2 | 3 | 4 | 5;
  time: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
};

export type PECTIWeights = {
  potential: number;
  ease: number;
  cost: number;
  time: number;
  impact: number;
};

// Default weights based on specified percentages:
// Potential - 25%, Ease - 15%, Cost - 15%, Time - 10%, Impact - 35%
export const DEFAULT_PECTI_WEIGHTS: PECTIWeights = {
  potential: 2.5,
  ease: 1.5,
  cost: 1.5,
  time: 1.0,
  impact: 3.5
};

// Helper function to calculate PECTI percentage score with weights
export const calculatePectiPercentage = (
  pectiScore: PECTI, 
  weights: PECTIWeights = DEFAULT_PECTI_WEIGHTS
): number => {
  const { potential, ease, cost, time, impact } = pectiScore;
  const { potential: potentialWeight, ease: easeWeight, cost: costWeight, time: timeWeight, impact: impactWeight } = weights;
  
  // Calculate the sum of weighted scores
  const weightedTotal = 
    potential * potentialWeight + 
    ease * easeWeight + 
    cost * costWeight + 
    time * timeWeight + 
    impact * impactWeight;
  
  // Calculate the maximum possible weighted score
  const maxWeightedScore = 
    5 * potentialWeight + 
    5 * easeWeight + 
    5 * costWeight + 
    5 * timeWeight + 
    5 * impactWeight;
  
  return Math.round((weightedTotal / maxWeightedScore) * 100);
};
