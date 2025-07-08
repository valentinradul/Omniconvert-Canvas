
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompaniesManagement from '@/components/super-admin/CompaniesManagement';
import UsersManagement from '@/components/super-admin/UsersManagement';
import DepartmentsManagement from '@/components/super-admin/DepartmentsManagement';
import { Shield, Building, Users, FolderTree } from 'lucide-react';

const SuperAdminSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-red-100 rounded-lg">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage all companies, users, and departments across the platform</p>
        </div>
      </div>

      <Tabs defaultValue="companies" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="companies" className="flex items-center gap-2 py-3">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Companies</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 py-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users & Members</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2 py-3">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-8">
          <CompaniesManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-8">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="departments" className="mt-8">
          <DepartmentsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminSettingsPage;
