
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface OnboardingInvitationSuccessProps {
  sentEmails: string[];
  onContinue: () => void;
}

const OnboardingInvitationSuccess: React.FC<OnboardingInvitationSuccessProps> = ({
  sentEmails,
  onContinue
}) => {
  return (
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
        onClick={onContinue}
      >
        Continue to Dashboard
      </Button>
    </div>
  );
};

export default OnboardingInvitationSuccess;
