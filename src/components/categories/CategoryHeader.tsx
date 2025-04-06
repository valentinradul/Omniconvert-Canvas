
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';

interface CategoryHeaderProps {
  onOpenAddDialog: () => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ onOpenAddDialog }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Idea Categories</h2>
        <p className="text-muted-foreground">Manage the categories that can be assigned to growth ideas</p>
      </div>
      
      <DialogTrigger asChild>
        <Button onClick={onOpenAddDialog}>Add New Category</Button>
      </DialogTrigger>
    </div>
  );
};

export default CategoryHeader;
