
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CompaniesManagement from '@/components/super-admin/CompaniesManagement';
import UsersManagement from '@/components/super-admin/UsersManagement';
import DepartmentsManagement from '@/components/super-admin/DepartmentsManagement';
import ContentSettingsManagement from '@/components/super-admin/ContentSettingsManagement';
import { Shield, Building, Users, FolderTree, Eye } from 'lucide-react';

const SuperAdminSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Settings</h1>
          <p className="text-gray-600">Manage all companies, users, departments, and content settings across the platform</p>
        </div>
      </div>

      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users & Members
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Content Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Companies Management</CardTitle>
              <CardDescription>
                Add, edit, or remove companies across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompaniesManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
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
        </TabsContent>

        <TabsContent value="departments">
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
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Settings Management</CardTitle>
              <CardDescription>
                Manage content visibility settings for all companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentSettingsManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminSettingsPage;
