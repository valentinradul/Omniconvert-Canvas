
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import ContentManagementSettings from '@/components/content/ContentManagementSettings';

const ContentManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage department-based access for growth ideas and experiments</p>
        </div>
      </div>

      <ContentManagementSettings />
    </div>
  );
};

export default ContentManagementPage;
