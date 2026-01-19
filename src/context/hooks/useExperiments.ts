import { useState, useEffect } from 'react';
import { Experiment, ExperimentNote } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useExperiments = (
  user: any,
  currentCompany: any
) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [archivedExperiments, setArchivedExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const { toast } = useToast();
  
  // Fetch experiments from Supabase when user or company changes
  useEffect(() => {
    const fetchExperiments = async () => {
      if (!user) {
        setExperiments([]);
        setArchivedExperiments([]);
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
        
        // Only fetch non-archived experiments
        query = query.eq('is_archived', false);
        
        const { data, error } = await query;
        
        if (error) throw error;

        // Fetch financial data for all experiments
        const experimentIds = (data || []).map(exp => exp.id);
        let financialsData: any[] = [];
        
        if (experimentIds.length > 0) {
          const { data: financials, error: financialsError } = await supabase
            .from('experiment_financials')
            .select('*')
            .in('experiment_id', experimentIds);
          
          if (financialsError) {
            console.error('Error fetching financials:', financialsError);
          } else {
            financialsData = financials || [];
          }
        }

        // Calculate totals for each experiment
        const calculateTotals = (experimentId: string) => {
          const experimentFinancials = financialsData.filter(f => f.experiment_id === experimentId);
          const totalCost = experimentFinancials
            .filter(f => f.type === 'cost')
            .reduce((sum, f) => sum + Number(f.amount || 0), 0);
          const totalReturn = experimentFinancials
            .filter(f => f.type === 'revenue')
            .reduce((sum, f) => sum + Number(f.amount || 0), 0);
          
          return { totalCost, totalReturn };
        };
        
        // Map from database column names to frontend property names
        const formattedExperiments: Experiment[] = (data || []).map(exp => {
          const { totalCost, totalReturn } = calculateTotals(exp.id);
          
          return {
            id: exp.id,
            hypothesisId: exp.hypothesisid || "",
            title: exp.title,
            startDate: exp.startdate ? new Date(exp.startdate) : null,
            endDate: exp.enddate ? new Date(exp.enddate) : null,
            status: exp.status as any || "Planned",
            notes: exp.notes || "",
            notes_history: exp.notes_history ? (exp.notes_history as unknown as ExperimentNote[]) : [],
            observationContent: exp.observationcontent as any,
            createdAt: new Date(exp.createdat),
            updatedAt: new Date(exp.updatedat),
            userId: exp.userid,
            userName: exp.username,
            companyId: exp.company_id,
            totalCost: totalCost || null,
            totalReturn: totalReturn || null,
            isArchived: exp.is_archived || false
          };
        });
        
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

  // Load archived experiments on demand
  const loadArchivedExperiments = async () => {
    if (!user || !currentCompany?.id) return;
    
    setIsLoadingArchived(true);
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_archived', true);
      
      if (error) throw error;
      
      const formattedExperiments: Experiment[] = (data || []).map(exp => ({
        id: exp.id,
        hypothesisId: exp.hypothesisid || "",
        title: exp.title,
        startDate: exp.startdate ? new Date(exp.startdate) : null,
        endDate: exp.enddate ? new Date(exp.enddate) : null,
        status: exp.status as any || "Planned",
        notes: exp.notes || "",
        notes_history: exp.notes_history ? (exp.notes_history as unknown as ExperimentNote[]) : [],
        observationContent: exp.observationcontent as any,
        createdAt: new Date(exp.createdat),
        updatedAt: new Date(exp.updatedat),
        userId: exp.userid,
        userName: exp.username,
        companyId: exp.company_id,
        totalCost: null,
        totalReturn: null,
        isArchived: true
      }));
      
      setArchivedExperiments(formattedExperiments);
    } catch (error: any) {
      console.error('Error loading archived experiments:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to load archived experiments',
        description: error.message,
      });
    } finally {
      setIsLoadingArchived(false);
    }
  };
  
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
        company_id: currentCompany.id,
        is_archived: false
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
        notes_history: data.notes_history ? (data.notes_history as unknown as ExperimentNote[]) : [],
        observationContent: data.observationcontent as any,
        createdAt: new Date(data.createdat),
        updatedAt: new Date(data.updatedat),
        userId: data.userid,
        userName: data.username,
        companyId: data.company_id,
        isArchived: false
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
      if ('isArchived' in experimentUpdates) updates.is_archived = experimentUpdates.isArchived;
      
      // Always update the 'updatedat' field
      updates.updatedat = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Handle archive/unarchive
      if ('isArchived' in experimentUpdates) {
        if (experimentUpdates.isArchived) {
          // Move from active to archived
          const experimentToArchive = experiments.find(e => e.id === id);
          if (experimentToArchive) {
            setExperiments(experiments.filter(e => e.id !== id));
            setArchivedExperiments([...archivedExperiments, { ...experimentToArchive, isArchived: true }]);
          }
        } else {
          // Move from archived to active
          const experimentToUnarchive = archivedExperiments.find(e => e.id === id);
          if (experimentToUnarchive) {
            setArchivedExperiments(archivedExperiments.filter(e => e.id !== id));
            setExperiments([...experiments, { ...experimentToUnarchive, isArchived: false }]);
          }
        }
        
        toast({
          title: experimentUpdates.isArchived ? 'Experiment archived' : 'Experiment restored',
          description: experimentUpdates.isArchived 
            ? 'The experiment has been moved to archive.' 
            : 'The experiment has been restored from archive.',
        });
      } else {
        // Regular update
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
      }
    } catch (error: any) {
      console.error('Error updating experiment:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to update experiment',
        description: error.message,
      });
    }
  };

  const archiveExperiment = async (id: string) => {
    await editExperiment(id, { isArchived: true });
  };

  const unarchiveExperiment = async (id: string) => {
    await editExperiment(id, { isArchived: false });
  };
  
  const deleteExperiment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setExperiments(experiments.filter(experiment => experiment.id !== id));
      setArchivedExperiments(archivedExperiments.filter(experiment => experiment.id !== id));
      
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

  const addExperimentNote = async (experimentId: string, noteContent: string) => {
    if (!user || !noteContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cannot add note',
        description: 'You must be logged in and provide note content.',
      });
      return;
    }

    try {
      const experiment = experiments.find(e => e.id === experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const newNote: ExperimentNote = {
        id: crypto.randomUUID(),
        content: noteContent.trim(),
        created_at: new Date().toISOString(),
        created_by: user.id,
        author_name: user.user_metadata?.full_name || user.email || 'Unknown User'
      };

      const updatedNotesHistory = [...(experiment.notes_history || []), newNote];

      // Update the database
      const { error } = await supabase
        .from('experiments')
        .update({ notes_history: updatedNotesHistory as any })
        .eq('id', experimentId);

      if (error) throw error;

      // Update local state
      setExperiments(experiments.map(exp => 
        exp.id === experimentId 
          ? { ...exp, notes_history: updatedNotesHistory, updatedAt: new Date() }
          : exp
      ));

      toast({
        title: 'Note added',
        description: 'Your note has been added to the experiment.',
      });
    } catch (error: any) {
      console.error('Error adding experiment note:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to add note',
        description: error.message,
      });
    }
  };

  const deleteExperimentNote = async (experimentId: string, noteId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to delete notes.',
      });
      return;
    }

    try {
      const experiment = experiments.find(e => e.id === experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const updatedNotesHistory = (experiment.notes_history || []).filter(note => note.id !== noteId);

      // Update the database
      const { error } = await supabase
        .from('experiments')
        .update({ notes_history: updatedNotesHistory as any })
        .eq('id', experimentId);

      if (error) throw error;

      // Update local state
      setExperiments(experiments.map(exp => 
        exp.id === experimentId 
          ? { ...exp, notes_history: updatedNotesHistory, updatedAt: new Date() }
          : exp
      ));

      toast({
        title: 'Note deleted',
        description: 'The note has been removed from the experiment.',
      });
    } catch (error: any) {
      console.error('Error deleting experiment note:', error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to delete note',
        description: error.message,
      });
    }
  };
  
  return {
    experiments: filteredExperiments,
    archivedExperiments,
    isLoading,
    isLoadingArchived,
    addExperiment,
    editExperiment,
    deleteExperiment,
    archiveExperiment,
    unarchiveExperiment,
    loadArchivedExperiments,
    getExperimentByHypothesisId,
    addExperimentNote,
    deleteExperimentNote
  };
};
