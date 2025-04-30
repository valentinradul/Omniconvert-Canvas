
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface PendingInvitationsProps {
  onInvitationResent?: () => void;
  refreshTrigger?: any; // A value that when changed will trigger a refresh
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ 
  onInvitationResent,
  refreshTrigger 
}) => {
  const { currentCompany } = useCompany();
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchPendingInvitations = async () => {
    if (!currentCompany) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('id, email, role, created_at')
        .eq('company_id', currentCompany.id)
        .eq('accepted', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formatted = data.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        createdAt: inv.created_at
      }));
      
      setPendingInvitations(formatted);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      toast({
        variant: "destructive",
        title: "Failed to load invitations",
        description: "Could not retrieve pending invitations. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendInvitation = async (invitationId: string) => {
    try {
      // Get the invitation details
      const { data: invitation, error: invError } = await supabase
        .from('company_invitations')
        .select('email, company_id, role')
        .eq('id', invitationId)
        .single();
      
      if (invError || !invitation) throw invError || new Error('Invitation not found');
      
      // Get company name
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', invitation.company_id)
        .single();
      
      if (companyError || !company) throw companyError || new Error('Company not found');
      
      // Call edge function to resend email
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: invitation.email,
          companyName: company.name,
          inviterName: null, // We don't have the original inviter name
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
  
  // Fetch invitations on initial load and when company changes
  useEffect(() => {
    fetchPendingInvitations();
  }, [currentCompany, refreshTrigger]);
  
  if (pendingInvitations.length === 0 && !isLoading) {
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
          onClick={fetchPendingInvitations} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </div>
        ) : (
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
                      <span>Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation.id)}>
                  Resend
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingInvitations;
