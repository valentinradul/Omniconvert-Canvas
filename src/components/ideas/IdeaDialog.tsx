
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category } from '@/types';
import IdeaForm from './IdeaForm';

interface IdeaDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  departments: Array<{ id: string; name: string }>;
  categories: Category[];
  allUsers: Array<{ id: string; name: string }>;
  onAddIdea: (ideaData: {
    title: string;
    description: string;
    category: Category;
    departmentId: string;
    tags: string[];
    responsibleUserId?: string;
  }) => void;
}

const IdeaDialog: React.FC<IdeaDialogProps> = ({
  isOpen,
  setIsOpen,
  departments,
  categories,
  allUsers,
  onAddIdea
}) => {
  const handleSubmit = (ideaData: {
    title: string;
    description: string;
    category: Category;
    departmentId: string;
    tags: string[];
    responsibleUserId?: string;
  }) => {
    onAddIdea(ideaData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>New Growth Idea</DialogTitle>
          <DialogDescription>Create a new growth idea to test</DialogDescription>
        </DialogHeader>
        
        <IdeaForm
          departments={departments}
          categories={categories}
          allUsers={allUsers}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default IdeaDialog;
