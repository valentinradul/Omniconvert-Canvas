
import { useState, useEffect } from 'react';
import { Experiment, ExperimentStatus, ObservationContent } from '@/types';
import { generateId } from '../utils/dataUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper functions to convert data types
  const parseDate = (dateStr: string | null): Date | null => {
    return dateStr ? new Date(dateStr) : null;
  };

  const parseExperimentStatus = (status: string | null): ExperimentStatus => {
    if (!status) return "Planned";
    
    if (status === "Planned" || status === "In Progress" || status === "Blocked" ||
        status === "Winning" || status === "Losing" || status === "Inconclusive") {
      return status as ExperimentStatus;
    }
    return "Planned";
  };

  const parseObservationContent = (content: Json | null): ObservationContent | undefined => {
    if (!content) return undefined;
    
    if (typeof content === 'object') {
      return content as ObservationContent;
    }
    
    return { text: String(content) };
  };
  
  // Fetch experiments from Supabase when the user or company changes
  useEffect(() => {
    const fetchExperiments = async () => {
      if (!user?.id) {
        setExperiments([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Try to fetch experiments from Supabase
        let query = supabase.from('experiments')
          .select('*')
          .eq('userid', user.id);
          
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our Experiment type
          const formattedExperiments: Experiment[] = data.map(e => ({
            id: e.id,
            hypothesisId: e.hypothesisid || '',
            startDate: parseDate(e.startdate),
            endDate: parseDate(e.enddate),
            observationContent: parseObservationContent(e.observationcontent),
            status: parseExperimentStatus(e.status),
            createdAt: new Date(e.createdat),
            updatedAt: new Date(e.updatedat),
            userId: e.userid,
            userName: e.username,
            companyId: e.company_id,
            notes: e.notes || ''
          }));
          
          setExperiments(formattedExperiments);
          console.log('Experiments fetched from Supabase:', formattedExperiments);
        }
      } catch (error: any) {
        console.error('Error fetching experiments:', error.message);
        toast.error('Failed to load experiments');
        
        // Fallback to localStorage if Supabase fetch fails
        const userKey = `experiments_${user.id}`;
        const savedExperiments = localStorage.getItem(userKey);
        if (savedExperiments) {
          setExperiments(JSON.parse(savedExperiments));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExperiments();
  }, [user?.id, currentCompany?.id]);
  
  const filteredExperiments = experiments.filter(experiment => 
    !currentCompany || experiment.companyId === currentCompany.id || !experiment.companyId
  );
  
  const addExperiment = async (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // First, add to Supabase
      const { data, error } = await supabase.from('experiments').insert({
        hypothesisid: experiment.hypothesisId,
        startdate: experiment.startDate?.toISOString(),
        enddate: experiment.endDate?.toISOString(),
        observationcontent: experiment.observationContent,
        status: experiment.status,
        notes: experiment.notes,
        userid: experiment.userId || user?.id,
        username: experiment.userName || user?.user_metadata?.full_name || user?.email,
        company_id: currentCompany?.id
      }).select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const now = new Date();
        const newExperiment: Experiment = {
          id: data[0].id,
          hypothesisId: data[0].hypothesisid || '',
          startDate: parseDate(data[0].startdate),
          endDate: parseDate(data[0].enddate),
          observationContent: parseObservationContent(data[0].observationcontent),
          status: parseExperimentStatus(data[0].status),
          createdAt: now,
          updatedAt: now,
          userId: data[0].userid,
          userName: data[0].username,
          companyId: data[0].company_id,
          notes: data[0].notes || ''
        };
        
        setExperiments(prevExperiments => [...prevExperiments, newExperiment]);
        toast.success('Experiment added successfully');
      }
    } catch (error: any) {
      console.error('Error adding experiment:', error.message);
      toast.error('Failed to add experiment');
      
      // Fallback to local storage
      const now = new Date();
      const newExperiment = {
        ...experiment,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        userId: experiment.userId || user?.id,
        userName: experiment.userName || user?.user_metadata?.full_name || user?.email,
        companyId: currentCompany?.id
      };
      
      setExperiments(prevExperiments => [...prevExperiments, newExperiment]);
      
      // Update local storage
      const userKey = `experiments_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify([...experiments, newExperiment]));
    }
  };
  
  const editExperiment = async (id: string, experimentUpdates: Partial<Experiment>) => {
    try {
      // First update in Supabase
      const updates: Record<string, any> = {};
      
      if (experimentUpdates.startDate !== undefined) {
        updates.startdate = experimentUpdates.startDate?.toISOString();
      }
      
      if (experimentUpdates.endDate !== undefined) {
        updates.enddate = experimentUpdates.endDate?.toISOString();
      }
      
      if (experimentUpdates.observationContent !== undefined) {
        updates.observationcontent = experimentUpdates.observationContent;
      }
      
      if (experimentUpdates.status !== undefined) {
        updates.status = experimentUpdates.status;
      }
      
      if (experimentUpdates.notes !== undefined) {
        updates.notes = experimentUpdates.notes;
      }
      
      updates.updatedat = new Date().toISOString();
      
      const { error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Then update local state
      setExperiments(prevExperiments => 
        prevExperiments.map(experiment => 
          experiment.id === id ? { ...experiment, ...experimentUpdates, updatedAt: new Date() } : experiment
        )
      );
      
      toast.success('Experiment updated successfully');
    } catch (error: any) {
      console.error('Error updating experiment:', error.message);
      toast.error('Failed to update experiment');
      
      // Still update the local state as fallback
      setExperiments(experiments.map(experiment => 
        experiment.id === id ? { ...experiment, ...experimentUpdates, updatedAt: new Date() } : experiment
      ));
    }
  };
  
  const deleteExperiment = async (id: string) => {
    try {
      // First delete from Supabase
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Then update local state
      setExperiments(prevExperiments => prevExperiments.filter(experiment => experiment.id !== id));
      toast.success('Experiment deleted successfully');
    } catch (error: any) {
      console.error('Error deleting experiment:', error.message);
      toast.error('Failed to delete experiment');
      
      // Still update the local state as fallback
      setExperiments(experiments.filter(experiment => experiment.id !== id));
    }
  };

  const getExperimentByHypothesisId = (hypothesisId: string) => 
    filteredExperiments.find(e => e.hypothesisId === hypothesisId);
  
  return {
    experiments: filteredExperiments,
    isLoading,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId
  };
};
