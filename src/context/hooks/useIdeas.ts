
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis } from '@/types';
import { generateId, getInitialData, saveData } from '../utils/dataUtils';

export const useIdeas = (
  user: any,
  currentCompany: any,
  hypotheses: Hypothesis[]
) => {
  const userId = user?.id;
  
  const [ideas, setIdeas] = useState<GrowthIdea[]>(() => 
    getInitialData('ideas', [], userId)
  );
  
  useEffect(() => {
    saveData('ideas', ideas, userId);
  }, [ideas, userId]);

  const filteredIdeas = ideas.filter(idea => 
    !currentCompany || idea.companyId === currentCompany.id || !idea.companyId
  );
  
  const addIdea = (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    setIdeas([
      ...ideas,
      {
        ...idea,
        id: generateId(),
        createdAt: new Date(),
        userId: user?.id || undefined,
        userName: user?.user_metadata?.full_name || user?.email || undefined,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editIdea = (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, ...ideaUpdates } : idea
    ));
  };
  
  const deleteIdea = (id: string) => {
    const hypothesisWithIdea = hypotheses.find(h => h.ideaId === id);
    
    if (hypothesisWithIdea) {
      alert('Cannot delete idea that has a hypothesis associated with it.');
      return;
    }
    
    setIdeas(ideas.filter(idea => idea.id !== id));
  };

  const getIdeaById = (id: string) => filteredIdeas.find(idea => idea.id === id);
  
  return {
    ideas: filteredIdeas,
    addIdea,
    editIdea,
    deleteIdea,
    getIdeaById
  };
};
