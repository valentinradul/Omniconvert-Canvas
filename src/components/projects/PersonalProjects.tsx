
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters" }),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof formSchema>;

const PersonalProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user } = useAuth();

  const addForm = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const editForm = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

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

  useEffect(() => {
    if (selectedProject && isEditDialogOpen) {
      editForm.reset({
        name: selectedProject.name,
        description: selectedProject.description || '',
      });
    }
  }, [selectedProject, isEditDialogOpen, editForm]);

  const handleAddProject = async (values: ProjectFormValues) => {
    if (!user) return;
    
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
        addForm.reset();
        setIsAddDialogOpen(false);
        toast.success('Project created successfully!');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleEditProject = async (values: ProjectFormValues) => {
    if (!user || !selectedProject) return;
    
    try {
      // Use any() to bypass the TypeScript error since Supabase types don't include our new table yet
      const { error } = await supabase
        .from('projects')
        .update({
          name: values.name,
          description: values.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update the local state
      setProjects(
        projects.map(project => 
          project.id === selectedProject.id 
            ? { ...project, name: values.name, description: values.description || null } 
            : project
        )
      );
      
      editForm.reset();
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      toast.success('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;
    
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
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Personal Projects</CardTitle>
          <CardDescription>
            Manage your personal projects that only you can access.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Personal Project</DialogTitle>
              <DialogDescription>
                Add a new personal project that only you can access.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddProject)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter project description" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create Project</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center py-4">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No personal projects yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.description || 'No description'}</TableCell>
                      <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(project)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the project "{project.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      {selectedProject && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your personal project details.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditProject)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter project description" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default PersonalProjects;
