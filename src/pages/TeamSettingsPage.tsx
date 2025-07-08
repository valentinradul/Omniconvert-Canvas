import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Settings, Eye } from 'lucide-react';
import { useCompany } from '@/context/company/CompanyContext';
import { useCompanyManagement } from '@/context/company/useCompanyManagement';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import PendingInvitations from '@/components/company/PendingInvitations';
import ContentVisibilitySettings from '@/components/settings/ContentVisibilitySettings';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';
import { CompanyRole } from '@/types';

const TeamSettingsPage: React.FC = () => {
  const { 
    currentCompany, 
    companyMembers, 
    pendingInvitations, 
    userCompanyRole, 
    isLoading, 
    user,
    refetchMembers,
    refetchInvitations 
  } = useCompany();
  
  const { removeMember, updateMemberRole, unsendInvitation } = useCompanyManagement();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const canManageTeam = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentCompany) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">No Company Selected</h2>
        <p className="text-muted-foreground">Please select a company to manage team settings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Settings</h1>
        <p className="text-gray-600">Manage your team members, invitations, and content visibility</p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Content Visibility
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage members of {currentCompany.name}
                  </CardDescription>
                </div>
                {canManageTeam && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyMembers.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src={member.profile?.avatar_url || ""} />
                            <AvatarFallback>{member.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span>{member.profile?.full_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.profile?.email || "N/A"}</TableCell>
                      <TableCell>
                        {userCompanyRole === 'owner' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-auto">
                                <span className="font-normal">{member.role}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Update Role</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateMemberRole(member.userId, 'member', currentCompany.id, userCompanyRole).then(() => refetchMembers())}>
                                Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMemberRole(member.userId, 'admin', currentCompany.id, userCompanyRole).then(() => refetchMembers())}>
                                Admin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="secondary">{member.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageTeam && user?.id !== member.userId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => removeMember(member.userId, currentCompany.id, userCompanyRole, companyMembers).then(() => refetchMembers())}>
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage pending invitations for {currentCompany.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingInvitations
                invitations={pendingInvitations}
                onUnsendInvitation={unsendInvitation}
                onInvitationChange={() => {
                  refetchInvitations();
                  refetchMembers();
                }}
                canManage={canManageTeam}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          {canManageTeam ? (
            <ContentVisibilitySettings />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Content Visibility Settings</CardTitle>
                <CardDescription>
                  Only company owners and admins can manage content visibility settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You don't have permission to modify these settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteSent={() => {
          refetchInvitations();
          refetchMembers();
        }}
      />
    </div>
  );
};

export default TeamSettingsPage;
