
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface PendingInvitationsProps {
  onInvitationResent?: () => void;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ onInvitationResent }) => {
  const { currentCompany, pendingInvitations, refreshPendingInvitations } = useCompany();
  const { toast } = useToast();

  const resendInvitation = async (invitationId: string) => {
    try {
      // Get the invitation details
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');
      
      // Get company name
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', invitation.companyId)
        .single();
      
      if (companyError || !company) throw companyError || new Error('Company not found');
      
      // Call edge function to resend email
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: invitation.email,
          companyName: company.name,
          inviterName: null,
          role: invitation.role,
          invitationId: invitationId
        }
      });

      if (error) throw error;
      
      toast({
        title: "Invitation resent",
        description: `Invitation email resent to ${invitation.email}`
      });
      
      if (onInvitationResent) {
        onInvitationResent();
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to resend invitation",
        description: error.message || "An unexpected error occurred"
      });
    }
  };
  
  // Don't show the component if there are no pending invitations
  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>People who have been invited but haven't accepted yet</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPendingInvitations}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingInvitations.map(invitation => (
            <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{invitation.email}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Badge variant="outline" className="mr-2 capitalize">{invitation.role}</Badge>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Invited {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation.id)}>
                Resend
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingInvitations;
