
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis } from '@/types';
import { generateId, getInitialData, mergeDataFromAllSources } from '../utils/dataUtils';

export const useIdeas = (
  user: any,
  currentCompany: any,
  hypotheses: Hypothesis[]
) => {
  const [ideas, setIdeas] = useState<GrowthIdea[]>(() => {
    // Check for user-specific data first
    if (user?.id) {
      console.log(`Loading ideas for user: ${user.id}`);
      const userKey = `ideas_${user.id}`;
      return getInitialData(userKey, []);
    }
    
    // If no user, try to load from generic key as fallback
    console.log('No user ID found, trying to load ideas from generic key');
    const genericData = getInitialData('ideas', []);
    
    // Try to merge from multiple possible keys
    if (genericData.length === 0) {
      console.log('No ideas found in primary key, attempting to recover from all sources');
      return mergeDataFromAllSources(['ideas', 'ideas_data', 'growth_ideas'], []);
    }
    
    return genericData;
  });
  
  useEffect(() => {
    // Only save data if there's an authenticated user
    if (user?.id) {
      const userKey = `ideas_${user.id}`;
      console.log(`Saving ${ideas.length} ideas to key: ${userKey}`);
      localStorage.setItem(userKey, JSON.stringify(ideas));
    } else {
      console.log('No user ID found, skipping ideas save');
    }
  }, [ideas, user?.id]);

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
