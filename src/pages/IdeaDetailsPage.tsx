
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ALL_CATEGORIES, Category } from '@/types';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const IdeaDetailsPage: React.FC = () => {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { 
    getIdeaById, 
    getDepartmentById, 
    editIdea, 
    deleteIdea, 
    departments, 
    getHypothesisByIdeaId 
  } = useApp();
  
  const [idea, setIdea] = useState(getIdeaById(ideaId || ''));
  const [department, setDepartment] = useState(idea ? getDepartmentById(idea.departmentId) : undefined);
  const [hypothesis, setHypothesis] = useState(idea ? getHypothesisByIdeaId(idea.id) : undefined);
  
  // Form state
  const [title, setTitle] = useState(idea?.title || '');
  const [description, setDescription] = useState(idea?.description || '');
  const [category, setCategory] = useState<Category | ''>(idea?.category || '');
  const [departmentId, setDepartmentId] = useState(idea?.departmentId || '');
  const [isPublic, setIsPublic] = useState(idea?.isPublic || false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  useEffect(() => {
    const currentIdea = getIdeaById(ideaId || '');
    setIdea(currentIdea);
    
    if (currentIdea) {
      setTitle(currentIdea.title);
      setDescription(currentIdea.description);
      setCategory(currentIdea.category);
      setDepartmentId(currentIdea.departmentId);
      setDepartment(getDepartmentById(currentIdea.departmentId));
      setHypothesis(getHypothesisByIdeaId(currentIdea.id));
      setIsPublic(currentIdea.isPublic || false);
    } else {
      navigate('/ideas');
    }
  }, [ideaId, getIdeaById, getDepartmentById, getHypothesisByIdeaId, navigate]);
  
  if (!idea) {
    return <div>Loading...</div>;
  }
  
  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !category) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    editIdea(idea.id, {
      title,
      description,
      category: category as Category,
      departmentId,
      isPublic
    });
    
    setEditDialogOpen(false);
    toast.success('Growth idea updated successfully!');
  };
  
  const handleDelete = () => {
    deleteIdea(idea.id);
    navigate('/ideas');
    toast.success('Growth idea deleted successfully!');
  };
  
  const createHypothesis = () => {
    navigate(`/create-hypothesis/${idea.id}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => navigate('/ideas')} className="mb-4">
            Back to Ideas
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
            {idea.isPublic && <Badge>Public</Badge>}
          </div>
          <p className="text-muted-foreground">
            {department?.name} · {idea.category} · Created on {new Date(idea.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Idea</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleEdit}>
                <DialogHeader>
                  <DialogTitle>Edit Growth Idea</DialogTitle>
                  <DialogDescription>
                    Update the details of your growth idea.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Idea Title</Label>
                    <Input 
                      id="title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public-idea"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public-idea">Make this idea public</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Idea</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this
                  growth idea from your backlog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Idea Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{idea.description}</p>
        </CardContent>
      </Card>
      
      {hypothesis ? (
        <Card>
          <CardHeader>
            <CardTitle>Hypothesis</CardTitle>
            <CardDescription>
              This idea has been developed into a hypothesis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-md mb-2">
              <strong>Because we observed:</strong> {hypothesis.observation}
            </p>
            <p className="text-md mb-2">
              <strong>We will do:</strong> {hypothesis.initiative}
            </p>
            <p className="text-md">
              <strong>With the measurable goal to improve:</strong> {hypothesis.metric}
            </p>
            <Button 
              onClick={() => navigate(`/hypothesis-details/${hypothesis.id}`)}
              className="mt-4"
            >
              View Hypothesis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-xl font-medium">No hypothesis yet</h3>
          <p className="text-muted-foreground mb-4">Create a hypothesis to test this idea</p>
          <Button onClick={createHypothesis}>Create Hypothesis</Button>
        </div>
      )}
    </div>
  );
};

export default IdeaDetailsPage;
