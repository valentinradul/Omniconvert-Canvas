
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Category } from '@/types';

const CategoriesPage: React.FC = () => {
  const { categories, addCategory, editCategory, deleteCategory } = useApp();
  const { user } = useAuth();
  const { members } = useTeamMembers();
  
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldValue: Category; newValue: Category } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Check if the current user is an admin
  const currentMember = members.find(member => member.email === user?.email);
  const isAdmin = currentMember?.role === 'Admin';
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to manage categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Only administrators can manage the categories. Please contact your team administrator for assistance.</p>
          </CardContent>
        </Card>
      </div>
    );
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
  
  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    deleteCategory(categoryToDelete);
    setCategoryToDelete(null);
    toast.success('Category deleted successfully');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Idea Categories</h2>
          <p className="text-muted-foreground">Manage the categories that can be assigned to growth ideas</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new category for growth ideas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>All available categories for growth ideas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">
                    No categories found. Add your first category!
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory({ oldValue: category, newValue: category });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setCategoryToDelete(category)}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this category? This action cannot be undone.
                                Any ideas using this category will need to be reassigned.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteCategory}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Rename the selected category. Any ideas using this category will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-category-name">Category Name</Label>
            <Input
              id="edit-category-name"
              value={editingCategory?.newValue || ''}
              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, newValue: e.target.value } : null)}
              placeholder="Enter category name"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingCategory(null);
              setIsEditDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;
