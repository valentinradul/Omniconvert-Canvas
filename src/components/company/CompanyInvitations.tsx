
import React from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const CompanyInvitations: React.FC = () => {
  const { companyInvitations, acceptInvitation, declineInvitation, isLoading } = useCompany();

  if (companyInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Team Invitations</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        You've been invited to join the following teams. Accept to start collaborating!
      </p>
      <div className="grid gap-4">
        {companyInvitations.map(invitation => (
          <Card key={invitation.id} className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Team Invitation
              </CardTitle>
              <CardDescription>
                You've been invited to join a team as a {invitation.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{invitation.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant="secondary" className="capitalize">
                    {invitation.role}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => declineInvitation(invitation.id)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => acceptInvitation(invitation.id)}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept & Join Team
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyInvitations;
