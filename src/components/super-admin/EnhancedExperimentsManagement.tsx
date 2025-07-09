
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SuperAdminTable from './SuperAdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Trash2, Search, Building, Users, Flask, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EnhancedExperiment {
  id: string;
  status: string;
  startdate: string | null;
  enddate: string | null;
  notes: string;
  username: string;
  createdat: string;
  company_name: string;
  company_id: string;
  hypothesis_title: string;
}

const EnhancedExperimentsManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: ['super-admin-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: experimentsData, isLoading } = useQuery({
    queryKey: ['super-admin-experiments', currentPage, searchTerm, selectedCompany, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('experiments')
        .select(`
          *,
          companies:company_id(name),
          hypotheses:hypothesisid(observation)
        `)
        .order('createdat', { ascending: false });

      if (selectedCompany !== 'all') {
        query = query.eq('company_id', selectedCompany);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      const enhancedData: EnhancedExperiment[] = data.map(experiment => ({
        id: experiment.id,
        status: experiment.status || 'Planned',
        startdate: experiment.startdate,
        enddate: experiment.enddate,
        notes: experiment.notes || '',
        username: experiment.username || 'Unknown',
        createdat: experiment.createdat,
        company_name: experiment.companies?.name || 'No Company',
        company_id: experiment.company_id || '',
        hypothesis_title: experiment.hypotheses?.observation || 'No Hypothesis'
      }));

      // Filter by search term if provided
      const filteredData = searchTerm
        ? enhancedData.filter(exp => 
            exp.hypothesis_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.username.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : enhancedData;

      return {
        experiments: filteredData,
        totalCount: filteredData.length
      };
    }
  });

  const handleDeleteExperiment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Experiment deleted successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['super-admin-experiments'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete experiment.',
      });
    }
    setDeleteId(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({ 
          status: newStatus,
          statusupdatedat: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Experiment status updated successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['super-admin-experiments'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update experiment status.',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned': return 'secondary';
      case 'in progress': return 'default';
      case 'blocked': return 'destructive';
      case 'winning': return 'default';
      case 'losing': return 'secondary';
      case 'inconclusive': return 'outline';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      key: 'hypothesis_title',
      header: 'Hypothesis',
      render: (experiment: EnhancedExperiment) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{experiment.hypothesis_title}</p>
          <p className="text-sm text-muted-foreground truncate">{experiment.notes}</p>
        </div>
      )
    },
    {
      key: 'company_name',
      header: 'Company',
      render: (experiment: EnhancedExperiment) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <span>{experiment.company_name}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (experiment: EnhancedExperiment) => (
        <Badge variant={getStatusColor(experiment.status)}>
          {experiment.status}
        </Badge>
      )
    },
    {
      key: 'username',
      header: 'Created By',
      render: (experiment: EnhancedExperiment) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{experiment.username}</span>
        </div>
      )
    },
    {
      key: 'startdate',
      header: 'Start Date',
      render: (experiment: EnhancedExperiment) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {experiment.startdate 
              ? new Date(experiment.startdate).toLocaleDateString()
              : 'Not set'
            }
          </span>
        </div>
      )
    },
    {
      key: 'enddate',
      header: 'End Date',  
      render: (experiment: EnhancedExperiment) => (
        experiment.enddate 
          ? new Date(experiment.enddate).toLocaleDateString()
          : 'Not set'
      )
    },
    {
      key: 'createdat',
      header: 'Created',
      render: (experiment: EnhancedExperiment) => new Date(experiment.createdat).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (experiment: EnhancedExperiment) => (
        <div className="flex gap-1">
          <Select
            value={experiment.status}
            onValueChange={(value) => handleUpdateStatus(experiment.id, value)}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
              <SelectItem value="Winning">Winning</SelectItem>
              <SelectItem value="Losing">Losing</SelectItem>
              <SelectItem value="Inconclusive">Inconclusive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(experiment.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const filteredExperiments = experimentsData?.experiments || [];
  const totalCount = experimentsData?.totalCount || 0;

  const statusCounts = filteredExperiments.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flask className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Enhanced Experiments Management</h1>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts['In Progress'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Winning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts['Winning'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredExperiments.map(exp => exp.company_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Planned">Planned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
            <SelectItem value="Winning">Winning</SelectItem>
            <SelectItem value="Losing">Losing</SelectItem>
            <SelectItem value="Inconclusive">Inconclusive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Experiments Table */}
      <SuperAdminTable
        title="All Platform Experiments"
        data={filteredExperiments}
        columns={columns}
        totalItems={totalCount}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the experiment and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteExperiment(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedExperimentsManagement;
