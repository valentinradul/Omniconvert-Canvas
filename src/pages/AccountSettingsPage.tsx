
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import CompaniesManagement from '@/components/super-admin/CompaniesManagement';
import UsersManagement from '@/components/super-admin/UsersManagement';
import DepartmentsManagement from '@/components/super-admin/DepartmentsManagement';
import IdeasManagement from '@/components/super-admin/IdeasManagement';
import HypothesesManagement from '@/components/super-admin/HypothesesManagement';
import ExperimentsManagement from '@/components/super-admin/ExperimentsManagement';
import { Shield, Building, Users, FolderTree, Lightbulb, Brain, FlaskConical } from 'lucide-react';

const AccountSettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();
  
  const [fullName, setFullName] = React.useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = React.useState(user?.email || "");
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  // Check if user is using email/password authentication (not a third-party provider)
  const isEmailPasswordUser = user?.app_metadata?.provider === 'email';

  if (superAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="super-admin" className="text-red-600">
              <Shield className="h-4 w-4 mr-2" />
              Super Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fullName">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    To change your email address, please contact support.
                  </p>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
          
          {isEmailPasswordUser && (
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangePasswordDialog>
                  <Button variant="outline">Change Password</Button>
                </ChangePasswordDialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="super-admin" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Super Admin Panel</h2>
                <p className="text-gray-600">Manage system-wide settings and data</p>
              </div>
            </div>

            <Tabs defaultValue="companies" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="companies" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Companies</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Members</span>
                </TabsTrigger>
                <TabsTrigger value="departments" className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  <span className="hidden sm:inline">Departments</span>
                </TabsTrigger>
                <TabsTrigger value="ideas" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Ideas</span>
                </TabsTrigger>
                <TabsTrigger value="hypotheses" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Hypotheses</span>
                </TabsTrigger>
                <TabsTrigger value="experiments" className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  <span className="hidden sm:inline">Experiments</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies">
                <CompaniesManagement />
              </TabsContent>

              <TabsContent value="members">
                <UsersManagement />
              </TabsContent>

              <TabsContent value="departments">
                <DepartmentsManagement />
              </TabsContent>

              <TabsContent value="ideas">
                <IdeasManagement />
              </TabsContent>

              <TabsContent value="hypotheses">
                <HypothesesManagement />
              </TabsContent>

              <TabsContent value="experiments">
                <ExperimentsManagement />
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AccountSettingsPage;
