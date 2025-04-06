
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Category } from '@/types';

// Import refactored components
import CategoryList from '@/components/categories/CategoryList';
import AddCategoryDialog from '@/components/categories/AddCategoryDialog';
import EditCategoryDialog from '@/components/categories/EditCategoryDialog';
import AccessDeniedCard from '@/components/categories/AccessDeniedCard';
import LoadingCard from '@/components/categories/LoadingCard';
import CategoryHeader from '@/components/categories/CategoryHeader';

const CategoriesPage: React.FC = () => {
  const { categories, addCategory, editCategory, deleteCategory } = useApp();
  const { isAdmin, isLoading } = useUserRole();
  
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldValue: Category; newValue: Category } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  if (isLoading) {
    return <LoadingCard />;
  }
  
  if (!isAdmin) {
    return <AccessDeniedCard />;
  }
  
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    
    if (categories.includes(newCategory)) {
      toast.error('This category already exists');
      return;
    }
    
    addCategory(newCategory);
    setNewCategory('');
    setIsAddDialogOpen(false);
    toast.success('Category added successfully');
  };
  
  const handleEditCategory = () => {
    if (!editingCategory) return;
    
    if (!editingCategory.newValue.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    
    if (categories.includes(editingCategory.newValue) && editingCategory.oldValue !== editingCategory.newValue) {
      toast.error('This category already exists');
      return;
    }
    
    editCategory(editingCategory.oldValue, editingCategory.newValue);
    setEditingCategory(null);
    setIsEditDialogOpen(false);
    toast.success('Category updated successfully');
  };
  
  const handleDeleteCategory = (category: Category) => {
    deleteCategory(category);
    toast.success('Category deleted successfully');
  };
  
  return (
    <div className="space-y-6">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <CategoryHeader onOpenAddDialog={() => setIsAddDialogOpen(true)} />
        
        <AddCategoryDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          categoryName={newCategory}
          onCategoryNameChange={setNewCategory}
          onAdd={handleAddCategory}
        />
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>All available categories for growth ideas</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryList
            categories={categories}
            onEdit={(category) => {
              setEditingCategory({ oldValue: category, newValue: category });
              setIsEditDialogOpen(true);
            }}
            onDelete={handleDeleteCategory}
          />
        </CardContent>
      </Card>
      
      <EditCategoryDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingCategory={editingCategory}
        onEditingCategoryChange={setEditingCategory}
        onSave={handleEditCategory}
      />
    </div>
  );
};

export default CategoriesPage;
