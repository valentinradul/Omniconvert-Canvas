
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UsersManagement from '@/components/super-admin/UsersManagement';
import OrphanedInvitationsManager from '@/components/super-admin/OrphanedInvitationsManager';
import { Users } from 'lucide-react';

const MembersPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members Management</h1>
          <p className="text-gray-600">Manage all users and their company memberships</p>
        </div>
      </div>

      {/* Orphaned Invitations Section */}
      <OrphanedInvitationsManager />

      <Card>
        <CardHeader>
          <CardTitle>Users & Members Management</CardTitle>
          <CardDescription>
            Manage all users and their company memberships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersPage;
