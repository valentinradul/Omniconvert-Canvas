
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type ProjectFormValues = {
  name: string;
  description?: string;
};

export function usePersonalProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Use any() to bypass the TypeScript error since Supabase types don't include our new table yet
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_personal', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Type assertion to ensure the data matches our Project interface
      setProjects(data as Project[] || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const addProject = async (values: ProjectFormValues) => {
    if (!user) return null;
    
    try {
      // Use any() to bypass the TypeScript error since Supabase types don't include our new table yet
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: values.name,
          description: values.description,
          user_id: user.id,
          is_personal: true,
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Type assertion to ensure the data matches our Project interface
        setProjects([...(data as Project[]), ...projects]);
        toast.success('Project created successfully!');
        return data[0] as Project;
      }
      return null;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    }
  };

  const updateProject = async (id: string, values: ProjectFormValues) => {
    if (!user) return false;
    
    try {
      // Use any() to bypass the TypeScript error since Supabase types don't include our new table yet
      const { error } = await supabase
        .from('projects')
        .update({
          name: values.name,
          description: values.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update the local state
      setProjects(
        projects.map(project => 
          project.id === id 
            ? { ...project, name: values.name, description: values.description || null } 
            : project
        )
      );
      
      toast.success('Project updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return false;
    
    try {
      // Use any() to bypass the TypeScript error since Supabase types don't include our new table yet
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update the local state
      setProjects(projects.filter(project => project.id !== id));
      toast.success('Project deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects: fetchProjects
  };
}
