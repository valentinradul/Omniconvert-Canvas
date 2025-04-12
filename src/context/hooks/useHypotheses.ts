
import { useState, useEffect } from 'react';
import { Hypothesis, HypothesisStatus, PECTIWeights, PECTI } from '@/types';
import { generateId, getInitialData } from '../utils/dataUtils';
import { toast } from 'sonner';

export const useHypotheses = (
  user: any,
  currentCompany: any,
  experiments: any[]
) => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(() => {
    // Only load hypotheses if there's a user and associate with their ID
    if (user?.id) {
      console.log(`Loading hypotheses for user: ${user.id}`);
      const userKey = `hypotheses_${user.id}`;
      const loadedHypotheses = getInitialData<any[]>(userKey, []);
      
      // Validate and normalize
      const validatedHypotheses = loadedHypotheses.map(hypothesis => ({
        ...hypothesis,
        status: hypothesis.status || 'Backlog',
        pectiScore: hypothesis.pectiScore || {
          potential: 0,
          ease: 0,
          confidence: 0,
          timebound: 0,
          impact: 0
        }
      }));
      
      console.log(`Loaded ${validatedHypotheses.length} hypotheses for user ${user.id}`);
      return validatedHypotheses;
    }
    
    console.log('No user ID found, skipping hypotheses fetch');
    return [];
  });
  
  useEffect(() => {
    // Only save data if there's an authenticated user
    if (user?.id) {
      const userKey = `hypotheses_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(hypotheses));
      console.log(`Saved ${hypotheses.length} hypotheses for user ${user.id}`);
    } else {
      console.log('No user ID found, skipping hypotheses save');
    }
  }, [hypotheses, user?.id]);

  const filteredHypotheses = hypotheses.filter(hypothesis => 
    !currentCompany || hypothesis.companyId === currentCompany.id || !hypothesis.companyId
  );
  
  const addHypothesis = (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    if (!user?.id) {
      toast.error('You must be logged in to add hypotheses');
      return;
    }
    
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
    
    toast.success('Hypothesis added successfully!');
  };
  
  const editHypothesis = (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    setHypotheses(hypotheses.map(hypothesis => 
      hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
    ));
  };
  
  const deleteHypothesis = (id: string) => {
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      toast.error('Cannot delete hypothesis that has an experiment associated with it.');
      return;
    }
    
    setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
    toast.success('Hypothesis deleted successfully');
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
