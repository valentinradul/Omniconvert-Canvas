
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import TagInput from '@/components/TagInput';
import DraftIndicator from '@/components/DraftIndicator';
import { Category, ALL_CATEGORIES, GrowthIdea } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDraftState } from '@/hooks/useDraftState';

// Function to check if a string is a valid UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

interface AddIdeaDialogProps {
  departments: any[];
  addIdea: (idea: Omit<GrowthIdea, 'id' | 'createdAt'>) => Promise<GrowthIdea | null>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AddIdeaDialog: React.FC<AddIdeaDialogProps> = ({
  departments,
  addIdea,
  isOpen,
  setIsOpen
}) => {
  const { toast } = useToast();
  
  const defaultValues = {
    title: '',
    description: '',
    category: undefined as Category | undefined,
    departmentId: undefined as string | undefined,
    tags: [] as string[],
    isPublic: false
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

  // Validate department ID when form data changes
  useEffect(() => {
    if (formData.departmentId && !isValidUUID(formData.departmentId)) {
      console.log('Invalid department ID detected, clearing:', formData.departmentId);
      updateField('departmentId', undefined);
    }
  }, [formData.departmentId, updateField]);

  // Also validate that the department ID exists in the current departments list
  useEffect(() => {
    if (formData.departmentId && isValidUUID(formData.departmentId)) {
      const departmentExists = departments.some(dept => dept.id === formData.departmentId);
      if (!departmentExists) {
        console.log('Department no longer exists, clearing:', formData.departmentId);
        updateField('departmentId', undefined);
      }
    }
  }, [formData.departmentId, departments, updateField]);

  const handleAddIdea = async () => {
    if (formData.category && formData.title && formData.description) {
      // Only include departmentId if it's properly selected from the dropdown and is a valid UUID
      const newIdea = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        departmentId: (formData.departmentId && isValidUUID(formData.departmentId)) ? formData.departmentId : undefined,
        tags: formData.tags,
        isPublic: formData.isPublic
      };

      const result = await addIdea(newIdea);
      
      if (result !== null) { // Check for null instead of truthiness
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
        
        {/* Only show the draft notification, not the buttons */}
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
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateField('category', value as Category)}
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
                value={formData.departmentId} 
                onValueChange={(value) => updateField('departmentId', value)}
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
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public-idea"
              checked={formData.isPublic}
              onCheckedChange={(checked) => updateField('isPublic', checked)}
            />
            <Label htmlFor="public-idea">Make this idea public</Label>
            <p className="text-xs text-muted-foreground ml-2">
              Public ideas can be viewed by anyone
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          {/* Draft controls on the left */}
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
          
          {/* Create button on the right */}
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
