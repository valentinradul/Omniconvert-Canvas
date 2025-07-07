
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DepartmentsManagement from '@/components/super-admin/DepartmentsManagement';
import { FolderTree } from 'lucide-react';

const DepartmentsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FolderTree className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments Management</h1>
          <p className="text-gray-600">Manage departments across all companies</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departments Management</CardTitle>
          <CardDescription>
            Manage departments across all companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentsManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentsPage;
