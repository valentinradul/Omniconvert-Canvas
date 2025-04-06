
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeamInvitations } from '@/hooks/useTeamInvitations';
import OnboardingInviteForm from '@/components/onboarding/OnboardingInviteForm';
import OnboardingInvitationSuccess from '@/components/onboarding/OnboardingInvitationSuccess';

const OnboardingTeamInvite: React.FC = () => {
  const navigate = useNavigate();
  const { handleInvitations, isSubmitting, sentEmails } = useTeamInvitations();
  const [showInviteForm, setShowInviteForm] = useState(true);

  const defaultMessage = `Hey, I've just started using ExperimentFlow and I think it would be great for our team to collaborate on growth experiments. Join me!`;

  const onInvitationsSubmit = async (emails: string[], message: string) => {
    try {
      const result = await handleInvitations(emails, message);
      if (result && result.success) {
        setShowInviteForm(false);
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
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
              <OnboardingInvitationSuccess 
                sentEmails={sentEmails} 
                onContinue={handleContinue}
              />
            ) : (
              <OnboardingInviteForm
                onInvitations={onInvitationsSubmit}
                isSubmitting={isSubmitting}
                defaultMessage={defaultMessage}
                onSkip={handleSkip}
              />
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
