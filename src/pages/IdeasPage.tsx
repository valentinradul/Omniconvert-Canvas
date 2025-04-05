
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

const IdeasPage: React.FC = () => {
  const { ideas, departments, addIdea, getDepartmentById, getAllTags, getAllUserNames } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responsibleUserId, setResponsibleUserId] = useState<string | undefined>(undefined);
  
  // Filters
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);
  
  const allTags = getAllTags();
  const allUsers = getAllUserNames();

  const handleAddIdea = () => {
    if (departmentId && category && title && description) {
      addIdea({
        title,
        description,
        category,
        departmentId,
        tags,
        responsibleUserId
      });

      setTitle('');
      setDescription('');
      setCategory(undefined);
      setDepartmentId(undefined);
      setTags([]);
      setResponsibleUserId(undefined);
      setIsDialogOpen(false);
    }
  };

  const sortedIdeas = [...ideas]
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .filter(idea => {
      // Apply tag filter
      if (filterTag && (!idea.tags || !idea.tags.includes(filterTag))) {
        return false;
      }
      
      // Apply user filter
      if (filterUserId && idea.responsibleUserId !== filterUserId) {
        return false;
      }
      
      return true;
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
              
              <div>
                <Label htmlFor="responsible">Responsible Person</Label>
                <Select
                  value={responsibleUserId}
                  onValueChange={setResponsibleUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to someone" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleAddIdea} disabled={!title || !description || !category || !departmentId}>
                Create Idea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-64">
          <Label htmlFor="filter-tag" className="mb-1 block">Filter by Tag</Label>
          <Select
            value={filterTag}
            onValueChange={setFilterTag}
          >
            <SelectTrigger id="filter-tag">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-64">
          <Label htmlFor="filter-user" className="mb-1 block">Filter by Responsible</Label>
          <Select
            value={filterUserId}
            onValueChange={setFilterUserId}
          >
            <SelectTrigger id="filter-user">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {allUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(filterTag || filterUserId) && (
          <div className="self-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilterTag(undefined);
                setFilterUserId(undefined);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
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
                <TableHead>Responsible</TableHead>
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
                    {idea.responsibleUserId ? 
                      allUsers.find(u => u.id === idea.responsibleUserId)?.name || "Unknown" : 
                      "Unassigned"}
                  </TableCell>
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
