
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Settings, Shield, Users, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminAccess {
  id: string;
  user_id: string;
  company_id: string;
  can_manage_ideas: boolean;
  can_manage_experiments: boolean;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
  };
  companies: {
    id: string;
    name: string;
  };
}

interface CompanyAdmin {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
  };
  companies: {
    id: string;
    name: string;
  };
}

const ITEMS_PER_PAGE = 10;

const AdminAccessManagement: React.FC = () => {
  const [adminAccess, setAdminAccess] = useState<AdminAccess[]>([]);
  const [companyAdmins, setCompanyAdmins] = useState<CompanyAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<CompanyAdmin | null>(null);
  const [editPermissions, setEditPermissions] = useState({
    can_manage_ideas: false,
    can_manage_experiments: false
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedCompanyId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch company admins with search and filtering
      let adminsQuery = supabase
        .from('company_members')
        .select(`
          *,
          profiles(id, full_name),
          companies(id, name)
        `, { count: 'exact' })
        .in('role', ['admin', 'owner'])
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (searchTerm) {
        adminsQuery = adminsQuery.or(`profiles.full_name.ilike.%${searchTerm}%,companies.name.ilike.%${searchTerm}%`);
      }

      if (selectedCompanyId) {
        adminsQuery = adminsQuery.eq('company_id', selectedCompanyId);
      }

      const { data: adminsData, error: adminsError, count } = await adminsQuery;
      if (adminsError) throw adminsError;

      setCompanyAdmins(adminsData || []);
      setTotalItems(count || 0);

      // Fetch existing admin access permissions
      const { data: accessData, error: accessError } = await supabase
        .from('admin_access_permissions')
        .select(`
          *,
          profiles(id, full_name),
          companies(id, name)
        `);

      if (accessError && accessError.code !== 'PGRST116') {
        console.error('Error fetching admin access:', accessError);
      } else {
        setAdminAccess(accessData || []);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch admin data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (admin: CompanyAdmin) => {
    setSelectedAdmin(admin);
    
    // Find existing permissions for this admin
    const existingAccess = adminAccess.find(
      access => access.user_id === admin.user_id && access.company_id === admin.company_id
    );

    setEditPermissions({
      can_manage_ideas: existingAccess?.can_manage_ideas || false,
      can_manage_experiments: existingAccess?.can_manage_experiments || false
    });

    setIsEditDialogOpen(true);
  };

  const savePermissions = async () => {
    if (!selectedAdmin) return;

    try {
      const { error } = await supabase
        .from('admin_access_permissions')
        .upsert({
          user_id: selectedAdmin.user_id,
          company_id: selectedAdmin.company_id,
          can_manage_ideas: editPermissions.can_manage_ideas,
          can_manage_experiments: editPermissions.can_manage_experiments
        }, {
          onConflict: 'user_id,company_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin permissions updated successfully'
      });

      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update admin permissions'
      });
    }
  };

  const getAdminPermissions = (userId: string, companyId: string) => {
    return adminAccess.find(
      access => access.user_id === userId && access.company_id === companyId
    );
  };

  const PaginationControls = () => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center text-sm text-gray-700">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading admin access management...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Admin Access Management ({totalItems})
          </CardTitle>
          
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search admins or companies..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={selectedCompanyId} onValueChange={(value) => {
              setSelectedCompanyId(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-3 p-6 max-h-96 overflow-y-auto">
            {companyAdmins.map((admin) => {
              const permissions = getAdminPermissions(admin.user_id, admin.company_id);
              
              return (
                <div key={`${admin.user_id}-${admin.company_id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">
                          {admin.profiles.full_name || 'Unnamed Admin'}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          {admin.companies.name}
                        </div>
                      </div>
                      <Badge variant={admin.role === 'owner' ? 'default' : 'secondary'}>
                        {admin.role}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <Badge variant={permissions?.can_manage_ideas ? 'default' : 'outline'}>
                        Ideas: {permissions?.can_manage_ideas ? 'Allowed' : 'Restricted'}
                      </Badge>
                      <Badge variant={permissions?.can_manage_experiments ? 'default' : 'outline'}>
                        Experiments: {permissions?.can_manage_experiments ? 'Allowed' : 'Restricted'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPermissions(admin)}
                  >
                    <Settings className="h-4 w-4" />
                    Manage Access
                  </Button>
                </div>
              );
            })}
            
            {companyAdmins.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No admins found
              </div>
            )}
          </div>
          
          <PaginationControls />
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Admin Access</DialogTitle>
          </DialogHeader>
          
          {selectedAdmin && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">
                  {selectedAdmin.profiles.full_name || 'Unnamed Admin'}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedAdmin.companies.name} • {selectedAdmin.role}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Ideas Management</Label>
                    <p className="text-sm text-gray-600">
                      Allow admin to manage ideas across the platform
                    </p>
                  </div>
                  <Switch
                    checked={editPermissions.can_manage_ideas}
                    onCheckedChange={(checked) =>
                      setEditPermissions(prev => ({ ...prev, can_manage_ideas: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Experiments Management</Label>
                    <p className="text-sm text-gray-600">
                      Allow admin to manage experiments across the platform
                    </p>
                  </div>
                  <Switch
                    checked={editPermissions.can_manage_experiments}
                    onCheckedChange={(checked) =>
                      setEditPermissions(prev => ({ ...prev, can_manage_experiments: checked }))
                    }
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={savePermissions}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAccessManagement;
