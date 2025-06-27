
import React, { useState, useEffect } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyRole, CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import CompanySwitcher from '@/components/company/CompanySwitcher';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import InviteMemberDialog from '@/components/company/InviteMemberDialog';
import PendingInvitations from '@/components/company/PendingInvitations';

interface MembersTableProps {
  members: CompanyMember[];
  userRole: CompanyRole | null;
  onRemove: (userId: string) => void;
  onUpdateRole: (userId: string, role: CompanyRole) => void;
}

const MembersTable = ({ members, userRole, onRemove, onUpdateRole }: MembersTableProps) => {
  // Helper function to get user display name
  const getUserDisplayName = (member: CompanyMember) => {
    // If profile exists and has fullName, use it
    if (member.profile?.fullName) {
      return member.profile.fullName;
    }
    // Fallback to email or userId if available
    return 'User';
  };

  // Helper function to get initials for avatar
  const getUserInitials = (member: CompanyMember) => {
    if (member.profile?.fullName) {
      const names = member.profile.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return member.profile.fullName.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                No members yet
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={member.profile?.avatarUrl || ''} alt="Avatar" />
                      <AvatarFallback>
                        {getUserInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getUserDisplayName(member)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    member.role === 'owner' ? 'default' : 
                    member.role === 'admin' ? 'outline' : 
                    'secondary'
                  }>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(userRole === 'owner' || userRole === 'admin') && member.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove {getUserDisplayName(member)} from the company.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemove(member.userId)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {userRole === 'owner' && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => onUpdateRole(member.userId, 'member')}
                            disabled={member.role === 'member'}
                          >
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdateRole(member.userId, 'admin')}
                            disabled={member.role === 'admin'}
                          >
                            Make Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const TeamSettingsPage: React.FC = () => {
  const { companyMembers, userCompanyRole, removeMember, updateMemberRole, refreshPendingInvitations } = useCompany();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();

  // Auto-refresh data every 10 seconds to catch new member acceptances
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPendingInvitations();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshPendingInvitations]);

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

      <div className="grid gap-6 mt-8">
        {/* PendingInvitations with automatic refresh */}
        <PendingInvitations onInvitationResent={refreshPendingInvitations} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Invite New Member</h2>
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={() => setShowInviteDialog(true)} 
                disabled={userCompanyRole !== 'owner' && userCompanyRole !== 'admin'}
              >
                Invite Team Member
              </Button>
              
              <InviteMemberDialog 
                open={showInviteDialog} 
                onClose={() => setShowInviteDialog(false)}
                onInviteSent={handleInvitationSent}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Current Members</h2>
            <MembersTable 
              members={companyMembers} 
              userRole={userCompanyRole}
              onRemove={handleRemove}
              onUpdateRole={handleUpdateRole}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSettingsPage;
