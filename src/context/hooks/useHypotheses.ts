
import { useState, useEffect } from 'react';
import { Hypothesis, HypothesisStatus, PECTIWeights } from '@/types';
import { generateId, getInitialData, saveData } from '../utils/dataUtils';

export const useHypotheses = (
  user: any,
  currentCompany: any,
  experiments: any[]
) => {
  const userId = user?.id;
  
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(() => 
    getInitialData('hypotheses', [], userId)
  );
  
  useEffect(() => {
    saveData('hypotheses', hypotheses, userId);
  }, [hypotheses, userId]);

  const filteredHypotheses = hypotheses.filter(hypothesis => 
    !currentCompany || hypothesis.companyId === currentCompany.id || !hypothesis.companyId
  );
  
  const addHypothesis = (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    setHypotheses([
      ...hypotheses,
      {
        ...hypothesis,
        id: generateId(),
        createdAt: new Date(),
        status: hypothesis.status || 'Backlog',
        userId: hypothesis.userId || user?.id,
        userName: user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editHypothesis = (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    setHypotheses(hypotheses.map(hypothesis => 
      hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
    ));
  };
  
  const deleteHypothesis = (id: string) => {
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      alert('Cannot delete hypothesis that has an experiment associated with it.');
      return;
    }
    
    setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
  };

  const updateAllHypothesesWeights = (pectiWeights: PECTIWeights) => {
    setHypotheses(prevHypotheses => 
      prevHypotheses.map(hypothesis => ({
        ...hypothesis,
        // We keep the original PECTI scores but apply the new weights when calculating percentages
      }))
    );
  };

  const getHypothesisByIdeaId = (ideaId: string) => filteredHypotheses.find(h => h.ideaId === ideaId);
  const getHypothesisById = (id: string) => filteredHypotheses.find(h => h.id === id);
  
  return {
    hypotheses: filteredHypotheses,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    updateAllHypothesesWeights,
    getHypothesisByIdeaId,
    getHypothesisById
  };
};
