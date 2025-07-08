
import React from 'react';
import DepartmentsManagement from '@/components/super-admin/DepartmentsManagement';
import { FolderTree } from 'lucide-react';

const DepartmentsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-red-100 rounded-lg">
          <FolderTree className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments Management</h1>
          <p className="text-gray-600 mt-1">Manage departments across all companies</p>
        </div>
      </div>

      <DepartmentsManagement />
    </div>
  );
};

export default DepartmentsPage;
