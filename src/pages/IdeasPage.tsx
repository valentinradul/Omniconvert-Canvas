
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useCategories } from '@/context/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DialogTrigger } from '@/components/ui/dialog';
import AddIdeaDialog from '@/components/ideas/AddIdeaDialog';
import IdeasFilterBar from '@/components/ideas/IdeasFilterBar';
import IdeasTable from '@/components/ideas/IdeasTable';
import EmptyIdeasState from '@/components/ideas/EmptyIdeasState';

const IdeasPage: React.FC = () => {
  const { ideas, departments, addIdea, getDepartmentById, getAllTags, getAllUserNames } = useApp();
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { categories, isLoading: categoriesLoading } = useCategories(currentCompany);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Search and filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  
  // Debug logging
  console.log('IdeasPage - currentCompany:', currentCompany);
  console.log('IdeasPage - categories:', categories);
  console.log('IdeasPage - categoriesLoading:', categoriesLoading);
  console.log('IdeasPage - user:', user);
  
  // Reset category filter if the selected category no longer exists
  useEffect(() => {
    if (categoryFilter !== 'all' && !categoriesLoading) {
      const categoryExists = categories.some(cat => cat.id === categoryFilter);
      if (!categoryExists) {
        setCategoryFilter('all');
      }
    }
  }, [categories, categoryFilter, categoriesLoading]);
  
  // Get all user names for the filter
  const allUsers = getAllUserNames();
  const allTags = getAllTags();

  // Filter ideas based on search and filter criteria
  const filteredIdeas = ideas.filter(idea => {
    // Search query filter
    if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !idea.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter - using category names
    if (categoryFilter !== 'all') {
      const selectedCategory = categories.find(cat => cat.id === categoryFilter);
      if (!selectedCategory || idea.category !== selectedCategory.name) {
        return false;
      }
    }
    
    // Department filter
    if (departmentFilter !== 'all' && idea.departmentId !== departmentFilter) {
      return false;
    }
    
    // Responsible user filter
    if (responsibleFilter !== 'all' && idea.userId !== responsibleFilter) {
      return false;
    }
    
    return true;
  });
  
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDepartmentFilter('all');
    setResponsibleFilter('all');
  };
  
  const hasActiveFilters = searchQuery !== '' || 
    categoryFilter !== 'all' || 
    departmentFilter !== 'all' || 
    responsibleFilter !== 'all';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Growth Ideas</h2>
          <p className="text-muted-foreground">Capture and manage growth ideas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>Add New Idea</Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <IdeasFilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        responsibleFilter={responsibleFilter}
        setResponsibleFilter={setResponsibleFilter}
        departments={departments}
        categories={categories}
        allUsers={allUsers}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {ideas.length > 0 ? (
        <IdeasTable 
          ideas={filteredIdeas}
          getDepartmentById={getDepartmentById}
        />
      ) : (
        <EmptyIdeasState onAddIdeaClick={() => setIsDialogOpen(true)} />
      )}
      
      <AddIdeaDialog 
        departments={departments}
        categories={categories}
        addIdea={addIdea}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  );
};

export default IdeasPage;
