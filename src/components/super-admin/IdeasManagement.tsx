
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SuperAdminTable from './SuperAdminTable';
import { useToast } from '@/hooks/use-toast';
import { Search, Lightbulb, Eye, EyeOff, Trash2 } from 'lucide-react';
import { GrowthIdea } from '@/types';

interface IdeaWithCompany extends GrowthIdea {
  company_name?: string;
  department_name?: string;
}

const IdeasManagement: React.FC = () => {
  const [ideas, setIdeas] = useState<IdeaWithCompany[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaWithCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          companies:company_id(name),
          departments:departmentid(name)
        `)
        .order('createdat', { ascending: false });

      if (error) throw error;

      const formattedIdeas: IdeaWithCompany[] = (data || []).map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description || '',
        category: idea.category || 'Uncategorized',
        departmentId: idea.departmentid,
        createdAt: new Date(idea.createdat),
        userId: idea.userid,
        userName: idea.username || 'Unknown',
        tags: idea.tags || [],
        companyId: idea.company_id,
        isPublic: idea.is_public || false,
        company_name: idea.companies?.name || 'No Company',
        department_name: idea.departments?.name || 'No Department'
      }));

      setIdeas(formattedIdeas);
      setFilteredIdeas(formattedIdeas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch ideas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  useEffect(() => {
    const filtered = ideas.filter(idea =>
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIdeas(filtered);
  }, [searchTerm, ideas]);

  const togglePublicStatus = async (ideaId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ is_public: !currentStatus })
        .eq('id', ideaId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Idea ${!currentStatus ? 'made public' : 'made private'}`,
      });

      fetchIdeas();
    } catch (error) {
      console.error('Error updating idea:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update idea visibility',
      });
    }
  };

  const deleteIdea = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Idea deleted successfully',
      });

      fetchIdeas();
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete idea',
      });
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (idea: IdeaWithCompany) => (
        <div>
          <div className="font-medium">{idea.title}</div>
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {idea.description}
          </div>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Company',
      render: (idea: IdeaWithCompany) => idea.company_name || 'No Company'
    },
    {
      key: 'department',
      label: 'Department',
      render: (idea: IdeaWithCompany) => idea.department_name || 'No Department'
    },
    {
      key: 'category',
      label: 'Category',
      render: (idea: IdeaWithCompany) => (
        <Badge variant="secondary">{idea.category}</Badge>
      )
    },
    {
      key: 'author',
      label: 'Author',
      render: (idea: IdeaWithCompany) => idea.userName || 'Unknown'
    },
    {
      key: 'created',
      label: 'Created',
      render: (idea: IdeaWithCompany) => idea.createdAt.toLocaleDateString()
    },
    {
      key: 'visibility',
      label: 'Visibility',
      render: (idea: IdeaWithCompany) => (
        <div className="flex items-center space-x-2">
          {idea.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <Switch
            checked={idea.isPublic}
            onCheckedChange={() => togglePublicStatus(idea.id, idea.isPublic || false)}
            size="sm"
          />
          <Label className="text-xs">
            {idea.isPublic ? 'Public' : 'Private'}
          </Label>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (idea: IdeaWithCompany) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteIdea(idea.id)}
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
            <Lightbulb className="h-5 w-5" />
            Ideas Management
          </CardTitle>
          <CardDescription>
            Manage all growth ideas across the platform. You can view, modify visibility, and delete ideas from all companies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <SuperAdminTable
            data={filteredIdeas}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No ideas found"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default IdeasManagement;
