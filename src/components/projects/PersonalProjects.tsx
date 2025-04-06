
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePersonalProjects, Project } from '@/hooks/usePersonalProjects';
import AddProjectDialog from './AddProjectDialog';
import EditProjectDialog from './EditProjectDialog';
import ProjectsTable from './ProjectsTable';

const PersonalProjects: React.FC = () => {
  const { projects, isLoading, addProject, updateProject, deleteProject } = usePersonalProjects();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleOpenEditDialog = (project: Project) => {
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
        <AddProjectDialog 
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddProject={addProject}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center py-4">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No personal projects yet.</p>
          ) : (
            <ProjectsTable 
              projects={projects}
              onEdit={handleOpenEditDialog}
              onDelete={deleteProject}
            />
          )}
        </div>
      </CardContent>
      
      <EditProjectDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={selectedProject}
        onEditProject={updateProject}
      />
    </Card>
  );
};

export default PersonalProjects;
