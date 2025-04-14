
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Trash } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@/types';

interface TeamMembersTableProps {
  members: TeamMember[];
  isLoading: boolean;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ 
  members, 
  isLoading,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return <p className="text-center py-4">Loading team members...</p>;
  }

  if (members.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No team members yet.</p>;
  }

  const getRoleBadgeVariant = (role: string) => {
    switch(role) {
      case 'Admin': return 'destructive';
      case 'Manager': return 'default';
      case 'Team Member': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Access</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <Avatar className="h-8 w-8">
                  {member.photoUrl ? (
                    <AvatarImage src={member.photoUrl} alt={member.name} />
                  ) : (
                    <AvatarFallback>
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.title || 'Not specified'}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell>{member.department || 'Not assigned'}</TableCell>
              <TableCell>
                {member.departmentVisibility || 'Own Department'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast.success(`Email invitation sent to ${member.email}`);
                    }}
                  >
                    Resend Invite
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {member.name} from your team.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(member.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
