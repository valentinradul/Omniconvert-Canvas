
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  companies: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const DepartmentsManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch departments with company info
      const { data: departmentsData, error: deptError } = await supabase
        .from('departments')
        .select(`
          *,
          companies!departments_company_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (deptError) throw deptError;

      // Fetch all companies
      const { data: companiesData, error: compError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (compError) throw compError;

      setDepartments(departmentsData || []);
      setCompanies(companiesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch departments'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async () => {
    if (!newDepartmentName.trim() || !selectedCompanyId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('departments')
        .insert({
          name: newDepartmentName.trim(),
          company_id: selectedCompanyId,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department created successfully'
      });

      setNewDepartmentName('');
      setSelectedCompanyId('');
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create department'
      });
    }
  };

  const updateDepartment = async () => {
    if (!editingDepartment || !editDepartmentName.trim() || !editCompanyId) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({ 
          name: editDepartmentName.trim(),
          company_id: editCompanyId
        })
        .eq('id', editingDepartment.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department updated successfully'
      });

      setEditingDepartment(null);
      setEditDepartmentName('');
      setEditCompanyId('');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update department'
      });
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department deleted successfully'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete department'
      });
    }
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setEditDepartmentName(department.name);
    setEditCompanyId(department.company_id);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading departments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Departments ({departments.length})</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="department-name">Department Name</Label>
                <Input
                  id="department-name"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <Label>Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createDepartment} 
                  disabled={!newDepartmentName.trim() || !selectedCompanyId}
                >
                  Create Department
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {departments.map((department) => (
          <Card key={department.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{department.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary">{department.companies.name}</Badge>
                    <span className="text-sm text-gray-600">
                      Created: {new Date(department.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(department)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteDepartment(department.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-department-name">Department Name</Label>
              <Input
                id="edit-department-name"
                value={editDepartmentName}
                onChange={(e) => setEditDepartmentName(e.target.value)}
                placeholder="Enter department name"
              />
            </div>
            <div>
              <Label>Select Company</Label>
              <Select value={editCompanyId} onValueChange={setEditCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateDepartment} 
                disabled={!editDepartmentName.trim() || !editCompanyId}
              >
                Update Department
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentsManagement;
