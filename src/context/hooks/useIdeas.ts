
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
    // Only save data if we have a user ID
    if (userId) {
      saveData('ideas', ideas, userId);
    }
  }, [ideas, userId]);

  // Make sure to filter ideas by the current company
  const filteredIdeas = ideas.filter(idea => 
    !currentCompany || idea.companyId === currentCompany?.id || !idea.companyId
  );
  
  const addIdea = (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    if (!userId) return;
    
    setIdeas([
      ...ideas,
      {
        ...idea,
        id: generateId(),
        createdAt: new Date(),
        userId: userId,
        userName: user?.user_metadata?.full_name || user?.email || undefined,
        companyId: currentCompany?.id
      }
    ]);
  };
  
  const editIdea = (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    if (!userId) return;
    
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, ...ideaUpdates } : idea
    ));
  };
  
  const deleteIdea = (id: string) => {
    if (!userId) return;
    
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
