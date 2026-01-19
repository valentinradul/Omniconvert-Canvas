
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
  const [archivedIdeas, setArchivedIdeas] = useState<GrowthIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const { toast } = useToast();
  
  // Fetch ideas from Supabase when user or company changes
  useEffect(() => {
    const loadIdeas = async () => {
      if (!user) {
        setIdeas([]);
        setArchivedIdeas([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const data = await fetchIdeas(currentCompany?.id, false);
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
  
  // Function to load archived ideas on demand
  const loadArchivedIdeas = async () => {
    if (!user || !currentCompany?.id) return;
    
    setIsLoadingArchived(true);
    try {
      const allIdeas = await fetchIdeas(currentCompany.id, true);
      const archived = allIdeas.filter(idea => idea.isArchived === true);
      setArchivedIdeas(archived);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load archived ideas',
        description: error.message,
      });
    } finally {
      setIsLoadingArchived(false);
    }
  };
  
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
      
      // Handle archive/unarchive separately
      if ('isArchived' in ideaUpdates) {
        if (ideaUpdates.isArchived) {
          // Move idea from active to archived
          const ideaToArchive = ideas.find(idea => idea.id === id);
          if (ideaToArchive) {
            setIdeas(ideas.filter(idea => idea.id !== id));
            setArchivedIdeas([...archivedIdeas, { ...ideaToArchive, isArchived: true }]);
          }
        } else {
          // Move idea from archived to active
          const ideaToUnarchive = archivedIdeas.find(idea => idea.id === id);
          if (ideaToUnarchive) {
            setArchivedIdeas(archivedIdeas.filter(idea => idea.id !== id));
            setIdeas([...ideas, { ...ideaToUnarchive, isArchived: false }]);
          }
        }
        
        toast({
          title: ideaUpdates.isArchived ? 'Idea archived' : 'Idea restored',
          description: ideaUpdates.isArchived 
            ? 'The idea has been moved to archive.' 
            : 'The idea has been restored from archive.',
        });
      } else {
        // Regular update
        setIdeas(ideas.map(idea => 
          idea.id === id ? { ...idea, ...ideaUpdates } : idea
        ));
        setArchivedIdeas(archivedIdeas.map(idea => 
          idea.id === id ? { ...idea, ...ideaUpdates } : idea
        ));
        
        toast({
          title: 'Idea updated',
          description: 'Your growth idea has been updated successfully.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update idea',
        description: error.message,
      });
    }
  };
  
  const archiveIdea = async (id: string) => {
    await editIdea(id, { isArchived: true });
  };
  
  const unarchiveIdea = async (id: string) => {
    await editIdea(id, { isArchived: false });
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

  const getIdeaById = (id: string) => {
    return filteredIdeas.find(idea => idea.id === id) || 
           archivedIdeas.find(idea => idea.id === id);
  };
  
  return {
    ideas: filteredIdeas,
    archivedIdeas,
    isLoading,
    isLoadingArchived,
    addIdea,
    editIdea,
    deleteIdea,
    archiveIdea,
    unarchiveIdea,
    loadArchivedIdeas,
    getIdeaById
  };
};
