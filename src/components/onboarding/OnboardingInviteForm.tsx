
import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamInviteDialogContent } from '@/components/team/TeamInviteDialogContent';

interface OnboardingInviteFormProps {
  onInvitations: (emails: string[], message: string) => Promise<void>;
  isSubmitting: boolean;
  defaultMessage: string;
  onSkip: () => void;
}

const OnboardingInviteForm: React.FC<OnboardingInviteFormProps> = ({
  onInvitations,
  isSubmitting,
  defaultMessage,
  onSkip
}) => {
  return (
    <>
      <div className="text-center mb-6">
        <UserPlus className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <p>
          Invite your team members to get the most out of ExperimentFlow.
        </p>
      </div>
      <TeamInviteDialogContent
        onSubmit={onInvitations}
        isSubmitting={isSubmitting}
        defaultMessage={defaultMessage}
        onCancel={onSkip}
      />
    </>
  );
};

export default OnboardingInviteForm;
