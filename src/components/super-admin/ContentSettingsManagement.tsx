
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import SuperAdminTable from './SuperAdminTable';

interface CompanyWithSettings {
  id: string;
  name: string;
  created_at: string;
  restrict_content_to_departments: boolean;
  settings_id?: string;
}

const ContentSettingsManagement: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyWithSettings[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchCompaniesWithSettings();
  }, []);

  useEffect(() => {
    // Filter and sort companies
    let filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort companies
    filtered.sort((a, b) => {
      const aValue = a[sortKey as keyof CompanyWithSettings];
      const bValue = b[sortKey as keyof CompanyWithSettings];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [companies, searchTerm, sortKey, sortDirection]);

  const fetchCompaniesWithSettings = async () => {
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;

      const { data: settingsData, error: settingsError } = await supabase
        .from('company_content_settings')
        .select('*');

      if (settingsError) throw settingsError;

      const companiesWithSettings = companiesData?.map(company => {
        const settings = settingsData?.find(s => s.company_id === company.id);
        return {
          ...company,
          restrict_content_to_departments: settings?.restrict_content_to_departments || false,
          settings_id: settings?.id
        };
      }) || [];

      setCompanies(companiesWithSettings);
    } catch (error: any) {
      console.error('Error fetching companies with settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch content settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCompanySettings = async (companyId: string, restrictContent: boolean) => {
    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      if (company.settings_id) {
        // Update existing settings
        const { error } = await supabase
          .from('company_content_settings')
          .update({ restrict_content_to_departments: restrictContent })
          .eq('id', company.settings_id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: companyId,
            restrict_content_to_departments: restrictContent
          });

        if (error) throw error;
      }

      // Update local state
      setCompanies(companies.map(c => 
        c.id === companyId 
          ? { ...c, restrict_content_to_departments: restrictContent }
          : c
      ));

      toast({
        title: 'Settings updated',
        description: `Content visibility updated for ${company.name}`
      });
    } catch (error: any) {
      console.error('Error updating content settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update content settings'
      });
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (company: CompanyWithSettings) => (
        <div className="font-medium">{company.name}</div>
      )
    },
    {
      key: 'restrict_content_to_departments',
      header: 'Content Visibility',
      sortable: true,
      render: (company: CompanyWithSettings) => (
        <Badge variant={company.restrict_content_to_departments ? "destructive" : "default"} className="flex items-center gap-1 w-fit">
          {company.restrict_content_to_departments ? (
            <>
              <EyeOff className="h-3 w-3" />
              Department Only
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              All Content
            </>
          )}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (company: CompanyWithSettings) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={company.restrict_content_to_departments}
            onCheckedChange={(checked) => updateCompanySettings(company.id, checked)}
            disabled={loading}
          />
          <span className="text-xs text-muted-foreground">
            {company.restrict_content_to_departments ? 'Restricted' : 'Open'}
          </span>
        </div>
      )
    }
  ];

  const actions = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search companies..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 w-64"
      />
    </div>
  );

  return (
    <SuperAdminTable
      title="Content Visibility Settings"
      data={paginatedCompanies}
      columns={columns}
      totalItems={filteredCompanies.length}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
      onSort={handleSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
      isLoading={loading}
      actions={actions}
    />
  );
};

export default ContentSettingsManagement;
