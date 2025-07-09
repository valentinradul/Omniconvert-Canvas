
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis } from '@/types';
import { fetchIdeas, createIdea, updateIdea, deleteIdeaById, NewIdea } from '@/services/ideasService';
import { canDeleteIdea } from '@/validators/ideaValidators';
import { useToast } from '@/hooks/use-toast';

export const useIdeas = (
  user: any,
  currentCompany: any,
  hypotheses: Hypothesis[]
) => {
  const [ideas, setIdeas] = useState<GrowthIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch ideas from Supabase when user or company changes
  useEffect(() => {
    const loadIdeas = async () => {
      if (!user) {
        setIdeas([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const data = await fetchIdeas(currentCompany?.id);
        setIdeas(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load ideas',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIdeas();
  }, [user, currentCompany, toast]);
  
  const filteredIdeas = ideas;
  
  const addIdea = async (idea: Omit<GrowthIdea, 'id' | 'createdAt'>): Promise<GrowthIdea | null> => {
    if (!user || !currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in and select a company to add ideas.',
      });
      return null;
    }
    
    try {
      const newIdeaData: NewIdea = {
        ...idea,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email,
        companyId: currentCompany.id
      };
      
      const createdIdea = await createIdea(newIdeaData);
      
      if (createdIdea) {
        setIdeas([...ideas, createdIdea]);
        
        toast({
          title: 'Idea created',
          description: 'Your growth idea has been saved successfully.',
        });
      }
      
      return createdIdea;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add idea',
        description: error.message,
      });
      return null;
    }
  };
  
  const editIdea = async (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to edit ideas.',
      });
      return;
    }
    
    try {
      await updateIdea(id, ideaUpdates);
      
      // Update the local state with the edited idea
      setIdeas(ideas.map(idea => 
        idea.id === id ? { 
          ...idea,
          ...ideaUpdates
        } : idea
      ));
      
      toast({
        title: 'Idea updated',
        description: 'Your growth idea has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update idea',
        description: error.message,
      });
    }
  };
  
  const deleteIdea = async (id: string) => {
    if (!canDeleteIdea(id, hypotheses)) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete idea',
        description: 'Cannot delete idea that has a hypothesis associated with it.',
      });
      return;
    }
    
    try {
      await deleteIdeaById(id);
      
      setIdeas(ideas.filter(idea => idea.id !== id));
      
      toast({
        title: 'Idea deleted',
        description: 'The growth idea has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete idea',
        description: error.message,
      });
    }
  };

  const getIdeaById = (id: string) => filteredIdeas.find(idea => idea.id === id);
  
  return {
    ideas: filteredIdeas,
    isLoading,
    addIdea,
    editIdea,
    deleteIdea,
    getIdeaById
  };
};
