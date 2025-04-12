
import { useState, useEffect } from 'react';
import { Experiment } from '@/types';
import { generateId } from '../utils/dataUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
            hypothesisId: e.hypothesisid,
            startDate: e.startdate ? new Date(e.startdate) : undefined,
            endDate: e.enddate ? new Date(e.enddate) : undefined,
            observationContent: e.observationcontent,
            status: e.status,
            totalCost: e.totalcost,
            totalReturn: e.totalreturn,
            createdAt: new Date(e.createdat),
            updatedAt: new Date(e.updatedat),
            userId: e.userid,
            userName: e.username,
            companyId: e.company_id,
            notes: e.notes
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
        startdate: experiment.startDate,
        enddate: experiment.endDate,
        observationcontent: experiment.observationContent,
        status: experiment.status,
        totalcost: experiment.totalCost,
        totalreturn: experiment.totalReturn,
        userid: experiment.userId || user?.id,
        username: experiment.userName || user?.user_metadata?.full_name || user?.email,
        company_id: currentCompany?.id,
        notes: experiment.notes
      }).select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const now = new Date();
        const newExperiment: Experiment = {
          id: data[0].id,
          hypothesisId: data[0].hypothesisid,
          startDate: data[0].startdate ? new Date(data[0].startdate) : undefined,
          endDate: data[0].enddate ? new Date(data[0].enddate) : undefined,
          observationContent: data[0].observationcontent,
          status: data[0].status,
          totalCost: data[0].totalcost,
          totalReturn: data[0].totalreturn,
          createdAt: now,
          updatedAt: now,
          userId: data[0].userid,
          userName: data[0].username,
          companyId: data[0].company_id,
          notes: data[0].notes
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
      const updates = {
        startdate: experimentUpdates.startDate,
        enddate: experimentUpdates.endDate,
        observationcontent: experimentUpdates.observationContent,
        status: experimentUpdates.status,
        totalcost: experimentUpdates.totalCost,
        totalreturn: experimentUpdates.totalReturn,
        notes: experimentUpdates.notes,
        updatedat: new Date()
      };
      
      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      });
      
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
