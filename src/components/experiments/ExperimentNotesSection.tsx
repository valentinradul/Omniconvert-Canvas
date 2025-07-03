import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ExperimentNote } from '@/types';
import { format } from 'date-fns';
import { User, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';

interface ExperimentNotesSectionProps {
  notes_history: ExperimentNote[];
  onAddNote: (content: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const ExperimentNotesSection: React.FC<ExperimentNotesSectionProps> = ({
  notes_history,
  onAddNote,
  onDeleteNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { user } = useAuth();
  const { userCompanyRole } = useCompany();

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    onAddNote(newNote.trim());
    setNewNote('');
    setIsAddingNote(false);
  };

  const isCompanyOwner = userCompanyRole === 'owner';
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(noteId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Experiment Notes</CardTitle>
          {!isAddingNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingNote && (
          <div className="space-y-3 p-4 border rounded-lg bg-accent/50">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add your note here..."
              className="min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                Add Note
              </Button>
            </div>
          </div>
        )}

        {notes_history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes added yet.</p>
            <p className="text-sm">Click "Add Note" to start documenting your experiment progress.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes_history
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((note) => (
                <div key={note.id} className="flex gap-3 p-4 border rounded-lg">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {getInitials(note.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{note.author_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {format(new Date(note.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                        </span>
                      </div>
                      {(isCompanyOwner || note.created_by === user?.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentNotesSection;