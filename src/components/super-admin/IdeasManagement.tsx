
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SuperAdminTable from './SuperAdminTable';
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
  Lightbulb,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { GrowthIdea } from '@/types/ideas';

interface Company {
  id: string;
  name: string;
}

interface IdeasData extends GrowthIdea {
  company_name?: string;
  department_name?: string;
}

const IdeasManagement: React.FC = () => {
  const [ideas, setIdeas] = useState<IdeasData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<IdeasData | null>(null);
  const { toast } = useToast();

  // Get unique categories
  const categories = [...new Set(ideas.map(idea => idea.category).filter(Boolean))];

  // Calculate stats
  const totalIdeas = ideas.length;
  const ideasByCompany = companies.reduce((acc, company) => {
    acc[company.name] = ideas.filter(idea => idea.companyId === company.id).length;
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

      // Fetch ideas with company information
      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select(`
          *,
          companies!inner(name)
        `)
        .order('createdat', { ascending: false });

      if (ideasError) throw ideasError;

      // Fetch departments separately to get department names
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name');

      if (departmentsError) throw departmentsError;

      // Create a map of department id to name
      const departmentMap = new Map(
        (departmentsData || []).map(dept => [dept.id, dept.name])
      );

      // Transform the data
      const formattedIdeas: IdeasData[] = (ideasData || []).map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description || '',
        category: idea.category || '',
        departmentId: idea.departmentid,
        createdAt: new Date(idea.createdat),
        userId: idea.userid,
        userName: idea.username,
        tags: idea.tags || [],
        companyId: idea.company_id,
        isPublic: idea.is_public,
        company_name: idea.companies?.name,
        department_name: idea.departmentid ? departmentMap.get(idea.departmentid) || 'Unknown Department' : 'No Department'
      }));

      setIdeas(formattedIdeas);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch ideas data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIdea = async () => {
    if (!ideaToDelete) return;

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaToDelete.id);

      if (error) throw error;

      setIdeas(ideas.filter(idea => idea.id !== ideaToDelete.id));
      toast({
        title: 'Success',
        description: 'Idea deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting idea:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete idea.',
      });
    } finally {
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
    }
  };

  // Filter ideas based on search and filters
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = selectedCompany === 'all' || idea.companyId === selectedCompany;
    const matchesCategory = selectedCategory === 'all' || idea.category === selectedCategory;

    return matchesSearch && matchesCompany && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIdeas = filteredIdeas.slice(startIndex, startIndex + itemsPerPage);

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (idea: IdeasData) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{idea.title}</div>
          <div className="text-sm text-gray-500 truncate">{idea.description}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      render: (idea: IdeasData) => (
        <Badge variant="secondary">{idea.category || 'No category'}</Badge>
      ),
    },
    {
      key: 'company_name',
      header: 'Company',
      render: (idea: IdeasData) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{idea.company_name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'department_name',
      header: 'Department',
      render: (idea: IdeasData) => (
        <span className="text-sm text-gray-600">
          {idea.department_name || 'No department'}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'Created By',
      render: (idea: IdeasData) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{idea.userName || 'Unknown'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'createdat',
      header: 'Created',
      render: (idea: IdeasData) => (
        <span className="text-sm text-gray-600">
          {format(idea.createdAt, 'MMM dd, yyyy')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (idea: IdeasData) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {idea.tags && idea.tags.length > 0 ? (
            idea.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400">No tags</span>
          )}
          {idea.tags && idea.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{idea.tags.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (idea: IdeasData) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setIdeaToDelete(idea);
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
        <h1 className="text-3xl font-bold text-gray-900">Ideas Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor ideas across all companies</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIdeas}</div>
            <p className="text-xs text-muted-foreground">
              Across {companies.length} companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique categories
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
              {Object.keys(ideasByCompany).length > 0 
                ? Object.entries(ideasByCompany).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(ideasByCompany).length > 0 
                ? `${Math.max(...Object.values(ideasByCompany))} ideas`
                : 'No ideas yet'
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
                  placeholder="Search ideas..."
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

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ideas Table */}
      <SuperAdminTable
        title="Ideas"
        data={paginatedIdeas}
        columns={columns}
        totalItems={filteredIdeas.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the idea "{ideaToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIdea} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IdeasManagement;
