
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CompaniesManagement from '@/components/super-admin/CompaniesManagement';
import { Building } from 'lucide-react';

const CompaniesPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies Management</h1>
          <p className="text-gray-600">Manage all companies across the platform</p>
        </div>
      </div>

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
    </div>
  );
};

export default CompaniesPage;
