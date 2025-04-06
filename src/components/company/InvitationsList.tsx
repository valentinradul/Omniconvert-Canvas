
import React from 'react';
import { CompanyInvitation } from '@/services/company/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyInvitations } from '@/hooks/useCompanyInvitations';
import { Check, X } from 'lucide-react';

export const InvitationsList: React.FC = () => {
  const { userInvitations, isLoading, acceptInvitation, rejectInvitation } = useCompanyInvitations();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Invitations</CardTitle>
          <CardDescription>Company invitations are loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-md" />
            <Skeleton className="h-16 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userInvitations.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Pending Invitations</CardTitle>
        <CardDescription>Invitations to join companies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userInvitations.map(invitation => (
            <div 
              key={invitation.id} 
              className="flex items-center justify-between p-4 border rounded-md bg-muted/20"
            >
              <div>
                <p className="font-medium">You've been invited to join a company</p>
                <p className="text-sm text-muted-foreground">As: {invitation.role}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex gap-1 items-center"
                  onClick={() => rejectInvitation(invitation.id)}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="flex gap-1 items-center"
                  onClick={() => acceptInvitation(invitation.id)}
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
