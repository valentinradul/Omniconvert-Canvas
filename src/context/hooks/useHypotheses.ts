import { useState, useEffect } from 'react';
import { Hypothesis, HypothesisStatus, PECTIWeights } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        
        // Transform database fields to match frontend model
        const formattedHypotheses: Hypothesis[] = (data || []).map(h => ({
          id: h.id,
          ideaId: h.ideaid || "",
          observation: h.observation || "",
          observationContent: h.observationcontent as any,
          initiative: h.initiative || "",
          metric: h.metric || "",
          pectiScore: h.pectiscore as any || {
            potential: 1,
            ease: 1,
            cost: 1,
            time: 1,
            impact: 1
          },
          createdAt: new Date(h.createdat),
          userId: h.userid,
          userName: h.username,
          status: h.status as HypothesisStatus || "Backlog",
          companyId: h.company_id
        }));
        
        setHypotheses(formattedHypotheses);
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
      // Map frontend properties to database column names
      const newHypothesis = {
        ideaid: hypothesis.ideaId,
        observation: hypothesis.observation,
        observationcontent: hypothesis.observationContent,
        initiative: hypothesis.initiative,
        metric: hypothesis.metric,
        pectiscore: hypothesis.pectiScore,
        status: hypothesis.status || 'Backlog',
        userid: user.id,
        username: user.user_metadata?.full_name || user.email,
        company_id: currentCompany.id
      };
      
      const { data, error } = await supabase
        .from('hypotheses')
        .insert(newHypothesis)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform the returned data to match our frontend model
      const formattedHypothesis: Hypothesis = {
        id: data.id,
        ideaId: data.ideaid || "",
        observation: data.observation || "",
        observationContent: data.observationcontent as any,
        initiative: data.initiative || "",
        metric: data.metric || "",
        pectiScore: data.pectiscore as any || {
          potential: 1,
          ease: 1,
          cost: 1,
          time: 1,
          impact: 1
        },
        createdAt: new Date(data.createdat),
        userId: data.userid,
        userName: data.username,
        status: data.status as HypothesisStatus || "Backlog",
        companyId: data.company_id
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
      // Map frontend properties to database column names
      const updates: any = {};
      
      if ('ideaId' in hypothesisUpdates) updates.ideaid = hypothesisUpdates.ideaId;
      if ('observation' in hypothesisUpdates) updates.observation = hypothesisUpdates.observation;
      if ('observationContent' in hypothesisUpdates) updates.observationcontent = hypothesisUpdates.observationContent;
      if ('initiative' in hypothesisUpdates) updates.initiative = hypothesisUpdates.initiative;
      if ('metric' in hypothesisUpdates) updates.metric = hypothesisUpdates.metric;
      if ('pectiScore' in hypothesisUpdates) updates.pectiscore = hypothesisUpdates.pectiScore;
      if ('status' in hypothesisUpdates) updates.status = hypothesisUpdates.status;
      
      const { data, error } = await supabase
        .from('hypotheses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state with the edited hypothesis
      setHypotheses(hypotheses.map(hypothesis => 
        hypothesis.id === id ? {
          ...hypothesis,
          ...hypothesisUpdates
        } : hypothesis
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
