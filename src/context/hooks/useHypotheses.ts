import { useState, useEffect } from 'react';
import { Hypothesis, HypothesisStatus, PECTIWeights } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useHypotheses = (
  user: any,
  currentCompany: any,
  experiments: any[]
) => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch hypotheses from Supabase when user or company changes
  useEffect(() => {
    const fetchHypotheses = async () => {
      if (!user) {
        setHypotheses([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        let query = supabase.from('hypotheses').select('*');
        
        // Filter by company if applicable
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setHypotheses(data || []);
      } catch (error: any) {
        console.error('Error fetching hypotheses:', error.message);
        toast({
          variant: 'destructive',
          title: 'Failed to load hypotheses',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHypotheses();
  }, [user, currentCompany]);
  
  const filteredHypotheses = hypotheses;
  
  const addHypothesis = async (hypothesis: Omit<Hypothesis, 'id' | 'createdAt'>) => {
    if (!user || !currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in and select a company to add hypotheses.',
      });
      return;
    }
    
    try {
      const newHypothesis = {
        ...hypothesis,
        userid: user.id,
        username: user.user_metadata?.full_name || user.email,
        company_id: currentCompany.id,
        status: hypothesis.status || 'Backlog',
        createdat: new Date(),
        ideaid: hypothesis.ideaId // Map to the column name in Supabase
      };
      
      // Clean up properties to match database column names
      if ('ideaId' in newHypothesis) {
        delete newHypothesis.ideaId;
      }
      
      const { data, error } = await supabase
        .from('hypotheses')
        .insert(newHypothesis)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform database column names back to camelCase for frontend usage
      const formattedHypothesis: Hypothesis = {
        ...data,
        ideaId: data.ideaid,
        userId: data.userid,
        userName: data.username,
        createdAt: new Date(data.createdat)
      };
      
      setHypotheses([...hypotheses, formattedHypothesis]);
      
      toast({
        title: 'Hypothesis created',
        description: 'Your hypothesis has been saved successfully.',
      });
    } catch (error: any) {
      console.error('Error adding hypothesis:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to add hypothesis',
        description: error.message,
      });
    }
  };
  
  const editHypothesis = async (id: string, hypothesisUpdates: Partial<Hypothesis>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to edit hypotheses.',
      });
      return;
    }
    
    try {
      // Map frontend property names to database column names
      const updates = {
        ...hypothesisUpdates,
        ideaid: hypothesisUpdates.ideaId,
        userid: hypothesisUpdates.userId,
        username: hypothesisUpdates.userName,
      };
      
      // Remove frontend properties that don't match database column names
      ['ideaId', 'userId', 'userName', 'createdAt'].forEach(prop => {
        if (prop in updates) {
          delete updates[prop];
        }
      });
      
      const { data, error } = await supabase
        .from('hypotheses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setHypotheses(hypotheses.map(hypothesis => 
        hypothesis.id === id ? { ...hypothesis, ...hypothesisUpdates } : hypothesis
      ));
      
      toast({
        title: 'Hypothesis updated',
        description: 'Your hypothesis has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating hypothesis:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to update hypothesis',
        description: error.message,
      });
    }
  };
  
  const deleteHypothesis = async (id: string) => {
    const experimentWithHypothesis = experiments.find(e => e.hypothesisId === id);
    
    if (experimentWithHypothesis) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete hypothesis',
        description: 'Cannot delete hypothesis that has an experiment associated with it.',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hypotheses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setHypotheses(hypotheses.filter(hypothesis => hypothesis.id !== id));
      
      toast({
        title: 'Hypothesis deleted',
        description: 'The hypothesis has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting hypothesis:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to delete hypothesis',
        description: error.message,
      });
    }
  };

  const updateAllHypothesesWeights = (pectiWeights: PECTIWeights) => {
    // This operation can stay client-side since it just affects local calculation
    // without changing the stored data structure
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
    isLoading,
    addHypothesis,
    editHypothesis,
    deleteHypothesis,
    updateAllHypothesesWeights,
    getHypothesisByIdeaId,
    getHypothesisById
  };
};
