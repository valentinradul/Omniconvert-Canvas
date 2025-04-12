
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis, Category } from '@/types';
import { generateId, getInitialData } from '../utils/dataUtils';
import { toast } from 'sonner';

const isValidCategory = (value: any): value is Category => {
  const validCategories = ['Acquisition', 'Activation', 'Retention', 'Revenue', 'Referral'];
  return typeof value === 'string' && validCategories.includes(value);
};

export const useIdeas = (
  user: any,
  currentCompany: any,
  hypotheses: Hypothesis[]
) => {
  const [ideas, setIdeas] = useState<GrowthIdea[]>(() => {
    // Only load ideas if there's a user and associate with their ID
    if (user?.id) {
      console.log(`Loading ideas for user: ${user.id}`);
      const userKey = `ideas_${user.id}`;
      const loadedIdeas = getInitialData(userKey, []);
      
      // Validate and convert categories
      const validatedIdeas = loadedIdeas.map((idea: any) => ({
        ...idea,
        category: isValidCategory(idea.category) ? idea.category : 'Activation',
      }));
      
      console.log(`Loaded ${validatedIdeas.length} ideas for user ${user.id}`);
      return validatedIdeas;
    }
    
    console.log('No user ID found, skipping ideas fetch');
    return [];
  });
  
  useEffect(() => {
    // Only save data if there's an authenticated user
    if (user?.id) {
      const userKey = `ideas_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(ideas));
      console.log(`Saved ${ideas.length} ideas for user ${user.id}`);
    } else {
      console.log('No user ID found, skipping ideas save');
    }
  }, [ideas, user?.id]);

  const filteredIdeas = ideas.filter(idea => 
    !currentCompany || idea.companyId === currentCompany.id || !idea.companyId
  );
  
  const addIdea = (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    if (!user?.id) {
      toast.error('You must be logged in to add ideas');
      return;
    }
    
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
    
    toast.success('Idea added successfully!');
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
    toast.success('Idea deleted successfully');
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
