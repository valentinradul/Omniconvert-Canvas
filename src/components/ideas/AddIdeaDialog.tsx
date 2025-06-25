
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

  console.log('AddIdeaDialog formData:', formData);
  console.log('Available departments:', departments.map(d => ({ id: d.id, name: d.name })));

  const handleAddIdea = async () => {
    if (formData.category && formData.title && formData.description) {
      const newIdea = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        departmentId: formData.departmentId || undefined,
        tags: formData.tags,
        isPublic: formData.isPublic
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
              <Select 
                value={formData.category || ''} 
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
                value={formData.departmentId || ''} 
                onValueChange={(value) => {
                  console.log('Department selected:', value);
                  updateField('departmentId', value);
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
