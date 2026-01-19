
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { useCategories } from '@/context/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import AddIdeaDialog from '@/components/ideas/AddIdeaDialog';
import IdeasFilterBar from '@/components/ideas/IdeasFilterBar';
import IdeasTable from '@/components/ideas/IdeasTable';
import EmptyIdeasState from '@/components/ideas/EmptyIdeasState';
import { Archive } from 'lucide-react';

const IdeasPage: React.FC = () => {
  const { ideas, archivedIdeas, departments, addIdea, getDepartmentById, getAllTags, getAllUserNames, addDepartment, archiveIdea, unarchiveIdea, loadArchivedIdeas, isLoadingArchived } = useApp();
  const { user } = useAuth();
  const { currentCompany, userCompanyRole, contentSettings } = useCompany();
  const { categories, isLoading: categoriesLoading, addCategory } = useCategories(currentCompany);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  
  // Search and filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  
  // Reset category filter if the selected category no longer exists
  useEffect(() => {
    if (categoryFilter !== 'all' && !categoriesLoading) {
      const categoryExists = categories.some(cat => cat.id === categoryFilter);
      if (!categoryExists) {
        setCategoryFilter('all');
      }
    }
  }, [categories, categoryFilter, categoriesLoading]);

  // Load archived ideas when switching to archived tab
  useEffect(() => {
    if (activeTab === 'archived' && !archivedLoaded) {
      loadArchivedIdeas();
      setArchivedLoaded(true);
    }
  }, [activeTab, archivedLoaded, loadArchivedIdeas]);
  
  // Get all user names for the filter
  const allUsers = getAllUserNames();
  const allTags = getAllTags();

  // Helper function to get category with department info
  const getCategoryDisplayName = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return categoryName;
    
    if (category.department_id) {
      const department = getDepartmentById(category.department_id);
      return department ? `${categoryName} (${department.name})` : categoryName;
    }
    
    return categoryName;
  };

  // Filter ideas based on department visibility settings
  const getFilteredIdeas = (ideasList: typeof ideas) => {
    console.log('Filtering ideas:', {
      userCompanyRole,
      contentSettings,
      showAllDepartments,
      totalIdeas: ideasList.length
    });

    // Owners and admins always see all ideas
    if (userCompanyRole === 'owner' || userCompanyRole === 'admin') {
      console.log('User is owner/admin - showing all ideas');
      return ideasList;
    }
    
    // If content is not restricted to departments, show all ideas
    if (!contentSettings?.restrict_content_to_departments) {
      console.log('Content not restricted to departments - showing all ideas');
      return ideasList;
    }
    
    // If user chose to see all departments, show all ideas
    if (showAllDepartments) {
      console.log('User chose to see all departments - showing all ideas');
      return ideasList;
    }
    
    // Filter ideas based on department access
    console.log('Applying department filtering based on user permissions');
    
    // Get user's accessible departments
    const userAccessibleDepartments = departments.filter(dept => {
      return true; // TODO: Implement actual department permission checking
    });
    
    const userDepartmentIds = userAccessibleDepartments.map(dept => dept.id);
    console.log('User accessible department IDs:', userDepartmentIds);
    
    // Filter ideas based on their department
    const filteredIdeas = ideasList.filter(idea => {
      return userDepartmentIds.includes(idea.departmentId || '');
    });
    
    console.log('Filtered ideas count:', filteredIdeas.length);
    return filteredIdeas;
  };

  // Apply filters to a list of ideas
  const applyFilters = (ideasList: typeof ideas) => {
    const departmentFilteredIdeas = getFilteredIdeas(ideasList);
    
    return departmentFilteredIdeas.filter(idea => {
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
  };

  const filteredIdeas = applyFilters(ideas);
  const filteredArchivedIdeas = applyFilters(archivedIdeas);
  
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

  // Show content visibility toggle only for regular members when content is restricted
  const showVisibilityToggle = 
    userCompanyRole !== 'owner' && 
    userCompanyRole !== 'admin' && 
    contentSettings?.restrict_content_to_departments;

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

      {/* Content Visibility Toggle for Regular Members */}
      {showVisibilityToggle && (
        <Card className="border-amber-200 bg-amber-50/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="show-all-departments-ideas"
                checked={showAllDepartments}
                onCheckedChange={setShowAllDepartments}
              />
              <div>
                <Label htmlFor="show-all-departments-ideas" className="text-sm font-medium">
                  Show ideas from all departments
                </Label>
                <p className="text-xs text-muted-foreground">
                  {!showAllDepartments 
                    ? "Currently showing only ideas from your assigned departments"
                    : "Currently showing ideas from all departments"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Ideas ({ideas.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedIdeas.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {ideas.length > 0 ? (
            <IdeasTable 
              ideas={filteredIdeas}
              getDepartmentById={getDepartmentById}
              getCategoryDisplayName={getCategoryDisplayName}
              onArchive={archiveIdea}
            />
          ) : (
            <EmptyIdeasState onAddIdeaClick={() => setIsDialogOpen(true)} />
          )}
        </TabsContent>
        
        <TabsContent value="archived" className="mt-4">
          {isLoadingArchived ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading archived ideas...</p>
            </div>
          ) : archivedIdeas.length > 0 ? (
            <IdeasTable 
              ideas={filteredArchivedIdeas}
              getDepartmentById={getDepartmentById}
              getCategoryDisplayName={getCategoryDisplayName}
              onUnarchive={unarchiveIdea}
              showArchived={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No archived ideas</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Ideas you archive will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AddIdeaDialog 
        departments={departments}
        categories={categories}
        addIdea={addIdea}
        addCategory={addCategory}
        addDepartment={addDepartment}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  );
};

export default IdeasPage;
