
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const TeamSettingsPage = () => {
  const { toast } = useToast();

  const handleTeamNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Team settings updated",
      description: "Your team settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage your team and team member settings.
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Update your team's basic information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTeamNameChange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="teamName">
                  Team Name
                </label>
                <Input
                  id="teamName"
                  name="teamName"
                  placeholder="Growth Team"
                  defaultValue="Growth Team"
                />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and their roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your team currently has 3 members.
            </p>
            <Button variant="outline">Invite Team Member</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamSettingsPage;
