
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TeamMemberFormData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { fetchUserTeam, addTeamMemberToTeam } from '@/services/teamService';
import { TeamInviteDialogContent } from './TeamInviteDialogContent';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const handleInvitations = async (emails: string[], message: string) => {
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
            role: 'member',
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
        setSentEmails(successfulInvites);
        toast.success(`Successfully invited ${successfulInvites.length} team members`);
      }
    } catch (error) {
      console.error('Error inviting team members:', error);
      toast.error('Failed to invite team members');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (sentEmails.length > 0 && onComplete) {
      onComplete();
    }
    
    // Reset state when dialog closes
    setSentEmails([]);
    onOpenChange(false);
  };

  const handleContinue = () => {
    if (onComplete) {
      onComplete();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {sentEmails.length > 0 ? (
          <div className="py-4">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Invitations sent successfully!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {sentEmails.map(email => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleContinue}>Continue</Button>
            </div>
          </div>
        ) : (
          <TeamInviteDialogContent
            onSubmit={handleInvitations}
            isSubmitting={isSubmitting}
            defaultMessage={defaultMessage}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
