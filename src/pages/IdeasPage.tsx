
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CATEGORIES, Category } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IdeasPage: React.FC = () => {
  const { ideas, departments, addIdea, getHypothesisByIdeaId, getDepartmentById } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [departmentId, setDepartmentId] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !category || !departmentId) {
      toast.error('Please fill in all fields');
      return;
    }
    
    addIdea({
      title,
      description,
      category: category as Category,
      departmentId
    });
    
    // Reset form and close dialog
    setTitle('');
    setDescription('');
    setCategory('');
    setDepartmentId('');
    setOpen(false);
    
    toast.success('Growth idea added successfully!');
  };
  
  const createHypothesis = (ideaId: string) => {
    navigate(`/create-hypothesis/${ideaId}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Growth Ideas</h1>
          <p className="text-muted-foreground">Manage your growth idea backlog</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add New Idea</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Growth Idea</DialogTitle>
                <DialogDescription>
                  Add a new growth idea to your backlog. You can later convert it to a hypothesis.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Idea Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="E.g. Implement in-app referral program" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe your growth idea in more detail"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={category} 
                    onValueChange={(value) => setCategory(value as Category)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ALL_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={departmentId} 
                    onValueChange={(value) => setDepartmentId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Idea</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-medium">No growth ideas yet</h3>
          <p className="text-muted-foreground mb-4">Create your first growth idea to get started</p>
          <Button onClick={() => setOpen(true)}>Add New Idea</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map(idea => {
            const department = getDepartmentById(idea.departmentId);
            const hasHypothesis = !!getHypothesisByIdeaId(idea.id);
            
            return (
              <Card key={idea.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{idea.title}</CardTitle>
                      <CardDescription>
                        {department?.name} · {idea.category}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    onClick={() => navigate(`/idea-details/${idea.id}`)}
                    variant="outline"
                  >
                    View Details
                  </Button>
                  {!hasHypothesis && (
                    <Button
                      onClick={() => createHypothesis(idea.id)}
                    >
                      Create Hypothesis
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IdeasPage;
