import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Building, 
  Calendar,
  Trash2,
  Eye,
  Filter,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Experiment, ExperimentStatus, ALL_STATUSES } from '@/types/experiments';
import { ObservationContent } from '@/types/common';
import ExperimentDetailsDialog from './ExperimentDetailsDialog';

export interface ExtendedExperiment extends Experiment {
  companies?: { name: string };
  hypotheses?: { 
    observation: string;
    ideas?: { title: string };
  };
}

const ExperimentsManagement: React.FC = () => {
  const [experiments, setExperiments] = useState<ExtendedExperiment[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<ExtendedExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<ExtendedExperiment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchExperiments();
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterExperiments();
  }, [experiments, searchTerm, statusFilter, companyFilter]);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experiments')
        .select(`
          *,
          companies:company_id (name),
          hypotheses:hypothesisid (
            observation,
            ideas:ideaid (title)
          )
        `)
        .order('createdat', { ascending: false });

      if (error) throw error;
      
      // Transform database response to match TypeScript interface
      const transformedData = data?.map(item => ({
        id: item.id,
        hypothesisId: item.hypothesisid,
        startDate: item.startdate ? new Date(item.startdate) : null,
        endDate: item.enddate ? new Date(item.enddate) : null,
        status: item.status as ExperimentStatus,
        notes: item.notes || '',
        notes_history: (item.notes_history as unknown as any[]) || [],
        observationContent: item.observationcontent as unknown as ObservationContent,
        createdAt: new Date(item.createdat),
        updatedAt: new Date(item.updatedat),
        userId: item.userid,
        userName: item.username,
        companyId: item.company_id,
        companies: item.companies,
        hypotheses: item.hypotheses
      })) || [];

      setExperiments(transformedData);
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const filterExperiments = () => {
    let filtered = experiments;

    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.hypotheses?.ideas?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.hypotheses?.observation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exp => exp.status === statusFilter);
    }

    if (companyFilter !== 'all') {
      filtered = filtered.filter(exp => exp.companyId === companyFilter);
    }

    setFilteredExperiments(filtered);
  };

  const deleteExperiment = async (experimentId: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;

    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', experimentId);

      if (error) throw error;
      
      setExperiments(prev => prev.filter(exp => exp.id !== experimentId));
    } catch (error) {
      console.error('Error deleting experiment:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Winning': return 'bg-green-100 text-green-800';
      case 'Losing': return 'bg-orange-100 text-orange-800';
      case 'Inconclusive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewExperiment = (experiment: ExtendedExperiment) => {
    setSelectedExperiment(experiment);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading experiments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Experiments Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor experiments across all companies</p>
        </div>
        <Button onClick={() => window.open('/create-experiment', '_blank')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Experiment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Experiments</p>
                <p className="text-2xl font-bold">{experiments.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {experiments.filter(e => e.status === 'In Progress').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Winning</p>
                <p className="text-2xl font-bold text-green-600">
                  {experiments.filter(e => e.status === 'Winning').length}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Companies</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search experiments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ALL_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCompanyFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Experiments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Experiments ({filteredExperiments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hypothesis/Idea</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExperiments.map((experiment) => (
                  <TableRow key={experiment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {experiment.hypotheses?.ideas?.title || 'No Idea Title'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {experiment.hypotheses?.observation?.substring(0, 100)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        {experiment.companies?.name || 'No Company'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(experiment.status)}>
                        {experiment.status || 'Planned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {experiment.startDate 
                        ? format(experiment.startDate, 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>
                      {experiment.endDate 
                        ? format(experiment.endDate, 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>
                      {format(experiment.createdAt, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewExperiment(experiment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteExperiment(experiment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredExperiments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No experiments found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <ExperimentDetailsDialog
        experiment={selectedExperiment}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
};

export default ExperimentsManagement;
