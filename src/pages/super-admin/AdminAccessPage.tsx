
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminAccessManagement from '@/components/super-admin/AdminAccessManagement';
import { Shield } from 'lucide-react';

const AdminAccessPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Access Management</h1>
          <p className="text-gray-600">Control admin access to ideas and experiments across all companies</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Access Control</CardTitle>
          <CardDescription>
            Manage what admins can access regarding ideas and experiments within their companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAccessManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccessPage;
