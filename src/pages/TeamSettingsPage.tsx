import React, { useState } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { CompanyRole, CompanyMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { MoreVertical, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onUpdateRole(member.userId, 'member')}
                        disabled={member.role === 'member' || userRole !== 'owner'}
                      >
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUpdateRole(member.userId, 'admin')}
                        disabled={member.role === 'admin' || userRole !== 'owner'}
                      >
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem disabled={userRole !== 'owner' || member.role === 'owner'}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove the member from the company.
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
                    </DropdownMenuContent>
                  </DropdownMenu>
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
  const { companyMembers, userCompanyRole, inviteMember, removeMember, updateMemberRole } = useCompany();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyRole>('member');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    try {
      await inviteMember(email, role);
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email} as ${role}`,
      });
      setEmail('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error.message || "There was an error sending the invitation",
      });
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeMember(userId);
      toast({
        title: "Member removed",
        description: "Member removed from the company",
      });
    } catch (error: any) {
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
      toast({
        variant: "destructive",
        title: "Failed to update member role",
        description: error.message || "There was an error updating the member role",
      });
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <CompanySwitcher />
      </div>

      <div className="grid gap-6 mt-8">
        {/* Add the PendingInvitations component here */}
        <PendingInvitations />
        
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
