
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Building } from 'lucide-react';

interface CompanyWithSettings {
  id: string;
  name: string;
  restrict_content_to_departments: boolean;
  settings_id?: string;
}

const ContentSettingsManagement: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompaniesWithSettings();
  }, []);

  const fetchCompaniesWithSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          company_content_settings (
            id,
            restrict_content_to_departments
          )
        `);

      if (error) throw error;

      const companiesWithSettings = data.map(company => ({
        id: company.id,
        name: company.name,
        restrict_content_to_departments: company.company_content_settings?.[0]?.restrict_content_to_departments ?? false,
        settings_id: company.company_content_settings?.[0]?.id
      }));

      setCompanies(companiesWithSettings);
    } catch (error: any) {
      console.error('Error fetching companies with settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch company content settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCompanySettings = async (companyId: string, restrictToDepartments: boolean) => {
    try {
      const company = companies.find(c => c.id === companyId);
      
      if (company?.settings_id) {
        // Update existing settings
        const { error } = await supabase
          .from('company_content_settings')
          .update({ restrict_content_to_departments: restrictToDepartments })
          .eq('id', company.settings_id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: companyId,
            restrict_content_to_departments: restrictToDepartments
          });

        if (error) throw error;
      }

      // Update local state
      setCompanies(companies.map(c => 
        c.id === companyId 
          ? { ...c, restrict_content_to_departments: restrictToDepartments }
          : c
      ));

      toast({
        title: 'Success',
        description: `Content settings updated for ${company?.name}`
      });
    } catch (error: any) {
      console.error('Error updating company settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update content settings'
      });
    }
  };

  if (loading) {
    return <div>Loading content settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Eye className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Content Visibility Management</h2>
          <p className="text-gray-600">Manage content visibility settings for all companies</p>
        </div>
      </div>

      <div className="grid gap-4">
        {companies.map(company => (
          <Card key={company.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`restrict-${company.id}`}
                  checked={company.restrict_content_to_departments}
                  onCheckedChange={(checked) => updateCompanySettings(company.id, checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor={`restrict-${company.id}`} className="text-sm font-medium">
                    Restrict content to departments
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {company.restrict_content_to_departments 
                      ? "Members can only see content from their assigned departments"
                      : "Members can see all content across all departments"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentSettingsManagement;
