
import React, { useState } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { useDepartments } from '@/context/hooks/useDepartments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const DepartmentsPage: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const { departments, loading, addDepartment, editDepartment, deleteDepartment } = useDepartments(currentCompany);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const canManageDepartments = userCompanyRole === 'owner' || userCompanyRole === 'admin';
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDepartmentName.trim()) {
      toast.error('Department name cannot be empty');
      return;
    }
    
    await addDepartment(newDepartmentName);
    setNewDepartmentName('');
    setNewDialogOpen(false);
    toast.success('Department created successfully!');
  };
  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editDepartmentName.trim()) {
      toast.error('Department name cannot be empty');
      return;
    }
    
    if (editDepartmentId) {
      await editDepartment(editDepartmentId, editDepartmentName);
      setEditDepartmentId(null);
      setEditDepartmentName('');
      setEditDialogOpen(false);
      toast.success('Department updated successfully!');
    }
  };
  
  const openEditDialog = (department: any) => {
    setEditDepartmentId(department.id);
    setEditDepartmentName(department.name);
    setEditDialogOpen(true);
  };
  
  const handleDelete = async (departmentId: string) => {
    await deleteDepartment(departmentId);
    toast.success('Department deleted successfully!');
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading departments...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Manage your organization's departments</p>
        </div>
        {canManageDepartments && (
          <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Department</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create New Department</DialogTitle>
                  <DialogDescription>
                    Add a new department to your organization structure.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input 
                      id="name" 
                      value={newDepartmentName} 
                      onChange={(e) => setNewDepartmentName(e.target.value)} 
                      placeholder="E.g. Marketing"
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Department</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canManageDepartments && (
        <p className="text-sm text-muted-foreground">
          Only owners and admins can manage departments.
        </p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(department => (
          <Card key={department.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{department.name}</span>
                {canManageDepartments && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(department)}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this department? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(department.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(department.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {canManageDepartments && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription>
                  Update the department name.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Department Name</Label>
                  <Input 
                    id="editName" 
                    value={editDepartmentName} 
                    onChange={(e) => setEditDepartmentName(e.target.value)} 
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DepartmentsPage;
