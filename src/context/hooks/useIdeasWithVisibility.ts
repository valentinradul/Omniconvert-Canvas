
import { useState, useEffect } from 'react';
import { GrowthIdea, Hypothesis } from '@/types';
import { fetchIdeas, createIdea, updateIdea, deleteIdeaById, NewIdea } from '@/services/ideasService';
import { canDeleteIdea } from '@/validators/ideaValidators';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContentSettings } from './useCompanyContentSettings';
import { supabase } from '@/integrations/supabase/client';

export const useIdeasWithVisibility = (
  user: any,
  currentCompany: any,
  hypotheses: Hypothesis[]
) => {
  const [ideas, setIdeas] = useState<GrowthIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useCompanyContentSettings(currentCompany?.id || null);

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
        let allIdeas = await fetchIdeas(currentCompany?.id);
        
        // Apply content visibility filtering
        if (settings?.restrict_content_to_departments && currentCompany?.id) {
          const filteredIdeas = await filterIdeasByUserDepartments(allIdeas, user.id, currentCompany.id);
          setIdeas(filteredIdeas);
        } else {
          setIdeas(allIdeas);
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
  }, [user, currentCompany, settings, toast]);

  const filterIdeasByUserDepartments = async (allIdeas: GrowthIdea[], userId: string, companyId: string) => {
    try {
      // Get user's department permissions
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select(`
          id,
          role,
          department_id,
          member_department_permissions(department_id)
        `)
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (memberError || !memberData) {
        return allIdeas; // If we can't determine permissions, show all
      }

      // If user is admin/owner, they see everything
      if (memberData.role === 'admin' || memberData.role === 'owner') {
        return allIdeas;
      }

      // Collect all department IDs the user has access to
      const accessibleDepartmentIds = new Set<string>();
      
      // Add their primary department if they have one
      if (memberData.department_id) {
        accessibleDepartmentIds.add(memberData.department_id);
      }
      
      // Add additional department permissions
      if (memberData.member_department_permissions) {
        memberData.member_department_permissions.forEach((perm: any) => {
          accessibleDepartmentIds.add(perm.department_id);
        });
      }

      // Filter ideas by accessible departments
      return allIdeas.filter(idea => 
        !idea.departmentId || accessibleDepartmentIds.has(idea.departmentId)
      );
    } catch (error) {
      console.error('Error filtering ideas by departments:', error);
      return allIdeas; // Fallback to showing all ideas
    }
  };
  
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
