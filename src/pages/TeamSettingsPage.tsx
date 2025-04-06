
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import TeamMembersSection from '@/components/team/TeamMembersSection';
import DepartmentsSection from '@/components/team/DepartmentsSection';
import PersonalProjects from '@/components/projects/PersonalProjects';

const TeamSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('team');
  
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="team">Team Information</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team" className="mt-0">
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
          
          <div className="mt-6">
            <PersonalProjects />
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="mt-0">
          <TeamMembersSection />
        </TabsContent>
        
        <TabsContent value="departments" className="mt-0">
          <DepartmentsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamSettingsPage;
