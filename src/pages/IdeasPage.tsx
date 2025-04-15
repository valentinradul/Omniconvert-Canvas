
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, ALL_CATEGORIES } from '@/types';
import TagInput from '@/components/TagInput';
import { Search, Filter, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const IdeasPage: React.FC = () => {
  const { ideas, departments, addIdea, getDepartmentById, getAllTags, getAllUserNames } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Search and filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  
  // Get all user names for the filter
  const allUsers = getAllUserNames();
  const allTags = getAllTags();

  const handleAddIdea = async () => {
    if (category && title && description) {
      // Only include departmentId if it's properly selected from the dropdown
      const newIdea = {
        title,
        description,
        category,
        departmentId: departmentId || undefined,
        tags
      };

      const result = await addIdea(newIdea);
      
      if (result !== null) { // Check for null instead of truthiness
        setTitle('');
        setDescription('');
        setCategory(undefined);
        setDepartmentId(undefined);
        setTags([]);
        setIsDialogOpen(false);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all required fields to create an idea.'
      });
    }
  };

  // Filter ideas based on search and filter criteria
  const filteredIdeas = ideas.filter(idea => {
    // Search query filter
    if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !idea.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (categoryFilter !== 'all' && idea.category !== categoryFilter) {
      return false;
    }
    
    // Department filter
    if (departmentFilter !== 'all' && idea.departmentId !== departmentFilter) {
      return false;
    }
    
    // Responsible user filter
    if (responsibleFilter !== 'all' && idea.userId !== responsibleFilter) {
      return false;
    }
    
    return true;
  });

  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Growth Ideas</h2>
          <p className="text-muted-foreground">Capture and manage growth ideas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Idea</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>New Growth Idea</DialogTitle>
              <DialogDescription>Create a new growth idea to test</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags</Label>
                <TagInput 
                  tags={tags}
                  onChange={setTags}
                  placeholder="Type tag and press Enter"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Type a tag and press Enter or comma to add
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={category} 
                    onValueChange={(value) => setCategory(value as Category)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={departmentId} 
                    onValueChange={setDepartmentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleAddIdea} disabled={!title || !description || !category}>
                Create Idea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-lg border p-4 mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search ideas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setDepartmentFilter('all');
              setResponsibleFilter('all');
            }}
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={departmentFilter} 
              onValueChange={(value) => setDepartmentFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={responsibleFilter} 
              onValueChange={(value) => setResponsibleFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Responsible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {allUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {ideas.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIdeas.map((idea) => (
                <TableRow key={idea.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/idea-details/${idea.id}`)}>
                  <TableCell className="font-medium">{idea.title}</TableCell>
                  <TableCell>{idea.category}</TableCell>
                  <TableCell>{getDepartmentById(idea.departmentId)?.name}</TableCell>
                  <TableCell>{idea.userName || "Unknown"}</TableCell>
                  <TableCell>
                    {idea.tags && idea.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {idea.tags.map((tag, i) => (
                          <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">No tags</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/idea-details/${idea.id}`);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Growth Ideas Yet</CardTitle>
            <CardDescription>Create your first growth idea to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Growth ideas are the foundation of your experiments. Start by adding a new idea!</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsDialogOpen(true)}>Add Your First Idea</Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default IdeasPage;
