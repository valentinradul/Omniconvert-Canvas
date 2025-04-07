
import { useState, useEffect } from 'react';
import { GrowthIdea } from '@/types';
import { generateId, getInitialData } from './utils';

export const useIdeas = (
  user: { id?: string; user_metadata?: { full_name?: string }; email?: string } | null
) => {
  const [ideas, setIdeas] = useState<GrowthIdea[]>(() => 
    getInitialData('ideas', [])
  );

  useEffect(() => {
    localStorage.setItem('ideas', JSON.stringify(ideas));
  }, [ideas]);

  const addIdea = (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    setIdeas([
      ...ideas,
      {
        ...idea,
        id: generateId(),
        createdAt: new Date(),
        userId: user?.id || undefined,
        userName: user?.user_metadata?.full_name || user?.email || undefined
      }
    ]);
  };
  
  const editIdea = (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, ...ideaUpdates } : idea
    ));
  };
  
  const deleteIdea = (id: string, hypotheses: any[]) => {
    // Check if any hypotheses are associated with this idea
    const hypothesisWithIdea = hypotheses.find(h => h.ideaId === id);
    
    if (hypothesisWithIdea) {
      alert('Cannot delete idea that has a hypothesis associated with it.');
      return;
    }
    
    setIdeas(ideas.filter(idea => idea.id !== id));
  };

  const getIdeaById = (id: string) => ideas.find(idea => idea.id === id);

  return {
    ideas,
    addIdea,
    editIdea,
    deleteIdea,
    getIdeaById
  };
};
