
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import TagInput from '@/components/TagInput';
import { Category } from '@/types';

const IdeaDetailsPage: React.FC = () => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const { ideas, departments, editIdea, categories, getAllUserNames } = useApp();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const allUsers = getAllUserNames();
  
  const idea = ideas.find(i => i.id === ideaId);
  
  useEffect(() => {
    if (idea) {
      setTitle(idea.title || '');
      setDescription(idea.description || '');
      setDepartmentId(idea.departmentId || '');
      setCategory(idea.category as Category || '');
      setTags(idea.tags || []);
      setResponsibleUserId(idea.responsibleUserId || '');
    }
  }, [idea]);
  
  const handleSave = () => {
    if (!idea) return;
    
    editIdea(idea.id, {
      title,
      description,
      departmentId,
      category: category as Category,
      tags,
      responsibleUserId
    });
    
    toast({
      title: "Idea updated",
      description: "Your changes have been saved."
    });
    
    setIsEditing(false);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (!idea) {
    return <div>Idea not found</div>;
  }
  
  const selectedDepartment = departments.find(d => d.id === idea.departmentId);
  const responsibleUser = allUsers.find(u => u.id === idea.responsibleUserId);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBack}>Back</Button>
        {isEditing ? (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Idea</Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Idea Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            {isEditing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <div className="text-lg font-medium">{idea.title}</div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4}
              />
            ) : (
              <div className="text-muted-foreground whitespace-pre-wrap">
                {idea.description || "No description provided."}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              {isEditing ? (
                <Select 
                  value={departmentId} 
                  onValueChange={setDepartmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>{selectedDepartment ? selectedDepartment.name : "No department"}</div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              {isEditing ? (
                <Select 
                  value={category} 
                  onValueChange={(value) => setCategory(value as Category)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>{idea.category || "Uncategorized"}</div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              {isEditing ? (
                <TagInput
                  value={tags}
                  onChange={setTags}
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {idea.tags && idea.tags.length > 0 ? 
                    idea.tags.map((tag, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    )) : 
                    <span className="text-muted-foreground">No tags</span>
                  }
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Responsible Person</Label>
              {isEditing ? (
                <Select 
                  value={responsibleUserId} 
                  onValueChange={setResponsibleUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign responsible person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {allUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>{responsibleUser ? responsibleUser.name : "Unassigned"}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdeaDetailsPage;
