
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
  const { isOperatingAsSuperAdmin, operatingMode } = useSuperAdmin();
  
  const [fullName, setFullName] = React.useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [renderKey, setRenderKey] = React.useState(0);

  // Force re-render when super admin mode changes
  React.useEffect(() => {
    console.log('Mode changed to:', operatingMode, 'isOperatingAsSuperAdmin:', isOperatingAsSuperAdmin);
    setRenderKey(prev => prev + 1);
  }, [operatingMode, isOperatingAsSuperAdmin]);
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  // Check if user is using email/password authentication (not a third-party provider)
  const isEmailPasswordUser = user?.app_metadata?.provider === 'email';

  return (
    <div key={renderKey} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {isOperatingAsSuperAdmin ? (
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="super-admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Super Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6">
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
            </div>
          </TabsContent>

          <TabsContent value="super-admin" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Super Admin Panel</h2>
                  <p className="text-gray-600">Manage all companies, users, and departments across the platform</p>
                </div>
              </div>

              <Tabs defaultValue="companies" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
                  <TabsTrigger value="companies" className="flex items-center gap-2 py-3">
                    <Building className="h-4 w-4" />
                    <span className="hidden sm:inline">Companies</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2 py-3">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="departments" className="flex items-center gap-2 py-3">
                    <FolderTree className="h-4 w-4" />
                    <span className="hidden sm:inline">Departments</span>
                  </TabsTrigger>
                  <TabsTrigger value="ideas" className="flex items-center gap-2 py-3">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Ideas</span>
                  </TabsTrigger>
                  <TabsTrigger value="hypotheses" className="flex items-center gap-2 py-3">
                    <Brain className="h-4 w-4" />
                    <span className="hidden sm:inline">Hypotheses</span>
                  </TabsTrigger>
                  <TabsTrigger value="experiments" className="flex items-center gap-2 py-3">
                    <FlaskConical className="h-4 w-4" />
                    <span className="hidden sm:inline">Experiments</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="companies">
                  <CompaniesManagement />
                </TabsContent>

                <TabsContent value="users">
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
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-6">
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
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;
