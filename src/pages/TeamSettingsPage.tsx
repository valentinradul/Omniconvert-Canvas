import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, Eye } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import PendingInvitations from '@/components/company/PendingInvitations';
import EditMemberDialog from '@/components/company/EditMemberDialog';
import ContentVisibilitySettings from '@/components/company/ContentVisibilitySettings';

const TeamSettingsPage: React.FC = () => {
  const { currentCompany, members, userRole } = useCompany();

  const canManageTeam = userRole === 'owner' || userRole === 'admin';

  if (!currentCompany) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Settings</h1>
          <p className="text-gray-600">Please select a company to manage team settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Settings</h1>
          <p className="text-gray-600 mt-1">Manage your team members and permissions for {currentCompany.name}</p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="members" className="flex items-center gap-2 py-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team Members</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2 py-3">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2 py-3">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Content Visibility</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Team Members</h2>
              {canManageTeam && <InviteMemberDialog />}
            </div>
            {canManageTeam ? (
              members.length === 0 ? (
                <p className="text-muted-foreground">No members in this company yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="p-4 border rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{member.user_id}</p>
                          <p className="text-sm text-muted-foreground">Role: {member.role}</p>
                        </div>
                        <EditMemberDialog member={member} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-muted-foreground">You don't have permission to manage team members.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Pending Invitations</h2>
            {canManageTeam ? (
              <PendingInvitations />
            ) : (
              <p className="text-muted-foreground">You don't have permission to manage pending invitations.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-8">
          {canManageTeam ? (
            <ContentVisibilitySettings />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You don't have permission to manage content visibility settings.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamSettingsPage;
