
import { useState, useEffect } from 'react';
import { Hypothesis } from '@/types';
import { generateId, getInitialData } from './utils';

export const useHypotheses = (
  user: { id?: string; user_metadata?: { full_name?: string }; email?: string } | null
) => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(() => 
    getInitialData('hypotheses', [])
  );

  useEffect(() => {
    localStorage.setItem('hypotheses', JSON.stringify(hypotheses));
  }, [hypotheses]);

  const addHypothesis = (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    setHypotheses([
      ...hypotheses,
      {
        ...hypothesis,
        id: generateId(),
        createdAt: new Date(),
        status: hypothesis.status || 'Backlog',
        userId: hypothesis.userId || user?.id,
        userName: hypothesis.userName || user?.user_metadata?.full_name || user?.email
      }
    ]);
  };
  
  const editHypothesis = (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    setHypotheses(hypotheses.map(hypothesis => 
      hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
    ));
  };
  
  const deleteHypothesis = (id: string, experiments: any[]) => {
    // Check if any experiments are associated with this hypothesis
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      alert('Cannot delete hypothesis that has an experiment associated with it.');
      return;
    }
    
    setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
  };

  const getHypothesisById = (id: string) => hypotheses.find(h => h.id === id);
  const getHypothesisByIdeaId = (ideaId: string) => hypotheses.find(h => h.ideaId === ideaId);

  return {
    hypotheses,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    getHypothesisById,
    getHypothesisByIdeaId
  };
};
