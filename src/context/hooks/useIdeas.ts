import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis } from '@/types';
import { fetchIdeas, createIdea, updateIdea, deleteIdeaById, NewIdea } from '@/services/ideasService';
import { canDeleteIdea } from '@/validators/ideaValidators';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    const loadIdeas = async () => {
      if (!user) {
        setIdeas([]);
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

        // If user is owner/admin or content is not restricted, fetch all ideas
        if (!restrictContent || userRole === 'owner' || userRole === 'admin') {
          const data = await fetchIdeas(currentCompany?.id);
          setIdeas(data);
        } else {
          // For regular members with restricted content, fetch only ideas from accessible departments
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

          // Fetch ideas only from accessible departments
          if (departmentIds.length > 0) {
            const { data: restrictedIdeas, error } = await supabase
              .from('ideas')
              .select('*')
              .eq('company_id', currentCompany?.id)
              .in('departmentid', departmentIds);

            if (error) throw error;

            const formattedIdeas: GrowthIdea[] = (restrictedIdeas || []).map(idea => ({
              id: idea.id,
              title: idea.title,
              description: idea.description || '',
              category: idea.category || '',
              departmentId: idea.departmentid || '',
              createdAt: new Date(idea.createdat),
              userId: idea.userid,
              userName: idea.username,
              tags: idea.tags || [],
              companyId: idea.company_id,
              isPublic: idea.is_public
            }));

            setIdeas(formattedIdeas);
          } else {
            setIdeas([]);
          }
        }
        
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load ideas',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIdeas();
  }, [user, currentCompany, toast]);
  
  const filteredIdeas = ideas;
  
  const addIdea = async (idea: Omit<GrowthIdea, 'id' | 'createdAt'>): Promise<GrowthIdea | null> => {
    if (!user || !currentCompany?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in and select a company to add ideas.',
      });
      return null;
    }
    
    try {
      const newIdeaData: NewIdea = {
        ...idea,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email,
        companyId: currentCompany.id
      };
      
      const createdIdea = await createIdea(newIdeaData);
      
      if (createdIdea) {
        setIdeas([...ideas, createdIdea]);
        
        toast({
          title: 'Idea created',
          description: 'Your growth idea has been saved successfully.',
        });
      }
      
      return createdIdea;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add idea',
        description: error.message,
      });
      return null;
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
      await updateIdea(id, ideaUpdates);
      
      // Update the local state with the edited idea
      setIdeas(ideas.map(idea => 
        idea.id === id ? { 
          ...idea,
          ...ideaUpdates
        } : idea
      ));
      
      toast({
        title: 'Idea updated',
        description: 'Your growth idea has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update idea',
        description: error.message,
      });
    }
  };
  
  const deleteIdea = async (id: string) => {
    if (!canDeleteIdea(id, hypotheses)) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete idea',
        description: 'Cannot delete idea that has a hypothesis associated with it.',
      });
      return;
    }
    
    try {
      await deleteIdeaById(id);
      
      setIdeas(ideas.filter(idea => idea.id !== id));
      
      toast({
        title: 'Idea deleted',
        description: 'The growth idea has been deleted successfully.',
      });
    } catch (error: any) {
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
