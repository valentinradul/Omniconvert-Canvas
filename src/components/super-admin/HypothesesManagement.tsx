import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SuperAdminTable from './SuperAdminTable';
import HypothesisDetailsDialog from './HypothesisDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Trash2,
  Building,
  Users,
  Brain,
  Filter,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { Hypothesis } from '@/types/hypotheses';

interface Company {
  id: string;
  name: string;
}

interface HypothesesData extends Hypothesis {
  company_name?: string;
  idea_title?: string;
  idea_description?: string;
}

const HypothesesManagement: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<HypothesesData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hypothesisToDelete, setHypothesisToDelete] = useState<HypothesesData | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedHypothesis, setSelectedHypothesis] = useState<HypothesesData | null>(null);
  const { toast } = useToast();

  // Get unique statuses
  const statuses = [...new Set(hypotheses.map(h => h.status).filter(Boolean))];

  // Calculate stats
  const totalHypotheses = hypotheses.length;
  const hypothesesByCompany = companies.reduce((acc, company) => {
    acc[company.name] = hypotheses.filter(h => h.companyId === company.id).length;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch hypotheses using super admin function
      const { data: hypothesesData, error: hypothesesError } = await supabase
        .rpc('get_all_hypotheses_for_super_admin');

      if (hypothesesError) throw hypothesesError;

      // Transform the data
      const formattedHypotheses: HypothesesData[] = (hypothesesData || []).map((hypothesis: any) => ({
        id: hypothesis.id,
        ideaId: hypothesis.ideaid,
        initiative: hypothesis.initiative || '',
        metric: hypothesis.metric || '',
        observation: hypothesis.observation || '',
        observationContent: hypothesis.observationcontent,
        pectiScore: hypothesis.pectiscore,
        responsibleUserId: hypothesis.responsibleuserid,
        status: hypothesis.status || 'Draft',
        userId: hypothesis.userid,
        userName: hypothesis.username,
        companyId: hypothesis.company_id,
        createdAt: new Date(hypothesis.createdat),
        company_name: hypothesis.company_name,
        idea_title: hypothesis.idea_title,
        idea_description: hypothesis.idea_description
      }));

      setHypotheses(formattedHypotheses);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch hypotheses data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHypothesis = async () => {
    if (!hypothesisToDelete) return;

    try {
      const { error } = await supabase
        .from('hypotheses')
        .delete()
        .eq('id', hypothesisToDelete.id);

      if (error) throw error;

      setHypotheses(hypotheses.filter(h => h.id !== hypothesisToDelete.id));
      toast({
        title: 'Success',
        description: 'Hypothesis deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting hypothesis:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete hypothesis.',
      });
    } finally {
      setDeleteDialogOpen(false);
      setHypothesisToDelete(null);
    }
  };

  // Filter hypotheses based on search and filters
  const filteredHypotheses = hypotheses.filter(hypothesis => {
    const matchesSearch = 
      hypothesis.initiative?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hypothesis.observation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hypothesis.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hypothesis.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hypothesis.idea_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = selectedCompany === 'all' || hypothesis.companyId === selectedCompany;
    const matchesStatus = selectedStatus === 'all' || hypothesis.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHypotheses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHypotheses = filteredHypotheses.slice(startIndex, startIndex + itemsPerPage);

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Active': return 'default';
      case 'Testing': return 'secondary';
      case 'Validated': return 'default';
      case 'Invalidated': return 'destructive';
      case 'Paused': return 'outline';
      case 'Draft': return 'secondary';
      default: return 'outline';
    }
  };

  const columns = [
    {
      key: 'hypothesis',
      header: 'Hypothesis',
      render: (hypothesis: HypothesesData) => (
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 mb-1">{hypothesis.initiative}</div>
          <div className="text-sm text-gray-500 truncate">{hypothesis.observation}</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{hypothesis.company_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{hypothesis.userName || 'Unknown'}</span>
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (hypothesis: HypothesesData) => (
        <div className="flex items-center justify-center sm:justify-start">
          <Badge 
            variant={getStatusVariant(hypothesis.status)}
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 whitespace-nowrap"
          >
            <span className="hidden sm:inline">{hypothesis.status || 'Draft'}</span>
            <span className="sm:hidden">
              {(hypothesis.status as string) === 'Active' && '●'}
              {(hypothesis.status as string) === 'Testing' && '◐'}
              {(hypothesis.status as string) === 'Validated' && '✓'}
              {(hypothesis.status as string) === 'Invalidated' && '✗'}
              {(hypothesis.status as string) === 'Paused' && '⏸'}
              {((hypothesis.status as string) === 'Draft' || !hypothesis.status) && '○'}
            </span>
          </Badge>
        </div>
      ),
    },
    {
      key: 'createdat',
      header: 'Created',
      render: (hypothesis: HypothesesData) => (
        <span className="text-sm text-gray-600">
          {format(hypothesis.createdAt, 'MMM dd, yyyy')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (hypothesis: HypothesesData) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setHypothesisToDelete(hypothesis);
            setDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hypotheses Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor hypotheses across all companies</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hypotheses</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHypotheses}</div>
            <p className="text-xs text-muted-foreground">
              Across {companies.length} companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statuses</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statuses.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique statuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Company</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(hypothesesByCompany).length > 0 
                ? Object.entries(hypothesesByCompany).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(hypothesesByCompany).length > 0 
                ? `${Math.max(...Object.values(hypothesesByCompany))} hypotheses`
                : 'No hypotheses yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search hypotheses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select company" />
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hypotheses Table */}
      <SuperAdminTable
        title="Hypotheses"
        data={paginatedHypotheses}
        columns={columns}
        totalItems={filteredHypotheses.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        onRowClick={(hypothesis) => {
          setSelectedHypothesis(hypothesis);
          setDetailsDialogOpen(true);
        }}
      />

      {/* Hypothesis Details Dialog */}
      <HypothesisDetailsDialog
        hypothesis={selectedHypothesis}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hypothesis "{hypothesisToDelete?.initiative}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHypothesis} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HypothesesManagement;