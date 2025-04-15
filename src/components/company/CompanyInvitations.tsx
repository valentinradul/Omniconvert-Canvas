
import React from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const CompanyInvitations: React.FC = () => {
  const { companyInvitations, acceptInvitation, declineInvitation, isLoading } = useCompany();

  if (companyInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8 font-fira">
      <h2 className="text-xl font-semibold">Company Invitations</h2>
      <div className="grid gap-4">
        {companyInvitations.map(invitation => (
          <Card key={invitation.id}>
            <CardHeader>
              <CardTitle className="text-lg">Join Company</CardTitle>
              <CardDescription>
                You've been invited to join a company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium">{invitation.email}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant="secondary" className="capitalize">
                    {invitation.role}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
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
                Accept
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyInvitations;
