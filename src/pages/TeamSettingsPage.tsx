
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TeamMembersSection from '@/components/team/TeamMembersSection';
import DepartmentsSection from '@/components/team/DepartmentsSection';

const TeamSettingsPage = () => {
  const handleTeamNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Team settings updated", {
      description: "Your team settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage your team, team members, and department settings.
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
        
        <TeamMembersSection />
        
        <DepartmentsSection />
      </div>
    </div>
  );
};

export default TeamSettingsPage;
