
import React, { useState } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyRole, CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import CompanySwitcher from '@/components/company/CompanySwitcher';
import { useToast } from '@/hooks/use-toast';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import PendingInvitations from '@/components/company/PendingInvitations';
import EditMemberDialog from '@/components/company/EditMemberDialog';

const TeamSettingsPage: React.FC = () => {
  const { companyMembers, userCompanyRole, refreshPendingInvitations, refreshCompanyMembers } = useCompany();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null);
  const { toast } = useToast();

  console.log('TeamSettingsPage - Company members:', companyMembers.length);
  console.log('TeamSettingsPage - User role:', userCompanyRole);

  const handleEditMember = (member: CompanyMember) => {
    console.log('Editing member:', member.id);
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
    refreshPendingInvitations();
  };

  // Function to handle manual refresh
  const handleManualRefresh = () => {
    refreshPendingInvitations();
    refreshCompanyMembers();
    toast({
      title: "Refreshed",
      description: "Team data has been refreshed"
    });
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleManualRefresh}>
            Refresh Data
          </Button>
          <CompanySwitcher />
        </div>
      </div>

      <div className="space-y-6 mt-8">
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
