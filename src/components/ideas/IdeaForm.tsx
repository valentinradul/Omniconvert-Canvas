
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TagInput from '@/components/TagInput';
import { Category } from '@/types';

interface IdeaFormProps {
  departments: Array<{ id: string; name: string }>;
  categories: Category[];
  allUsers: Array<{ id: string; name: string }>;
  onSubmit: (ideaData: {
    title: string;
    description: string;
    category: Category;
    departmentId: string;
    tags: string[];
    responsibleUserId?: string;
  }) => void;
  onCancel?: () => void;
}

const IdeaForm: React.FC<IdeaFormProps> = ({
  departments,
  categories,
  allUsers,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [responsibleUserId, setResponsibleUserId] = useState<string | undefined>(undefined);

  const handleSubmit = () => {
    if (!category || !departmentId || !title || !description) {
      return;
    }
    
    onSubmit({
      title,
      description,
      category,
      departmentId,
      tags,
      responsibleUserId
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory(undefined);
    setDepartmentId(undefined);
    setTags([]);
    setResponsibleUserId(undefined);
  };

  const isFormValid = title && description && category && departmentId;

  return (
    <div className="grid gap-4 py-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
        />
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
              {categories.map((cat) => (
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
      
      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!isFormValid}>
          Create Idea
        </Button>
      </div>
    </div>
  );
};

export default IdeaForm;
