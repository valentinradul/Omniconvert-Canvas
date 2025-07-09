
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SuperAdminTable from './SuperAdminTable';
import { useToast } from '@/hooks/use-toast';
import { Search, FlaskConical, Trash2 } from 'lucide-react';
import { Experiment, ExperimentStatus } from '@/types';

interface ExperimentWithDetails extends Experiment {
  company_name?: string;
  hypothesis_title?: string;
  idea_title?: string;
}

const ExperimentsManagement: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentWithDetails[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<ExperimentWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchExperiments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('experiments')
        .select(`
          *,
          companies:company_id(name),
          hypotheses:hypothesisid(
            observation,
            ideas:ideaid(title)
          )
        `)
        .order('createdat', { ascending: false });

      if (error) throw error;

      const formattedExperiments: ExperimentWithDetails[] = (data || []).map((exp: any) => ({
        id: exp.id,
        hypothesisId: exp.hypothesisid || '',
        startDate: exp.startdate ? new Date(exp.startdate) : null,
        endDate: exp.enddate ? new Date(exp.enddate) : null,
        status: exp.status as ExperimentStatus || 'Planned',
        notes: exp.notes || '',
        notes_history: exp.notes_history || [],
        observationContent: exp.observationcontent,
        createdAt: new Date(exp.createdat),
        updatedAt: new Date(exp.updatedat),
        userId: exp.userid,
        userName: exp.username || 'Unknown',
        companyId: exp.company_id,
        company_name: exp.companies?.name || 'No Company',
        hypothesis_title: exp.hypotheses?.observation || 'No Hypothesis',
        idea_title: exp.hypotheses?.ideas?.title || 'No Idea'
      }));

      setExperiments(formattedExperiments);
      setFilteredExperiments(formattedExperiments);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch experiments',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  useEffect(() => {
    const filtered = experiments.filter(exp =>
      exp.hypothesis_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.idea_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExperiments(filtered);
  }, [searchTerm, experiments]);

  const deleteExperiment = async (experimentId: string) => {
    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', experimentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Experiment deleted successfully',
      });

      fetchExperiments();
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete experiment',
      });
    }
  };

  const getStatusColor = (status: ExperimentStatus) => {
    switch (status) {
      case 'Winning': return 'bg-green-100 text-green-800';
      case 'Losing': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-gray-100 text-gray-800';
      case 'Blocked': return 'bg-orange-100 text-orange-800';
      case 'Inconclusive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'idea',
      label: 'Idea',
      render: (exp: ExperimentWithDetails) => (
        <div>
          <div className="font-medium">{exp.idea_title}</div>
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {exp.hypothesis_title}
          </div>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Company',
      render: (exp: ExperimentWithDetails) => exp.company_name || 'No Company'
    },
    {
      key: 'status',
      label: 'Status',
      render: (exp: ExperimentWithDetails) => (
        <Badge className={getStatusColor(exp.status)}>
          {exp.status}
        </Badge>
      )
    },
    {
      key: 'dates',
      label: 'Duration',
      render: (exp: ExperimentWithDetails) => (
        <div className="text-sm">
          {exp.startDate ? (
            <div>Start: {exp.startDate.toLocaleDateString()}</div>
          ) : (
            <div className="text-muted-foreground">No start date</div>
          )}
          {exp.endDate ? (
            <div>End: {exp.endDate.toLocaleDateString()}</div>
          ) : (
            <div className="text-muted-foreground">No end date</div>
          )}
        </div>
      )
    },
    {
      key: 'author',
      label: 'Author',
      render: (exp: ExperimentWithDetails) => exp.userName || 'Unknown'
    },
    {
      key: 'created',
      label: 'Created',
      render: (exp: ExperimentWithDetails) => exp.createdAt.toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (exp: ExperimentWithDetails) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteExperiment(exp.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Experiments Management
          </CardTitle>
          <CardDescription>
            Manage all experiments across the platform. You can view, monitor, and delete experiments from all companies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search experiments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <SuperAdminTable
            data={filteredExperiments}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No experiments found"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperimentsManagement;
