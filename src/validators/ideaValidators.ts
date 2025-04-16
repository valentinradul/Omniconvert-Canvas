
import { Hypothesis, GrowthIdea } from '@/types';

export const canDeleteIdea = (id: string, hypotheses: Hypothesis[]): boolean => {
  return !hypotheses.some(h => h.ideaId === id);
};

export const isValidNewIdea = (idea: any): boolean => {
  return !!(idea.title && idea.description && idea.category);
};
