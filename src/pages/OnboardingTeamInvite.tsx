import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { TeamInviteDialogContent } from '@/components/team/TeamInviteDialogContent';
import { useAuth } from '@/context/AuthContext';
import { fetchUserTeam, addTeamMemberToTeam } from '@/services/teamService';
import { TeamMemberFormData } from '@/types';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const OnboardingTeamInvite: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(true);

  const defaultMessage = `Hey, I've just started using ExperimentFlow and I think it would be great for our team to collaborate on growth experiments. Join me!`;

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
          const memberName = email.split('@')[0];
          const memberEmail = email;
          const memberData: TeamMemberFormData = {
            name: memberName,
            email: memberEmail,
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
      
      setSentEmails(successfulInvites);
      setShowInviteForm(false);
      
      if (successfulInvites.length > 0) {
        toast.success(`Successfully invited ${successfulInvites.length} team members`);
      }
    } catch (error) {
      console.error('Error inviting team members:', error);
      toast.error('Failed to invite team members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Invite your team</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Collaborate better by inviting your team members
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invite team members</CardTitle>
            <CardDescription>
              ExperimentFlow works best with your whole team. Send invitations to collaborate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showInviteForm && sentEmails.length > 0 ? (
              <div className="space-y-4">
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
                <Button 
                  variant="default" 
                  className="w-full" 
                  onClick={handleContinue}
                >
                  Continue to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <UserPlus className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                  <p>
                    Invite your team members to get the most out of ExperimentFlow.
                  </p>
                </div>
                <TeamInviteDialogContent
                  onSubmit={handleInvitations}
                  isSubmitting={isSubmitting}
                  defaultMessage={defaultMessage}
                  onCancel={handleSkip}
                />
              </>
            )}
          </CardContent>
          {showInviteForm && (
            <CardFooter className="justify-center">
              <Button variant="link" onClick={handleSkip}>
                Skip for now and explore on your own
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OnboardingTeamInvite;
