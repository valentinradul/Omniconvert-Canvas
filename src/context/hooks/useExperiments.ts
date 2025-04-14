
import { useState, useEffect } from 'react';
import { Experiment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch experiments from Supabase when user or company changes
  useEffect(() => {
    const fetchExperiments = async () => {
      if (!user) {
        setExperiments([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        let query = supabase.from('experiments').select('*');
        
        // Filter by company if applicable
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Map from database column names to frontend property names
        const formattedExperiments: Experiment[] = (data || []).map(exp => ({
          ...exp,
          hypothesisId: exp.hypothesisid,
          userId: exp.userid,
          userName: exp.username,
          createdAt: new Date(exp.createdat),
          updatedAt: new Date(exp.updatedat)
        }));
        
        setExperiments(formattedExperiments);
      } catch (error: any) {
        console.error('Error fetching experiments:', error.message);
        toast({
          variant: 'destructive',
          title: 'Failed to load experiments',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExperiments();
  }, [user, currentCompany]);
  
  const filteredExperiments = experiments;
  
  const addExperiment = async (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in and select a company to add experiments.',
      });
      return;
    }
    
    try {
      const now = new Date();
      
      // Map frontend property names to database column names
      const newExperiment = {
        ...experiment,
        hypothesisid: experiment.hypothesisId,
        userid: experiment.userId || user.id,
        username: experiment.userName || user.user_metadata?.full_name || user.email,
        company_id: currentCompany.id,
        createdat: now,
        updatedat: now
      };
      
      // Clean up properties to match database column names
      ['hypothesisId', 'userId', 'userName', 'createdAt', 'updatedAt'].forEach(prop => {
        if (prop in newExperiment) {
          delete newExperiment[prop];
        }
      });
      
      const { data, error } = await supabase
        .from('experiments')
        .insert(newExperiment)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform database column names back to camelCase for frontend usage
      const formattedExperiment: Experiment = {
        ...data,
        hypothesisId: data.hypothesisid,
        userId: data.userid,
        userName: data.username,
        createdAt: new Date(data.createdat),
        updatedAt: new Date(data.updatedat)
      };
      
      setExperiments([...experiments, formattedExperiment]);
      
      toast({
        title: 'Experiment created',
        description: 'Your experiment has been saved successfully.',
      });
    } catch (error: any) {
      console.error('Error adding experiment:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to add experiment',
        description: error.message,
      });
    }
  };
  
  const editExperiment = async (id: string, experimentUpdates: Partial<Experiment>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to edit experiments.',
      });
      return;
    }
    
    try {
      // Map frontend property names to database column names
      const updates = {
        ...experimentUpdates,
        hypothesisid: experimentUpdates.hypothesisId,
        userid: experimentUpdates.userId,
        username: experimentUpdates.userName,
        updatedat: new Date()
      };
      
      // Remove frontend properties that don't match database column names
      ['hypothesisId', 'userId', 'userName', 'createdAt', 'updatedAt'].forEach(prop => {
        if (prop in updates) {
          delete updates[prop];
        }
      });
      
      const { data, error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setExperiments(experiments.map(experiment => 
        experiment.id === id ? { 
          ...experiment, 
          ...experimentUpdates,
          updatedAt: new Date()
        } : experiment
      ));
      
      toast({
        title: 'Experiment updated',
        description: 'Your experiment has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating experiment:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to update experiment',
        description: error.message,
      });
    }
  };
  
  const deleteExperiment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setExperiments(experiments.filter(experiment => experiment.id !== id));
      
      toast({
        title: 'Experiment deleted',
        description: 'The experiment has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting experiment:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to delete experiment',
        description: error.message,
      });
    }
  };

  const getExperimentByHypothesisId = (hypothesisId: string) => filteredExperiments.find(e => e.hypothesisId === hypothesisId);
  
  return {
    experiments: filteredExperiments,
    isLoading,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId
  };
};
