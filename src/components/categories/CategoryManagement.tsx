
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCategories } from '@/context/hooks/useCategories';
import { useCompany } from '@/context/company/CompanyContext';
import { useApp } from '@/context/AppContext';
import { Edit, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CategoryManagement: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { categories, isLoading, addCategory, editCategory, removeCategory } = useCategories(currentCompany);
  const { departments } = useApp();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string, department_id: string | null} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDepartment, setNewCategoryDepartment] = useState<string>('no-department');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDepartment, setEditCategoryDepartment] = useState<string>('no-department');
  
  const canManageCategories = userCompanyRole === 'owner' || userCompanyRole === 'admin';
  
  // Debug logging
  console.log('CategoryManagement - userCompanyRole:', userCompanyRole);
  console.log('CategoryManagement - canManageCategories:', canManageCategories);
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Category name required',
        description: 'Please enter a category name.',
      });
      return;
    }
    
    const departmentId = newCategoryDepartment === 'no-department' ? undefined : newCategoryDepartment;
    const result = await addCategory(newCategoryName.trim(), departmentId);
    if (result) {
      setNewCategoryName('');
      setNewCategoryDepartment('no-department');
      setShowAddDialog(false);
    }
  };
  
  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Category name required',
        description: 'Please enter a category name.',
      });
      return;
    }
    
    const departmentId = editCategoryDepartment === 'no-department' ? undefined : editCategoryDepartment;
    await editCategory(editingCategory.id, editCategoryName.trim(), departmentId);
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryDepartment('no-department');
    setShowEditDialog(false);
  };
  
  const handleDeleteCategory = async (id: string) => {
    await removeCategory(id);
  };
  
  const openEditDialog = (category: {id: string, name: string, department_id: string | null}) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryDepartment(category.department_id || 'no-department');
    setShowEditDialog(true);
  };
  
  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'No Department';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };
  
  if (isLoading) {
    return <div>Loading categories...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>
              Manage growth idea categories for your company
            </CardDescription>
          </div>
          {canManageCategories && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border shadow-lg">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category for growth ideas.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="categoryDepartment">Department (Optional)</Label>
                    <Select value={newCategoryDepartment} onValueChange={setNewCategoryDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-department">No Department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory}>
                    Add Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!canManageCategories && (
          <p className="text-sm text-muted-foreground mb-4">
            Only owners and admins can manage categories.
          </p>
        )}
        
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-muted-foreground">No categories found.</p>
          ) : (
            categories.map((category) => (
               <div
                 key={category.id}
                 className="flex items-center justify-between p-3 border rounded-lg"
               >
                 <div>
                   <span className="font-medium">{category.name}</span>
                   <p className="text-sm text-muted-foreground">
                     {getDepartmentName(category.department_id)}
                   </p>
                 </div>
                {canManageCategories && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{category.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Edit Category Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-background border shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editCategoryName">Category Name</Label>
                <Input
                  id="editCategoryName"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCategoryDepartment">Department (Optional)</Label>
                <Select value={editCategoryDepartment} onValueChange={setEditCategoryDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-department">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory}>
                Update Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;
