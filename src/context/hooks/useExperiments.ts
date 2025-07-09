import { useState, useEffect } from 'react';
import { Experiment, ExperimentNote } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        // Check content visibility settings
        const { data: contentSettings } = await supabase
          .from('company_content_settings')
          .select('restrict_content_to_departments')
          .eq('company_id', currentCompany?.id)
          .single();

        // Get user's role in the company
        const { data: memberData } = await supabase
          .from('company_members')
          .select('role, id')
          .eq('user_id', user.id)
          .eq('company_id', currentCompany?.id)
          .single();

        const userRole = memberData?.role;
        const restrictContent = contentSettings?.restrict_content_to_departments || false;

        let query = supabase.from('experiments').select('*');
        
        // Filter by company if applicable
        if (currentCompany?.id) {
          query = query.eq('company_id', currentCompany.id);
        }

        // If content is restricted and user is not admin/owner, filter by accessible departments
        if (restrictContent && userRole !== 'owner' && userRole !== 'admin' && memberData) {
          // Get user's accessible departments
          const { data: permissions } = await supabase
            .from('member_department_permissions')
            .select('department_id')
            .eq('member_id', memberData.id);

          let departmentIds: string[] = [];
          
          if (permissions && permissions.length > 0) {
            // User has specific department permissions
            departmentIds = permissions.map(p => p.department_id);
          } else {
            // User has access to all departments (no restrictions)
            const { data: allDepts } = await supabase
              .from('departments')
              .select('id')
              .eq('company_id', currentCompany?.id);
            
            departmentIds = allDepts?.map(d => d.id) || [];
          }

          if (departmentIds.length > 0) {
            // Get ideas from accessible departments first
            const { data: accessibleIdeas } = await supabase
              .from('ideas')
              .select('id')
              .eq('company_id', currentCompany.id)
              .in('departmentid', departmentIds);

            if (accessibleIdeas && accessibleIdeas.length > 0) {
              const ideaIds = accessibleIdeas.map(idea => idea.id);
              
              // Get hypotheses from accessible ideas
              const { data: accessibleHypotheses } = await supabase
                .from('hypotheses')
                .select('id')
                .eq('company_id', currentCompany.id)
                .in('ideaid', ideaIds);

              if (accessibleHypotheses && accessibleHypotheses.length > 0) {
                const hypothesisIds = accessibleHypotheses.map(h => h.id);
                query = query.in('hypothesisid', hypothesisIds);
              } else {
                // No accessible hypotheses, return empty array
                setExperiments([]);
                setIsLoading(false);
                return;
              }
            } else {
              // No accessible ideas, return empty array
              setExperiments([]);
              setIsLoading(false);
              return;
            }
          } else {
            // No accessible departments, return empty array
            setExperiments([]);
            setIsLoading(false);
            return;
          }
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
          notes_history: exp.notes_history ? (exp.notes_history as unknown as ExperimentNote[]) : [],
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
        notes_history: data.notes_history ? (data.notes_history as unknown as ExperimentNote[]) : [],
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
    isLoading,
    addExperiment,
    editExperiment,
    deleteExperiment,
    getExperimentByHypothesisId,
    addExperimentNote,
    deleteExperimentNote
  };
};
