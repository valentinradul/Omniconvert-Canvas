
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import AddCategoryDialog from '@/components/categories/AddCategoryDialog';
import EditCategoryDialog from '@/components/categories/EditCategoryDialog';
import CategoryHeader from '@/components/categories/CategoryHeader';
import CategoryList from '@/components/categories/CategoryList';
import LoadingCard from '@/components/categories/LoadingCard';
import AccessDeniedCard from '@/components/categories/AccessDeniedCard';
import { Category } from '@/types';

const CategoriesPage: React.FC = () => {
  const { categories, addCategory, editCategory, deleteCategory } = useApp();
  const { isAdmin, isLoading } = useUserRole();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const handleAddCategory = (categoryName: string) => {
    // Convert the string to Category type
    addCategory(categoryName as Category);
    setIsAddDialogOpen(false);
  };
  
  const handleEditCategory = ({ oldValue, newValue }: { oldValue: Category; newValue: string }) => {
    editCategory(oldValue, newValue as Category);
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteCategory = (category: Category) => {
    deleteCategory(category);
  };
  
  if (isLoading) return <LoadingCard />;
  
  return (
    <div className="space-y-6">
      <CategoryHeader 
        onAddClick={() => setIsAddDialogOpen(true)} 
        isAdmin={isAdmin}
      />
      
      <Card>
        <CardContent className="p-6">
          <CategoryList 
            categories={categories} 
            onEditCategory={(category) => {
              setSelectedCategory(category);
              setIsEditDialogOpen(true);
            }}
            onDeleteCategory={handleDeleteCategory}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
      
      <AddCategoryDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddCategory}
      />
      
      {selectedCategory && (
        <EditCategoryDialog 
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onEdit={handleEditCategory}
          initialCategory={selectedCategory}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
