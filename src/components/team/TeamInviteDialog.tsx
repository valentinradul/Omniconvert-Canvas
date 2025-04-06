
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { TeamMemberFormData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { fetchUserTeam, addTeamMemberToTeam } from '@/services/teamService';

interface TeamInviteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onComplete?: () => void;
  defaultMessage?: string;
}

export const TeamInviteDialog: React.FC<TeamInviteDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  title = "Invite Team Members",
  description = "Invite colleagues to collaborate on experiments",
  onComplete,
  defaultMessage
}) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [message, setMessage] = useState(
    defaultMessage || 
    `Hey, I'm using ExperimentFlow to manage growth experiments. Join me to collaborate!`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEmail = () => {
    if (!currentEmail) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(currentEmail)) {
      toast.error('This email is already in the list');
      return;
    }
    
    setEmails([...emails, currentEmail]);
    setCurrentEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleSubmit = async () => {
    if (emails.length === 0) {
      toast.error('Please add at least one email to invite');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const teamData = await fetchUserTeam(user.id);
      
      if (!teamData || !teamData.id) {
        throw new Error('Team not found');
      }
      
      const teamId = teamData.id;
      const successfulInvites: string[] = [];
      
      // Process invites one by one
      for (const email of emails) {
        try {
          const memberData: TeamMemberFormData = {
            email,
            name: email.split('@')[0],
            role: 'Team Member',
            department: '',
            customMessage: message
          };
          
          await addTeamMemberToTeam(teamId, memberData);
          successfulInvites.push(email);
        } catch (err) {
          console.error(`Failed to invite ${email}:`, err);
          toast.error(`Failed to invite ${email}`);
        }
      }
      
      if (successfulInvites.length > 0) {
        toast.success(`Successfully invited ${successfulInvites.length} team members`);
        setEmails([]);
        setCurrentEmail('');
        if (onComplete) onComplete();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error inviting team members:', error);
      toast.error('Failed to invite team members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="colleague@company.com"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button variant="secondary" onClick={handleAddEmail}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          
          {emails.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <Label className="text-sm text-gray-500 mb-2 block">
                Emails to invite ({emails.length}):
              </Label>
              <div className="flex flex-wrap gap-2">
                {emails.map(email => (
                  <div 
                    key={email} 
                    className="bg-white rounded-full px-3 py-1 text-sm flex items-center border"
                  >
                    <Mail className="h-3 w-3 mr-2 text-blue-500" />
                    {email}
                    <button 
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Customize your invitation message:
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || emails.length === 0}
          >
            {isSubmitting ? 'Sending...' : 'Send Invites'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
