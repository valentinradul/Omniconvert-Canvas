
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import TagInput from '@/components/TagInput';
import DraftIndicator from '@/components/DraftIndicator';
import { Category, GrowthIdea } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDraftState } from '@/hooks/useDraftState';
import { Plus } from 'lucide-react';

interface AddIdeaDialogProps {
  departments: any[];
  categories: { id: string; name: string }[];
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => Promise<GrowthIdea | null>;
  addCategory?: (name: string, departmentId?: string) => Promise<{ id: string; name: string } | null>;
  addDepartment?: (name: string) => Promise<{ id: string; name: string } | null>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AddIdeaDialog: React.FC<AddIdeaDialogProps> = ({
  departments,
  categories,
  addIdea,
  addCategory,
  addDepartment,
  isOpen,
  setIsOpen
}) => {
  const { toast } = useToast();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  
  const defaultValues = {
    title: '',
    description: '',
    category: undefined as Category | undefined,
    departmentId: undefined as string | undefined,
    tags: [] as string[]
  };

  const {
    formData,
    hasSavedDraft,
    isInitialized,
    updateField,
    clearDraft,
    saveDraft,
    clearDraftOnSubmit,
    setFormData
  } = useDraftState({
    storageKey: 'idea-draft',
    defaultValues,
    onClear: () => {
      setFormData(defaultValues);
    }
  });

  // Validate department ID exists in current departments list after migration
  useEffect(() => {
    if (isInitialized && formData.departmentId) {
      const departmentExists = departments.some(dept => dept.id === formData.departmentId);
      if (!departmentExists) {
        console.log('Department ID no longer valid after migration, clearing:', formData.departmentId);
        updateField('departmentId', undefined);
      }
    }
  }, [isInitialized, formData.departmentId, departments, updateField]);

  console.log('AddIdeaDialog formData:', formData);
  console.log('Available departments:', departments.map(d => ({ id: d.id, name: d.name })));

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !addCategory) return;
    
    const result = await addCategory(newCategoryName.trim(), formData.departmentId);
    if (result) {
      updateField('category', result.name);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      toast({
        title: 'Category created',
        description: `Category "${result.name}" has been created successfully.`
      });
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim() || !addDepartment) return;
    
    const result = await addDepartment(newDepartmentName.trim());
    if (result) {
      updateField('departmentId', result.id);
      setNewDepartmentName('');
      setIsCreatingDepartment(false);
      toast({
        title: 'Department created',
        description: `Department "${result.name}" has been created successfully.`
      });
    }
  };

  const handleAddIdea = async () => {
    if (formData.category && formData.title && formData.description) {
      const newIdea = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        departmentId: formData.departmentId || undefined,
        tags: formData.tags
      };

      console.log('Submitting idea with department:', newIdea.departmentId);

      const result = await addIdea(newIdea);
      
      if (result !== null) {
        setFormData(defaultValues);
        clearDraftOnSubmit();
        setIsOpen(false);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all required fields to create an idea.'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>New Growth Idea</DialogTitle>
          <DialogDescription>Create a new growth idea to test</DialogDescription>
        </DialogHeader>
        
        <DraftIndicator
          hasSavedDraft={hasSavedDraft}
          onSaveDraft={saveDraft}
          onClearDraft={clearDraft}
          showButtons={false}
        />
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={(e) => updateField('title', e.target.value)} 
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              value={formData.description} 
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags</Label>
            <TagInput 
              tags={formData.tags}
              onChange={(tags) => updateField('tags', tags)}
              placeholder="Type tag and press Enter"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Type a tag and press Enter or comma to add
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              {isCreatingCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCategory();
                      } else if (e.key === 'Escape') {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategoryName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value) => {
                    if (value === '__create_new__') {
                      setIsCreatingCategory(true);
                    } else {
                      updateField('category', value as Category);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {addCategory && (
                      <SelectItem value="__create_new__" className="text-primary">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create new category
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              {isCreatingDepartment ? (
                <div className="flex gap-2">
                  <Input
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Enter department name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateDepartment();
                      } else if (e.key === 'Escape') {
                        setIsCreatingDepartment(false);
                        setNewDepartmentName('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateDepartment}
                    disabled={!newDepartmentName.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCreatingDepartment(false);
                      setNewDepartmentName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select 
                  value={formData.departmentId || ''} 
                  onValueChange={(value) => {
                    if (value === '__create_new__') {
                      setIsCreatingDepartment(true);
                    } else {
                      console.log('Department selected:', value);
                      updateField('departmentId', value);
                    }
                  }}
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
                    {addDepartment && (
                      <SelectItem value="__create_new__" className="text-primary">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create new department
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={saveDraft}
              size="sm"
            >
              Save Draft
            </Button>
            
            {hasSavedDraft && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearDraft}
                size="sm"
              >
                Clear Draft
              </Button>
            )}
          </div>
          
          <Button 
            onClick={handleAddIdea} 
            disabled={!formData.title || !formData.description || !formData.category}
          >
            Create Idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddIdeaDialog;
