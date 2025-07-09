import React, { useState, useEffect } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReloadIcon } from '@radix-ui/react-icons';
import MemberPermissionsManager from '@/components/admin/MemberPermissionsManager';

const TeamSettingsPage: React.FC = () => {
  const {
    companies,
    currentCompany,
    userCompanyRole,
    companyMembers,
    switchCompany,
    inviteMember,
    removeMember,
    updateMemberRole,
    refreshCompanyMembers,
    refreshUserCompanies,
    isLoading
  } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitedEmail, setInvitedEmail] = useState('');
  const [invitedRole, setInvitedRole] = useState('member');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCompanySwitch = (companyId: string) => {
    switchCompany(companyId);
  };

  const handleInviteMember = async () => {
    try {
      await inviteMember(invitedEmail, invitedRole);
      setInvitedEmail('');
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${invitedEmail} as ${invitedRole}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send invitation',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(userId);
      toast({
        title: 'Member removed',
        description: 'Member removed from company',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove member',
      });
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    try {
      await updateMemberRole(userId, role);
      toast({
        title: 'Member role updated',
        description: 'Member role updated successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update member role',
      });
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshCompanyMembers(),
        refreshUserCompanies()
      ]);
      toast({
        title: 'Data Refreshed',
        description: 'Company members and user companies have been refreshed.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh data.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage your team members and company settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Switch Company</CardTitle>
          <CardDescription>
            Select the company you want to manage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Button variant="ghost" className="w-full" disabled>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Loading companies...
            </Button>
          ) : companies.length === 0 ? (
            <p className="text-muted-foreground">No companies found.</p>
          ) : (
            <Select value={currentCompany?.id} onValueChange={handleCompanySwitch}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {currentCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Members</CardTitle>
            <CardDescription>
              Invite, manage, and remove members from your company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={invitedEmail}
                  onChange={(e) => setInvitedEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={invitedRole} onValueChange={setInvitedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleInviteMember}>Invite Member</Button>

            <div className="divide-y divide-border rounded-md border">
              {isLoading ? (
                <div className="grid place-items-center p-4">
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Loading members...
                </div>
              ) : companyMembers.length === 0 ? (
                <div className="p-4 text-muted-foreground">No members found.</div>
              ) : (
                companyMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.profiles?.avatar_url || ''} />
                        <AvatarFallback>{member.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.profiles?.full_name || 'Unnamed User'}</p>
                        <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {userCompanyRole === 'owner' && member.user_id !== user?.id ? (
                        <Select value={member.role} onValueChange={(role) => handleUpdateMemberRole(member.user_id, role)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Label className="font-medium capitalize">{member.role}</Label>
                      )}
                      {userCompanyRole === 'owner' && member.user_id !== user?.id && (
                        <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.user_id)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add the new member permissions manager */}
      {(userCompanyRole === 'owner' || userCompanyRole === 'admin') && (
        <MemberPermissionsManager />
      )}

      <Button variant="secondary" onClick={refreshData} disabled={isLoading || isRefreshing}>
        {isRefreshing ? (
          <>
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          "Refresh Data"
        )}
      </Button>
    </div>
  );
};

export default TeamSettingsPage;
