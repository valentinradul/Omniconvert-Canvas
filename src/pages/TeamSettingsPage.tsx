
import React, { useState } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyRole, CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import CompanySwitcher from '@/components/company/CompanySwitcher';
import { useToast } from '@/hooks/use-toast';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import PendingInvitations from '@/components/company/PendingInvitations';

const TeamSettingsPage: React.FC = () => {
  const { companyMembers, userCompanyRole, removeMember, updateMemberRole, refreshPendingInvitations } = useCompany();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();

  const handleRemove = async (userId: string) => {
    try {
      await removeMember(userId);
      toast({
        title: "Member removed",
        description: "Member removed from the company successfully",
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.message || "There was an error removing the member",
      });
    }
  };

  const handleUpdateRole = async (userId: string, role: CompanyRole) => {
    try {
      await updateMemberRole(userId, role);
      toast({
        title: "Member role updated",
        description: "Member role updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        variant: "destructive",
        title: "Failed to update member role",
        description: error.message || "There was an error updating the member role",
      });
    }
  };

  const handleEditMember = (member: CompanyMember) => {
    // TODO: Implement edit member functionality
    toast({
      title: "Edit Member",
      description: `Edit functionality for ${member.profile?.fullName || 'User'} will be implemented soon`,
    });
  };

  // Function to handle invitation sent and refresh pending invitations
  const handleInvitationSent = () => {
    refreshPendingInvitations();
  };

  // Function to handle manual refresh
  const handleManualRefresh = () => {
    refreshPendingInvitations();
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
            </div>
          </div>
        </div>
        
        <InviteMemberDialog 
          open={showInviteDialog} 
          onClose={() => setShowInviteDialog(false)}
          onInviteSent={handleInvitationSent}
        />
      </div>
    </div>
  );
};

export default TeamSettingsPage;
