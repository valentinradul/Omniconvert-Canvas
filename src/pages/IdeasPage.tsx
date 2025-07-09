
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings, Lock, Unlock } from 'lucide-react';
import AddIdeaDialog from '@/components/ideas/AddIdeaDialog';
import IdeasFilterBar from '@/components/ideas/IdeasFilterBar';
import IdeasTable from '@/components/ideas/IdeasTable';
import EmptyIdeasState from '@/components/ideas/EmptyIdeasState';

const IdeasPage: React.FC = () => {
  const { ideas, departments, addIdea, getDepartmentById, getAllTags, getAllUserNames } = useApp();
  const { user } = useAuth();
  const { currentCompany, userCompanyRole, contentSettings, updateContentSettings } = useCompany();
  const { categories, isLoading: categoriesLoading } = useCategories(currentCompany);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  
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
  const getFilteredIdeas = () => {
    console.log('Filtering ideas:', {
      userCompanyRole,
      contentSettings,
      showAllDepartments,
      totalIdeas: ideas.length
    });

    // Owners and admins always see all ideas
    if (userCompanyRole === 'owner' || userCompanyRole === 'admin') {
      console.log('User is owner/admin - showing all ideas');
      return ideas;
    }
    
    // If content is not restricted to departments, show all ideas
    if (!contentSettings?.restrict_content_to_departments) {
      console.log('Content not restricted to departments - showing all ideas');
      return ideas;
    }
    
    // If user chose to see all departments, show all ideas
    if (showAllDepartments) {
      console.log('User chose to see all departments - showing all ideas');
      return ideas;
    }
    
    // Filter ideas based on department access
    console.log('Applying department filtering based on user permissions');
    
    // Get user's accessible departments
    const userAccessibleDepartments = departments.filter(dept => {
      // For now, we'll assume user has access to all departments since we don't have 
      // the department permission logic fully implemented yet
      // This is where you would check member_department_permissions table
      return true; // TODO: Implement actual department permission checking
    });
    
    const userDepartmentIds = userAccessibleDepartments.map(dept => dept.id);
    console.log('User accessible department IDs:', userDepartmentIds);
    
    // Filter ideas based on their department
    const filteredIdeas = ideas.filter(idea => {
      // Check if the idea's department is in user's accessible departments
      return userDepartmentIds.includes(idea.departmentId || '');
    });
    
    console.log('Filtered ideas count:', filteredIdeas.length);
    return filteredIdeas;
  };

  // Apply department filtering first, then apply other filters
  const departmentFilteredIdeas = getFilteredIdeas();
  
  const filteredIdeas = departmentFilteredIdeas.filter(idea => {
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

  // Show content visibility toggle only for regular members when content is restricted
  const showVisibilityToggle = 
    userCompanyRole !== 'owner' && 
    userCompanyRole !== 'admin' && 
    contentSettings?.restrict_content_to_departments;

  // Check if user is admin or owner
  const isAdminOrOwner = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  // Function to toggle content restriction (for admins)
  const handleToggleContentRestriction = async () => {
    if (contentSettings && updateContentSettings) {
      await updateContentSettings({
        restrict_content_to_departments: !contentSettings.restrict_content_to_departments
      });
    }
  };

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

      {/* Admin Content Management Section */}
      {isAdminOrOwner && (
        <Card className="border-blue-200 bg-blue-50/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Settings className="h-5 w-5" />
              Content Management Settings
            </CardTitle>
            <CardDescription>
              Control how team members view ideas and other content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {contentSettings?.restrict_content_to_departments ? (
                  <Lock className="h-4 w-4 text-orange-600" />
                ) : (
                  <Unlock className="h-4 w-4 text-green-600" />
                )}
                <div>
                  <Label className="text-sm font-medium">
                    Restrict content to departments
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {contentSettings?.restrict_content_to_departments 
                      ? "Members can only see content from their assigned departments"
                      : "All members can see content from all departments"
                    }
                  </p>
                </div>
              </div>
              <Button
                variant={contentSettings?.restrict_content_to_departments ? "destructive" : "default"}
                onClick={handleToggleContentRestriction}
                className="ml-4"
              >
                {contentSettings?.restrict_content_to_departments ? 'Disable' : 'Enable'} Restriction
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {ideas.length > 0 ? (
        <IdeasTable 
          ideas={filteredIdeas}
          getDepartmentById={getDepartmentById}
          getCategoryDisplayName={getCategoryDisplayName}
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
