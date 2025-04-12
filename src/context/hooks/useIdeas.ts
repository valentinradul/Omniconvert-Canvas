
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis, Category, ALL_CATEGORIES } from '@/types';
import { generateId } from '../utils/dataUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useIdeas = (
  user: any,
  currentCompany: any,
  hypotheses: Hypothesis[]
) => {
  const [ideas, setIdeas] = useState<GrowthIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper function to parse category
  const parseCategory = (category: string | null): Category => {
    if (!category) return "Other";
    
    if (ALL_CATEGORIES.includes(category as Category)) {
      return category as Category;
    }
    return "Other";
  };
  
  // Fetch ideas from Supabase when the user or company changes
  useEffect(() => {
    const fetchIdeas = async () => {
      if (!user?.id) {
        console.log('No user ID found, skipping ideas fetch');
        setIdeas([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      console.log('Fetching ideas for user:', user.id, 'company:', currentCompany?.id || 'no company');
      
      try {
        // Try to fetch ideas from Supabase
        let query = supabase.from('ideas')
          .select('*');
        
        // Only filter by user ID if we're not in development mode
        if (process.env.NODE_ENV !== 'development') {
          query = query.eq('userid', user.id);
        }
          
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our GrowthIdea type
          const formattedIdeas: GrowthIdea[] = data.map(idea => ({
            id: idea.id,
            title: idea.title || '',
            description: idea.description || '',
            category: parseCategory(idea.category),
            departmentId: idea.departmentid || '',
            tags: idea.tags || [],
            createdAt: new Date(idea.createdat || Date.now()),
            userId: idea.userid,
            userName: idea.username || 'Unknown',
            companyId: idea.company_id
          }));
          
          setIdeas(formattedIdeas);
          console.log(`Successfully fetched ${formattedIdeas.length} ideas from Supabase:`, formattedIdeas);
        }
      } catch (error: any) {
        console.error('Error fetching ideas:', error.message, error.stack);
        toast.error('Failed to load ideas, trying fallback');
        
        // Fallback to localStorage if Supabase fetch fails
        const userKey = `ideas_${user.id}`;
        const savedIdeas = localStorage.getItem(userKey);
        if (savedIdeas) {
          try {
            const parsedIdeas = JSON.parse(savedIdeas);
            setIdeas(parsedIdeas);
            console.log('Retrieved ideas from localStorage:', parsedIdeas);
          } catch (e) {
            console.error('Error parsing saved ideas:', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIdeas();
  }, [user?.id, currentCompany?.id]);
  
  // Filter ideas by company
  const filteredIdeas = ideas.filter(idea => 
    !currentCompany || idea.companyId === currentCompany.id || !idea.companyId
  );
  
  // Add a new idea
  const addIdea = async (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => {
    try {
      // First, add to Supabase
      const { data, error } = await supabase.from('ideas').insert({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        departmentid: idea.departmentId,
        tags: idea.tags,
        userid: user?.id,
        username: user?.user_metadata?.full_name || user?.email,
        company_id: currentCompany?.id
      }).select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newIdea: GrowthIdea = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          category: parseCategory(data[0].category),
          departmentId: data[0].departmentid || '',
          tags: data[0].tags || [],
          createdAt: new Date(data[0].createdat),
          userId: data[0].userid,
          userName: data[0].username,
          companyId: data[0].company_id
        };
        
        setIdeas(prevIdeas => [...prevIdeas, newIdea]);
        toast.success('Idea added successfully');
      }
    } catch (error: any) {
      console.error('Error adding idea:', error.message);
      toast.error('Failed to add idea');
      
      // Fallback to local storage
      const newIdea = {
        ...idea,
        id: generateId(),
        createdAt: new Date(),
        userId: user?.id,
        userName: user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id
      };
      
      setIdeas(prevIdeas => [...prevIdeas, newIdea]);
      
      // Update local storage
      const userKey = `ideas_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify([...ideas, newIdea]));
    }
  };
  
  // Edit an existing idea
  const editIdea = async (id: string, ideaUpdates: Partial<GrowthIdea>) => {
    try {
      // First update in Supabase
      const updates: Record<string, any> = {};
      
      if (ideaUpdates.title !== undefined) {
        updates.title = ideaUpdates.title;
      }
      
      if (ideaUpdates.description !== undefined) {
        updates.description = ideaUpdates.description;
      }
      
      if (ideaUpdates.category !== undefined) {
        updates.category = ideaUpdates.category;
      }
      
      if (ideaUpdates.departmentId !== undefined) {
        updates.departmentid = ideaUpdates.departmentId;
      }
      
      if (ideaUpdates.tags !== undefined) {
        updates.tags = ideaUpdates.tags;
      }
      
      const { error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Then update local state
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => idea.id === id ? { ...idea, ...ideaUpdates } : idea)
      );
      
      toast.success('Idea updated successfully');
    } catch (error: any) {
      console.error('Error updating idea:', error.message);
      toast.error('Failed to update idea');
      
      // Still update the local state as fallback
      setIdeas(ideas.map(idea => 
        idea.id === id ? { ...idea, ...ideaUpdates } : idea
      ));
    }
  };
  
  // Delete an idea
  const deleteIdea = async (id: string) => {
    const hypothesisWithIdea = hypotheses.find(h => h.ideaId === id);
    
    if (hypothesisWithIdea) {
      toast.error('Cannot delete idea that has a hypothesis associated with it.');
      return;
    }
    
    try {
      // First delete from Supabase
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Then update local state
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== id));
      toast.success('Idea deleted successfully');
    } catch (error: any) {
      console.error('Error deleting idea:', error.message);
      toast.error('Failed to delete idea');
      
      // Still update the local state as fallback
      setIdeas(ideas.filter(idea => idea.id !== id));
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
