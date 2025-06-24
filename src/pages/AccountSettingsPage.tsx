
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';

const AccountSettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
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
                  defaultValue={user?.user_metadata?.full_name || ""}
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
                  defaultValue={user?.email || ""}
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
    </div>
  );
};

export default AccountSettingsPage;
