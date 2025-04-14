
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/CompanyContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, Mail, UserMinus, Shield } from 'lucide-react';
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CompanyRole } from '@/types';
import CompanySwitcher from '@/components/company/CompanySwitcher';
import CompanyInvitations from '@/components/company/CompanyInvitations';

const TeamSettingsPage = () => {
  const { toast } = useToast();
  const {
    currentCompany,
    userCompanyRole,
    companyMembers,
    updateMemberRole,
    removeMember,
  } = useCompany();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [memberToPromote, setMemberToPromote] = useState<{ userId: string; role: CompanyRole } | null>(null);

  const handleTeamNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Team settings updated",
      description: "Your team settings have been updated successfully.",
    });
  };

  // Function to get initials from user ID (in a real app, you'd have user profiles)
  const getUserInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  const canManageTeam = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage your team and team member settings.
        </p>
      </div>
      
      <CompanyInvitations />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Company</CardTitle>
              <CardDescription>
                Manage your company settings or switch between companies.
              </CardDescription>
            </div>
            <div>
              <CompanySwitcher />
            </div>
          </CardHeader>
          <CardContent>
            {currentCompany ? (
              <form onSubmit={handleTeamNameChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="teamName">
                    Company Name
                  </label>
                  <Input
                    id="teamName"
                    name="teamName"
                    placeholder="Company Name"
                    defaultValue={currentCompany.name}
                    disabled={!userCompanyRole || userCompanyRole !== 'owner'}
                  />
                </div>
                {userCompanyRole === 'owner' && (
                  <Button type="submit">Save Changes</Button>
                )}
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                You don't belong to any company yet. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>
        
        {currentCompany && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their roles.
                </CardDescription>
              </div>
              {canManageTeam && (
                <Button 
                  variant="outline"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {companyMembers.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Your team currently has {companyMembers.length} member{companyMembers.length !== 1 ? 's' : ''}.
                  </div>
                  <div className="space-y-2">
                    {companyMembers.map(member => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getUserInitials(member.userId)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{member.userId.substring(0, 8)}...</span>
                            <Badge variant="outline" className="capitalize">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        
                        {userCompanyRole === 'owner' && member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role === 'member' && (
                                <DropdownMenuItem onClick={() => setMemberToPromote({
                                  userId: member.userId,
                                  role: 'admin'
                                })}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              {member.role === 'admin' && (
                                <DropdownMenuItem onClick={() => setMemberToPromote({
                                  userId: member.userId,
                                  role: 'member'
                                })}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Remove Admin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setMemberToRemove(member.userId)}>
                                <UserMinus className="h-4 w-4 mr-2" />
                                <span className="text-destructive">Remove Member</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No team members yet. Invite someone to collaborate.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Invite Member Dialog */}
      <InviteMemberDialog 
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
      
      {/* Remove Member Alert Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose access to all company data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (memberToRemove) {
                  removeMember(memberToRemove);
                }
                setMemberToRemove(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Change Role Alert Dialog */}
      <AlertDialog open={!!memberToPromote} onOpenChange={() => setMemberToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToPromote?.role === 'admin' ? 'Promote to Admin' : 'Remove Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToPromote?.role === 'admin' 
                ? 'This will give the user admin privileges to manage team members and company settings.'
                : 'This will remove admin privileges from this user.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (memberToPromote) {
                  updateMemberRole(memberToPromote.userId, memberToPromote.role);
                }
                setMemberToPromote(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamSettingsPage;
