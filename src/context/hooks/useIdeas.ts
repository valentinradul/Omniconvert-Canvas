
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis } from '@/types';
import { generateId } from '../utils/dataUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
    const fetchIdeas = async () => {
      if (!user) {
        setIdeas([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        let query = supabase.from('ideas').select('*');
        
        // Filter by company if applicable
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setIdeas(data || []);
      } catch (error: any) {
        console.error('Error fetching ideas:', error.message);
        toast({
          variant: 'destructive',
          title: 'Failed to load ideas',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIdeas();
  }, [user, currentCompany]);
  
  const filteredIdeas = ideas;
  
  const addIdea = async (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    if (!user || !currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in and select a company to add ideas.',
      });
      return;
    }
    
    try {
      const newIdea = {
        ...idea,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email,
        company_id: currentCompany.id,
        departmentid: idea.departmentId // Map to the column name in Supabase
      };
      
      const { data, error } = await supabase
        .from('ideas')
        .insert(newIdea)
        .select()
        .single();
      
      if (error) throw error;
      
      setIdeas([...ideas, data]);
      
      toast({
        title: 'Idea created',
        description: 'Your growth idea has been saved successfully.',
      });
    } catch (error: any) {
      console.error('Error adding idea:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to add idea',
        description: error.message,
      });
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
      // Map departmentId to departmentid if it exists in updates
      const updates = {
        ...ideaUpdates,
        departmentid: ideaUpdates.departmentId,
      };
      
      // Remove departmentId as it doesn't match the database column name
      if ('departmentId' in updates) {
        delete updates.departmentId;
      }
      
      const { data, error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, ...ideaUpdates } : idea
      ));
      
      toast({
        title: 'Idea updated',
        description: 'Your growth idea has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating idea:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to update idea',
        description: error.message,
      });
    }
  };
  
  const deleteIdea = async (id: string) => {
    const hypothesisWithIdea = hypotheses.find(h => h.ideaId === id);
    
    if (hypothesisWithIdea) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete idea',
        description: 'Cannot delete idea that has a hypothesis associated with it.',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setIdeas(ideas.filter(idea => idea.id !== id));
      
      toast({
        title: 'Idea deleted',
        description: 'The growth idea has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting idea:', error.message);
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
