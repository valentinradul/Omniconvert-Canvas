
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

interface DraftIndicatorProps {
  hasSavedDraft: boolean;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  showButtons?: boolean;
}

const DraftIndicator: React.FC<DraftIndicatorProps> = ({
  hasSavedDraft,
  onSaveDraft,
  onClearDraft,
  showButtons = true
}) => {
  if (!hasSavedDraft && !showButtons) return null;

  return (
    <>
      {hasSavedDraft && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              📝 Draft automatically saved - your progress is preserved when you leave this page.
            </p>
          </CardContent>
        </Card>
      )}
      
      {showButtons && (
        <div className="flex gap-3 mb-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSaveDraft}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          
          {hasSavedDraft && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClearDraft}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Draft
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default DraftIndicator;
