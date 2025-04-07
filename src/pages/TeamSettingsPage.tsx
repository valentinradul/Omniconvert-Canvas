
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import TeamMembersSection from '@/components/team/TeamMembersSection';
import DepartmentsSection from '@/components/team/DepartmentsSection';
import PersonalProjects from '@/components/projects/PersonalProjects';
import { useCompanyContext } from '@/context/CompanyContext';
import { Building } from 'lucide-react';

const TeamSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeCompany, updateCompanyName, refreshCompanies, isAdmin } = useCompanyContext();
  
  useEffect(() => {
    // Refresh companies when component mounts to ensure we have the latest data
    refreshCompanies();
  }, [refreshCompanies]);
  
  useEffect(() => {
    if (activeCompany) {
      setCompanyName(activeCompany.name);
      console.log("TeamSettingsPage: Active company loaded:", activeCompany, "isAdmin:", isAdmin);
    } else {
      console.log("TeamSettingsPage: No active company available");
    }
  }, [activeCompany, isAdmin]);

  const handleCompanyNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      toast.error("No company selected");
      return;
    }
    
    if (!companyName.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Updating company name to:", companyName, "for company ID:", activeCompany.id, "isAdmin:", isAdmin);
      
      const result = await updateCompanyName(activeCompany.id, companyName);
      
      if (result) {
        toast.success("Company settings updated", {
          description: "Your company settings have been updated successfully.",
        });
      } else {
        toast.error("Failed to update company settings");
      }
    } catch (error) {
      console.error("Failed to update company:", error);
      toast.error("Failed to update company settings", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditCompanyInfo = isAdmin;
  const isSaveDisabled = !activeCompany || !companyName.trim() || isSubmitting || !canEditCompanyInfo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">
          Manage your company, team members, and department settings.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="company">Company Information</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company's basic information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanyNameChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="companyName">
                    Company Name {!canEditCompanyInfo && "(Only admins can edit)"}
                  </label>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <Building className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="Enter company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-8"
                        disabled={!canEditCompanyInfo}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSaveDisabled}
                  className={isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
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
