
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
          id: exp.id,
          hypothesisId: exp.hypothesisid || "",
          startDate: exp.startdate ? new Date(exp.startdate) : null,
          endDate: exp.enddate ? new Date(exp.enddate) : null,
          status: exp.status as any || "Planned",
          notes: exp.notes || "",
          observationContent: exp.observationcontent as any,
          createdAt: new Date(exp.createdat),
          updatedAt: new Date(exp.updatedat),
          userId: exp.userid,
          userName: exp.username,
          companyId: exp.company_id
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
      // Map frontend property names to database column names
      const newExperiment = {
        hypothesisid: experiment.hypothesisId,
        startdate: experiment.startDate ? experiment.startDate.toISOString() : null,
        enddate: experiment.endDate ? experiment.endDate.toISOString() : null,
        status: experiment.status,
        notes: experiment.notes,
        observationcontent: experiment.observationContent,
        userid: experiment.userId || user.id,
        username: experiment.userName || user.user_metadata?.full_name || user.email,
        company_id: currentCompany.id
      };
      
      const { data, error } = await supabase
        .from('experiments')
        .insert(newExperiment)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform database column names back to camelCase for frontend usage
      const formattedExperiment: Experiment = {
        id: data.id,
        hypothesisId: data.hypothesisid || "",
        startDate: data.startdate ? new Date(data.startdate) : null,
        endDate: data.enddate ? new Date(data.enddate) : null,
        status: data.status as any || "Planned",
        notes: data.notes || "",
        observationContent: data.observationcontent as any,
        createdAt: new Date(data.createdat),
        updatedAt: new Date(data.updatedat),
        userId: data.userid,
        userName: data.username,
        companyId: data.company_id
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
      const updates: any = {};
      
      if ('hypothesisId' in experimentUpdates) updates.hypothesisid = experimentUpdates.hypothesisId;
      if ('startDate' in experimentUpdates) updates.startdate = experimentUpdates.startDate ? experimentUpdates.startDate.toISOString() : null;
      if ('endDate' in experimentUpdates) updates.enddate = experimentUpdates.endDate ? experimentUpdates.endDate.toISOString() : null;
      if ('status' in experimentUpdates) updates.status = experimentUpdates.status;
      if ('notes' in experimentUpdates) updates.notes = experimentUpdates.notes;
      if ('observationContent' in experimentUpdates) updates.observationcontent = experimentUpdates.observationContent;
      
      // Always update the 'updatedat' field
      updates.updatedat = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state with the edited experiment
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
