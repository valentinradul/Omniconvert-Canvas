
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentManagementSettings from '@/components/content/ContentManagementSettings';
import CategoryManagement from '@/components/categories/CategoryManagement';
import { Settings, FolderTree, Tags } from 'lucide-react';

const ContentManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-600 mt-1">Manage content settings, categories, and access controls</p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="settings" className="flex items-center gap-2 py-3">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Content Settings</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 py-3">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Content Access Settings
              </CardTitle>
              <CardDescription>
                Configure how content is accessed and managed across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentManagementSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Category Management
              </CardTitle>
              <CardDescription>
                Create and manage categories for organizing your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagementPage;
