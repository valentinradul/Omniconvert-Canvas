
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Building, Calendar, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import SuperAdminTable from './SuperAdminTable';

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
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter and sort departments
    let filtered = departments.filter(department => {
      const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           department.companies.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = filterCompany === 'all' || department.company_id === filterCompany;
      return matchesSearch && matchesCompany;
    });

    // Sort departments
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortKey === 'company_name') {
        aValue = a.companies.name;
        bValue = b.companies.name;
      } else {
        aValue = a[sortKey as keyof Department];
        bValue = b[sortKey as keyof Department];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDepartments(filtered);
    setCurrentPage(1);
  }, [departments, searchTerm, filterCompany, sortKey, sortDirection]);

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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Paginate filtered departments
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'name',
      header: 'Department Name',
      sortable: true,
      render: (department: Department) => (
        <div className="font-medium">{department.name}</div>
      )
    },
    {
      key: 'company_name',
      header: 'Company',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (department: Department) => (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <Building className="h-3 w-3" />
          <span className="hidden sm:inline">{department.companies.name}</span>
          <span className="sm:hidden">{department.companies.name.substring(0, 10)}...</span>
        </Badge>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (department: Department) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="hidden lg:inline">{new Date(department.created_at).toLocaleDateString()}</span>
          <span className="lg:hidden">{new Date(department.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (department: Department) => (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteDepartment(department.id)}
            className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Delete</span>
          </Button>
        </div>
      )
    }
  ];

  const actions = (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 sm:items-center">
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <div className="relative flex-1 sm:max-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="sm:inline">Add Department</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-md">
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={createDepartment} 
                disabled={!newDepartmentName.trim() || !selectedCompanyId}
                className="w-full sm:w-auto"
              >
                Create Department
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <SuperAdminTable
      title="Departments Management"
      data={paginatedDepartments}
      columns={columns}
      totalItems={filteredDepartments.length}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
      onSort={handleSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
      isLoading={loading}
      actions={actions}
    />
  );
};

export default DepartmentsManagement;
