
import React, { useState, useEffect } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyRole, CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import CompanySwitcher from '@/components/company/CompanySwitcher';
import { useToast } from '@/hooks/use-toast';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import PendingInvitations from '@/components/company/PendingInvitations';
import EditMemberDialog from '@/components/company/EditMemberDialog';

const TeamSettingsPage: React.FC = () => {
  const { 
    companyMembers, 
    userCompanyRole, 
    currentCompany,
    pendingInvitations,
    refreshPendingInvitations, 
    refreshCompanyMembers 
  } = useCompany();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null);
  const { toast } = useToast();

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('🏢 === TEAM SETTINGS PAGE STATE ===');
    console.log('Current company:', currentCompany?.name, currentCompany?.id);
    console.log('Company members count:', companyMembers.length);
    console.log('Pending invitations count:', pendingInvitations.length);
    console.log('User role:', userCompanyRole);
    console.log('Pending invitations data:', pendingInvitations);
    console.log('================================');
  }, [currentCompany, companyMembers, pendingInvitations, userCompanyRole]);

  // Force refresh when component mounts or company changes
  useEffect(() => {
    if (currentCompany?.id) {
      console.log('🔄 Team Settings: Refreshing data for company:', currentCompany.name);
      
      // Add a small delay to ensure company context is fully set
      setTimeout(() => {
        refreshPendingInvitations();
        refreshCompanyMembers();
      }, 300);
    }
  }, [currentCompany?.id]);

  // Additional effect to monitor pending invitations changes
  useEffect(() => {
    console.log('📊 PENDING INVITATIONS CHANGED:', {
      count: pendingInvitations.length,
      invitations: pendingInvitations,
      companyId: currentCompany?.id,
      companyName: currentCompany?.name
    });
  }, [pendingInvitations]);

  const handleEditMember = (member: CompanyMember) => {
    console.log('✏️ Editing member:', member.id);
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedMember(null);
  };

  const handleMemberUpdated = () => {
    refreshCompanyMembers();
    refreshPendingInvitations();
  };

  // Function to handle invitation sent and refresh pending invitations
  const handleInvitationSent = () => {
    console.log('📧 Invitation sent, refreshing pending invitations');
    setTimeout(() => {
      refreshPendingInvitations();
    }, 500);
  };

  // Function to handle manual refresh
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refreshPendingInvitations();
    refreshCompanyMembers();
    toast({
      title: "Refreshed",
      description: "Team data has been refreshed"
    });
  };

  // Force fetch pending invitations
  const handleForceFetch = () => {
    console.log('💪 FORCE FETCH pending invitations');
    if (currentCompany?.id) {
      refreshPendingInvitations();
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
          {currentCompany && (
            <p className="text-sm text-muted-foreground mt-1">
              Company: {currentCompany.name} (ID: {currentCompany.id})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleManualRefresh}>
            Refresh Data
          </Button>
          <Button variant="outline" onClick={handleForceFetch}>
            Force Fetch Invitations
          </Button>
          <CompanySwitcher />
        </div>
      </div>

      <div className="space-y-6 mt-8">
        {/* Enhanced Debug information */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm">
          <h4 className="font-medium mb-2 text-yellow-800">🐛 Debug Info:</h4>
          <div className="space-y-1 text-yellow-700">
            <p><strong>Current Company:</strong> {currentCompany?.name || 'None'}</p>
            <p><strong>Company ID:</strong> {currentCompany?.id || 'None'}</p>
            <p><strong>Members:</strong> {companyMembers.length}</p>
            <p><strong>Pending Invitations:</strong> {pendingInvitations.length}</p>
            <p><strong>User Role:</strong> {userCompanyRole || 'None'}</p>
            <p><strong>Pending Invitations Data:</strong></p>
            <pre className="text-xs bg-yellow-100 p-2 rounded mt-1 overflow-auto max-h-32">
              {JSON.stringify(pendingInvitations, null, 2)}
            </pre>
          </div>
        </div>

        {/* PendingInvitations with manual refresh and edit functionality */}
        <PendingInvitations 
          onInvitationResent={refreshPendingInvitations} 
          onEditMember={handleEditMember}
        />
        
        {/* Invite New Member Section - Centered and Compact */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium">Invite New Member</h3>
              <Button 
                onClick={() => setShowInviteDialog(true)} 
                disabled={userCompanyRole !== 'owner' && userCompanyRole !== 'admin'}
                className="w-full"
              >
                Invite Team Member
              </Button>
              {(userCompanyRole !== 'owner' && userCompanyRole !== 'admin') && (
                <p className="text-sm text-muted-foreground">
                  Only owners and admins can invite members
                </p>
              )}
            </div>
          </div>
        </div>
        
        <InviteMemberDialog 
          open={showInviteDialog} 
          onClose={() => setShowInviteDialog(false)}
          onInviteSent={handleInvitationSent}
        />

        <EditMemberDialog
          member={selectedMember}
          open={showEditDialog}
          onClose={handleCloseEditDialog}
          onMemberUpdated={handleMemberUpdated}
        />
      </div>
    </div>
  );
};

export default TeamSettingsPage;
