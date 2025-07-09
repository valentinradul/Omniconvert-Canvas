
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SuperAdminTable from './SuperAdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit, Trash2, Search, Filter, Building, Users, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EnhancedIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  username: string;
  createdat: string;
  is_public: boolean;
  company_name: string;
  department_name: string;
  company_id: string;
  departmentid: string;
}

const EnhancedIdeasManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
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

  const { data: ideasData, isLoading } = useQuery({
    queryKey: ['super-admin-ideas', currentPage, searchTerm, selectedCompany, selectedVisibility],
    queryFn: async () => {
      let query = supabase
        .from('ideas')
        .select(`
          *,
          companies:company_id(name),
          departments:departmentid(name)
        `)
        .order('createdat', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCompany !== 'all') {
        query = query.eq('company_id', selectedCompany);
      }

      if (selectedVisibility !== 'all') {
        query = query.eq('is_public', selectedVisibility === 'public');
      }

      const { data, error } = await query;
      if (error) throw error;

      const enhancedData: EnhancedIdea[] = data.map(idea => ({
        id: idea.id,
        title: idea.title,
        description: idea.description || '',
        category: idea.category || 'Uncategorized',
        username: idea.username || 'Unknown',
        createdat: idea.createdat,
        is_public: idea.is_public || false,
        company_name: idea.companies?.name || 'No Company',
        department_name: idea.departments?.name || 'No Department',
        company_id: idea.company_id || '',
        departmentid: idea.departmentid || ''
      }));

      return {
        ideas: enhancedData,
        totalCount: enhancedData.length
      };
    }
  });

  const handleDeleteIdea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Idea deleted successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['super-admin-ideas'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete idea.',
      });
    }
    setDeleteId(null);
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ is_public: !currentVisibility })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Idea ${currentVisibility ? 'made private' : 'published publicly'}.`,
      });

      queryClient.invalidateQueries({ queryKey: ['super-admin-ideas'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update idea visibility.',
      });
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (idea: EnhancedIdea) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{idea.title}</p>
          <p className="text-sm text-muted-foreground truncate">{idea.description}</p>
        </div>
      )
    },
    {
      key: 'company_name',
      header: 'Company',
      render: (idea: EnhancedIdea) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <span>{idea.company_name}</span>
        </div>
      )
    },
    {
      key: 'department_name',
      header: 'Department',
      render: (idea: EnhancedIdea) => idea.department_name
    },
    {
      key: 'category',
      header: 'Category',
      render: (idea: EnhancedIdea) => (
        <Badge variant="outline">{idea.category}</Badge>
      )
    },
    {
      key: 'username',
      header: 'Created By',
      render: (idea: EnhancedIdea) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{idea.username}</span>
        </div>
      )
    },
    {
      key: 'is_public',
      header: 'Visibility',
      render: (idea: EnhancedIdea) => (
        <Badge variant={idea.is_public ? 'default' : 'secondary'}>
          {idea.is_public ? 'Public' : 'Private'}
        </Badge>
      )
    },
    {
      key: 'createdat',
      header: 'Created',
      render: (idea: EnhancedIdea) => new Date(idea.createdat).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (idea: EnhancedIdea) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleVisibility(idea.id, idea.is_public)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(idea.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const filteredIdeas = ideasData?.ideas || [];
  const totalCount = ideasData?.totalCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Enhanced Ideas Management</h1>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Public Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredIdeas.filter(idea => idea.is_public).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Private Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredIdeas.filter(idea => !idea.is_public).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredIdeas.map(idea => idea.company_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
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
        <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ideas</SelectItem>
            <SelectItem value="public">Public Only</SelectItem>
            <SelectItem value="private">Private Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ideas Table */}
      <SuperAdminTable
        title="All Platform Ideas"
        data={filteredIdeas}
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
              This action cannot be undone. This will permanently delete the idea and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteIdea(deleteId)}
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

export default EnhancedIdeasManagement;
