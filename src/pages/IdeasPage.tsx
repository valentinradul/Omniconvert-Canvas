
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import IdeaDialog from '@/components/ideas/IdeaDialog';
import IdeaFilters from '@/components/ideas/IdeaFilters';
import IdeasTable from '@/components/ideas/IdeasTable';
import EmptyIdeasState from '@/components/ideas/EmptyIdeasState';
import { Category } from '@/types';

const IdeasPage: React.FC = () => {
  const { 
    ideas, 
    departments, 
    categories, 
    addIdea, 
    getDepartmentById, 
    getAllTags, 
    getAllUserNames 
  } = useApp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);
  
  const allTags = getAllTags();
  const allUsers = getAllUserNames();

  const handleAddIdea = (ideaData: {
    title: string;
    description: string;
    category: Category;
    departmentId: string;
    tags: string[];
    responsibleUserId?: string;
  }) => {
    addIdea(ideaData);
  };

  const filteredIdeas = [...ideas]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(idea => {
      // Apply tag filter
      if (filterTag && (!idea.tags || !idea.tags.includes(filterTag))) {
        return false;
      }
      
      // Apply user filter
      if (filterUserId && idea.responsibleUserId !== filterUserId) {
        return false;
      }
      
      return true;
    });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Growth Ideas</h2>
          <p className="text-muted-foreground">Capture and manage growth ideas</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>Add New Idea</Button>
        
        <IdeaDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          departments={departments}
          categories={categories}
          allUsers={allUsers}
          onAddIdea={handleAddIdea}
        />
      </div>

      <IdeaFilters
        allTags={allTags}
        allUsers={allUsers}
        filterTag={filterTag}
        filterUserId={filterUserId}
        setFilterTag={setFilterTag}
        setFilterUserId={setFilterUserId}
      />

      {ideas.length > 0 ? (
        <IdeasTable
          ideas={filteredIdeas}
          getDepartmentById={getDepartmentById}
          allUsers={allUsers}
        />
      ) : (
        <EmptyIdeasState onCreateIdea={() => setIsDialogOpen(true)} />
      )}
    </>
  );
};

export default IdeasPage;
