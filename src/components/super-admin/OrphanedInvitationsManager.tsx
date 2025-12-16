import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrphanedInvitation {
  invitation_id: string;
  email: string;
  role: string;
  company_id: string;
  company_name: string;
  user_id: string;
  user_name: string | null;
  created_at: string;
}

const OrphanedInvitationsManager: React.FC = () => {
  const [orphanedInvitations, setOrphanedInvitations] = useState<OrphanedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrphanedInvitations();
  }, []);

  const fetchOrphanedInvitations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_orphaned_invitations');

      if (error) throw error;

      setOrphanedInvitations((data as OrphanedInvitation[]) || []);
    } catch (error: any) {
      console.error('Error fetching orphaned invitations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch orphaned invitations'
      });
    } finally {
      setLoading(false);
    }
  };

  const fixSingleInvitation = async (invitation: OrphanedInvitation) => {
    try {
      setFixingId(invitation.invitation_id);

      const { data, error } = await supabase.rpc('fix_orphaned_invitation', {
        invitation_id_param: invitation.invitation_id
      });

      if (error) throw error;

      const result = data as { status: string; message: string };

      toast({
        title: result.status === 'fixed' ? 'Fixed!' : 'Already a member',
        description: result.message
      });

      // Remove from list
      setOrphanedInvitations(prev => prev.filter(i => i.invitation_id !== invitation.invitation_id));
    } catch (error: any) {
      console.error('Error fixing invitation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fix invitation'
      });
    } finally {
      setFixingId(null);
    }
  };

  const fixAllInvitations = async () => {
    try {
      setFixing(true);
      
      let fixed = 0;
      let failed = 0;

      for (const invitation of orphanedInvitations) {
        try {
          const { error } = await supabase.rpc('fix_orphaned_invitation', {
            invitation_id_param: invitation.invitation_id
          });

          if (error) throw error;
          fixed++;
        } catch (err) {
          console.error('Failed to fix invitation:', invitation.invitation_id, err);
          failed++;
        }
      }

      toast({
        title: 'Bulk Fix Complete',
        description: `Fixed ${fixed} invitation(s)${failed > 0 ? `, ${failed} failed` : ''}`
      });

      fetchOrphanedInvitations();
    } catch (error: any) {
      console.error('Error in bulk fix:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete bulk fix'
      });
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Scanning for orphaned invitations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Orphaned Invitations
          {orphanedInvitations.length > 0 && (
            <Badge variant="destructive">{orphanedInvitations.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Invitations where the user has signed up but wasn't added to the company
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orphanedInvitations.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 py-4">
            <CheckCircle className="h-5 w-5" />
            <span>No orphaned invitations found. All invitations are properly processed.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={fetchOrphanedInvitations}
                variant="outline"
                size="sm"
                disabled={fixing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={fixAllInvitations}
                disabled={fixing || orphanedInvitations.length === 0}
              >
                {fixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Fix All ({orphanedInvitations.length})
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {orphanedInvitations.map((invitation) => (
                <div
                  key={invitation.invitation_id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-amber-50"
                >
                  <div>
                    <div className="font-medium">
                      {invitation.user_name || invitation.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invitation.email} → {invitation.company_name} • {invitation.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Invited: {new Date(invitation.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => fixSingleInvitation(invitation)}
                    disabled={fixingId === invitation.invitation_id || fixing}
                  >
                    {fixingId === invitation.invitation_id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Fix'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrphanedInvitationsManager;
