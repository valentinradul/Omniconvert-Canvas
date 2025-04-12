
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit } from 'lucide-react';
import { Hypothesis } from '@/types';

interface HypothesisHeaderProps {
  ideaTitle: string;
  hypothesisCreatedAt: Date | string;
  onDelete: () => void;
  onEditClick: () => void;
  isEditing: boolean;
}

const HypothesisHeader: React.FC<HypothesisHeaderProps> = ({
  ideaTitle,
  hypothesisCreatedAt,
  onDelete,
  onEditClick,
  isEditing
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <div>
        <Button variant="outline" onClick={() => navigate('/hypotheses')} className="mb-4">
          Back to Hypotheses
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{ideaTitle}</h1>
        <p className="text-muted-foreground">
          Created on {new Date(hypothesisCreatedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onEditClick}
          disabled={isEditing}
        >
          <Edit className="mr-2 h-4 w-4" /> Edit Hypothesis
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Hypothesis</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                hypothesis and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default HypothesisHeader;
