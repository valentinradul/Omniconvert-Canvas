
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category } from '@/types';

interface EditCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: { oldValue: Category; newValue: Category } | null;
  onEditingCategoryChange: (category: { oldValue: Category; newValue: Category } | null) => void;
  onSave: () => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  isOpen,
  onOpenChange,
  editingCategory,
  onEditingCategoryChange,
  onSave
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Rename the selected category. Any ideas using this category will be updated.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="edit-category-name">Category Name</Label>
          <Input
            id="edit-category-name"
            value={editingCategory?.newValue || ''}
            onChange={(e) => {
              // Ensure we're passing the correct type (Category) for newValue
              onEditingCategoryChange(
                editingCategory ? { ...editingCategory, newValue: e.target.value as Category } : null
              );
            }}
            placeholder="Enter category name"
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onEditingCategoryChange(null);
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
