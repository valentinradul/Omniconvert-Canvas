
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TeamInviteDialogContentProps {
  onSubmit: (emails: string[], message: string) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultMessage?: string;
}

export const TeamInviteDialogContent: React.FC<TeamInviteDialogContentProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultMessage = ''
}) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [message, setMessage] = useState<string>(defaultMessage);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value.trim();
    setEmails(newEmails);
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...emails];
    newEmails.splice(index, 1);
    setEmails(newEmails);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter(email => email && validateEmail(email));
    if (validEmails.length > 0) {
      onSubmit(validEmails, message);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email addresses</label>
          {emails.map((email, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                required={index === 0}
                className="flex-1"
              />
              {emails.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRemoveEmail(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={handleAddEmail}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="block text-sm font-medium">Add a personal message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message to include in the invitation email..."
            rows={4}
          />
        </div>
      </div>

      <DialogFooter className="pt-4 space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !emails[0]}>
          {isSubmitting ? 'Sending...' : 'Send Invitations'}
        </Button>
      </DialogFooter>
    </form>
  );
};
