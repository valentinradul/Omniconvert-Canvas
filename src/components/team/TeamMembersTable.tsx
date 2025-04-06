
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamMembersTableProps {
  members: TeamMember[];
  isLoading: boolean;
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ members, isLoading }) => {
  if (isLoading) {
    return <p className="text-center py-4">Loading team members...</p>;
  }

  if (members.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No team members yet.</p>;
  }

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left py-3 px-4">Name</th>
            <th className="text-left py-3 px-4">Email</th>
            <th className="text-left py-3 px-4">Role</th>
            <th className="text-right py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b last:border-b-0">
              <td className="py-3 px-4">{member.name}</td>
              <td className="py-3 px-4">{member.email}</td>
              <td className="py-3 px-4">{member.role}</td>
              <td className="py-3 px-4 text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    toast.success(`Email invitation sent to ${member.email}`);
                  }}
                >
                  Resend Invite
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
