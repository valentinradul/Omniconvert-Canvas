import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Calendar, Search, Crown, Edit, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompany } from '@/context/company/CompanyContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useAuth } from '@/context/AuthContext';

interface Company {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count?: number;
  owner_name?: string;
  owner_email?: string;
}

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { userCompanyRole, currentCompany } = useCompany();
  const { isSuperAdmin, isOperatingAsSuperAdmin } = useSuperAdmin();
  const { user } = useAuth();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No authenticated user:', userError);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please log in to view companies'
        });
        setLoading(false);
        return;
      }

      // Get companies that the current user is an admin/owner of OR created
      const [userCompanies, createdCompanies] = await Promise.all([
        // Companies where user is admin or owner
        supabase
          .from('company_members')
          .select(`
            company_id,
            role,
            companies!inner (
              id,
              name,
              created_at,
              created_by
            )
          `)
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin']),
        
        // Companies created by the user (not necessarily member)
        supabase
          .from('companies')
          .select('id, name, created_at, created_by')
          .eq('created_by', user.id)
      ]);

      if (userCompanies.error) throw userCompanies.error;
      if (createdCompanies.error) throw createdCompanies.error;

      // Combine and deduplicate companies
      const allCompaniesMap = new Map();

      // Add companies where user is admin/owner
      userCompanies.data?.forEach(uc => {
        allCompaniesMap.set(uc.companies.id, uc.companies);
      });

      // Add companies created by user
      createdCompanies.data?.forEach(company => {
        if (!allCompaniesMap.has(company.id)) {
          allCompaniesMap.set(company.id, company);
        }
      });

      const allCompanies = Array.from(allCompaniesMap.values());

      // Get member counts for each company
      const companyIds = allCompanies.map(c => c.id);
      
      if (companyIds.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      const { data: memberCounts, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .in('company_id', companyIds);

      if (memberError) throw memberError;

      // Count members per company
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.company_id] = (acc[member.company_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get owner details for each company
      const { data: owners, error: ownerError } = await supabase
        .from('company_members')
        .select(`
          company_id,
          profiles (
            full_name
          )
        `)
        .eq('role', 'owner')
        .in('company_id', companyIds);

      if (ownerError) console.warn('Could not fetch owner details:', ownerError);

      const ownerMap = owners?.reduce((acc, owner) => {
        acc[owner.company_id] = {
          name: (owner as any).profiles?.full_name || 'Unknown',
          email: ''
        };
        return acc;
      }, {} as Record<string, { name: string; email: string }>) || {};

      const formattedCompanies = allCompanies.map(company => ({
        id: company.id,
        name: company.name,
        created_at: company.created_at,
        created_by: company.created_by,
        member_count: memberCountMap[company.id] || 0,
        owner_name: ownerMap[company.id]?.name || 'Unknown',
        owner_email: ownerMap[company.id]?.email || ''
      }));

      setCompanies(formattedCompanies);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch companies'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
    setIsEditDialogOpen(true);
  };

  // Check if user can edit a company (creator or super admin)
  const canEditCompany = (company: Company) => {
    return isOperatingAsSuperAdmin || (user && company.created_by === user.id);
  };

  // Check if user can delete a company (creator or super admin)
  const canDeleteCompany = (company: Company) => {
    return isOperatingAsSuperAdmin || (user && company.created_by === user.id);
  };

  const updateCompany = async () => {
    if (!editingCompany || !editCompanyName.trim()) return;

    try {
      // Check permissions before updating
      if (!canEditCompany(editingCompany)) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to edit this company'
        });
        return;
      }

      const { error } = await supabase
        .from('companies')
        .update({ name: editCompanyName.trim() })
        .eq('id', editingCompany.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company updated successfully'
      });

      setIsEditDialogOpen(false);
      setEditingCompany(null);
      setEditCompanyName('');
      fetchCompanies();
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update company'
      });
    }
  };

  const deleteCompany = async (companyId: string) => {
    try {
      const companyToDelete = companies.find(c => c.id === companyId);
      if (!companyToDelete) return;

      // Check permissions before deleting
      if (!canDeleteCompany(companyToDelete)) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to delete this company'
        });
        return;
      }

      // Check if company has related data
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id')
        .eq('company_id', companyId);

      const { data: hypotheses } = await supabase
        .from('hypotheses')
        .select('id')
        .eq('company_id', companyId);

      const { data: experiments } = await supabase
        .from('experiments')
        .select('id')
        .eq('company_id', companyId);

      const relatedDataCount = (ideas?.length || 0) + (hypotheses?.length || 0) + (experiments?.length || 0);

      if (relatedDataCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Cannot Delete Company',
          description: `This company has ${relatedDataCount} related items (ideas, hypotheses, or experiments). Please remove all related data first.`
        });
        return;
      }

      // Delete company members first
      await supabase
        .from('company_members')
        .delete()
        .eq('company_id', companyId);

      // Delete company invitations
      await supabase
        .from('company_invitations')
        .delete()
        .eq('company_id', companyId);

      // Delete company content settings
      await supabase
        .from('company_content_settings')
        .delete()
        .eq('company_id', companyId);

      // Finally delete the company
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company deleted successfully'
      });

      fetchCompanies();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete company'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Company Management
          </CardTitle>
          <CardDescription>
            Manage companies where you have admin or owner access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Company Management
        </CardTitle>
        <CardDescription>
          Manage companies where you have admin access or that you created
        </CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No companies found where you have admin access or that you created.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="font-medium">{company.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="font-medium text-sm">{company.owner_name}</div>
                          {company.owner_email && (
                            <div className="text-xs text-muted-foreground">{company.owner_email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Users className="h-3 w-3" />
                        {company.member_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(company.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                          disabled={!canEditCompany(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={!canDeleteCompany(company)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Company</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{company.name}"? This action cannot be undone.
                                Only owners can delete companies, and all related data must be removed first.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCompany(company.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-company-name">Company Name</Label>
              <Input
                id="edit-company-name"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateCompany} disabled={!editCompanyName.trim()}>
                Update Company
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CompanyManagement;