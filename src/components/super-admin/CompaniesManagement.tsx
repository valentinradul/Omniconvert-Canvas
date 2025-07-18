
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Calendar, Search, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import SuperAdminTable from './SuperAdminTable';

interface Company {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count?: number;
  owner_name?: string;
  owner_email?: string;
}

const CompaniesManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    // Filter and sort companies
    let filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort companies
    filtered.sort((a, b) => {
      const aValue = a[sortKey as keyof Company];
      const bValue = b[sortKey as keyof Company];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [companies, searchTerm, sortKey, sortDirection]);

  const fetchCompanies = async () => {
    try {
      // Use the super admin function to get companies with owner details
      const { data: companiesData, error } = await supabase
        .rpc('get_companies_with_owners_for_super_admin');

      if (error) throw error;

      const formattedCompanies = (companiesData || []).map(company => ({
        id: company.id,
        name: company.name,
        created_at: company.created_at,
        created_by: company.created_by,
        member_count: Number(company.member_count),
        owner_name: company.owner_name,
        owner_email: company.owner_email
      }));

      setCompanies(formattedCompanies);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch companies'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('companies')
        .insert({
          name: newCompanyName.trim(),
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company created successfully'
      });

      setNewCompanyName('');
      setIsCreateDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create company'
      });
    }
  };

  const deleteCompany = async (companyId: string) => {
    // First check if company has related data
    try {
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id')
        .eq('company_id', companyId);

      const { data: hypotheses } = await supabase
        .from('hypotheses')
        .select('id')
        .eq('company_id', companyId);

      const { data: experiments } = await supabase
        .from('experiments')
        .select('id')
        .eq('company_id', companyId);

      const relatedDataCount = (ideas?.length || 0) + (hypotheses?.length || 0) + (experiments?.length || 0);

      if (relatedDataCount > 0) {
        const confirmMessage = `This company has ${relatedDataCount} related items (ideas, hypotheses, or experiments).\n\nDeleting the company will also delete ALL related data. This action cannot be undone.\n\nAre you sure you want to continue?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }

        // Delete related data first
        await deleteCompanyData(companyId);
      } else {
        if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
          return;
        }
      }

      // Finally delete the company
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company deleted successfully'
      });

      fetchCompanies();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      
      let errorMessage = 'Failed to delete company';
      if (error.code === '23503') {
        errorMessage = 'Cannot delete company - it still has related data (ideas, hypotheses, or experiments). Please contact support if this persists.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    }
  };

  const deleteCompanyData = async (companyId: string) => {
    // Delete experiments first (they reference hypotheses)
    const { error: experimentsError } = await supabase
      .from('experiments')
      .delete()
      .eq('company_id', companyId);

    if (experimentsError) throw experimentsError;

    // Delete hypotheses (they reference ideas)
    const { error: hypothesesError } = await supabase
      .from('hypotheses')
      .delete()
      .eq('company_id', companyId);

    if (hypothesesError) throw hypothesesError;

    // Delete ideas
    const { error: ideasError } = await supabase
      .from('ideas')
      .delete()
      .eq('company_id', companyId);

    if (ideasError) throw ideasError;

    // Delete company members
    const { error: membersError } = await supabase
      .from('company_members')
      .delete()
      .eq('company_id', companyId);

    if (membersError) throw membersError;

    // Delete company invitations
    const { error: invitationsError } = await supabase
      .from('company_invitations')
      .delete()
      .eq('company_id', companyId);

    if (invitationsError) throw invitationsError;
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Paginate filtered companies
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (company: Company) => (
        <div className="font-medium">{company.name}</div>
      )
    },
    {
      key: 'owner_name',
      header: 'Owner',
      sortable: true,
      render: (company: Company) => (
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <div>
            <div className="font-medium text-sm">{company.owner_name}</div>
            {company.owner_email && (
              <div className="text-xs text-muted-foreground">{company.owner_email}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'member_count',
      header: 'Members',
      sortable: true,
      render: (company: Company) => (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          <Users className="h-3 w-3" />
          {company.member_count}
        </Badge>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (company: Company) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(company.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (company: Company) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteCompany(company.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const actions = (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-64"
        />
      </div>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createCompany} disabled={!newCompanyName.trim()}>
                Create Company
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <SuperAdminTable
      title="Companies Management"
      data={paginatedCompanies}
      columns={columns}
      totalItems={filteredCompanies.length}
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

export default CompaniesManagement;
