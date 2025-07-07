
import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { superAdminService } from '@/services/superAdminService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Building2, Users, Folder, Trash2, Plus, UserMinus, Settings } from 'lucide-react';
import type { CompanyWithMembers, MemberWithProfile, DepartmentWithCompany } from '@/types/superAdmin';
import { formatDistanceToNow } from 'date-fns';

const SuperAdminPage: React.FC = () => {
  const { isSuperAdmin, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [companies, setCompanies] = useState<CompanyWithMembers[]>([]);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithCompany[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Dialog states
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCompanyId, setNewDeptCompanyId] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      loadAllData();
    }
  }, [isSuperAdmin]);

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [companiesData, membersData, departmentsData] = await Promise.all([
        superAdminService.getAllCompanies(),
        superAdminService.getAllMembers(),
        superAdminService.getAllDepartments()
      ]);
      
      setCompanies(companiesData);
      setMembers(membersData);
      setDepartments(departmentsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: error.message,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    try {
      await superAdminService.deleteCompany(companyId);
      toast({
        title: "Company deleted",
        description: `${companyName} has been deleted successfully`,
      });
      loadAllData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete company",
        description: error.message,
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      await superAdminService.removeMember(memberId);
      toast({
        title: "Member removed",
        description: `${memberName} has been removed successfully`,
      });
      loadAllData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.message,
      });
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim() || !newDeptCompanyId) return;

    try {
      await superAdminService.createDepartment(newDeptName, newDeptCompanyId, 'system');
      toast({
        title: "Department created",
        description: `${newDeptName} has been created successfully`,
      });
      setNewDeptName('');
      setNewDeptCompanyId('');
      setShowCreateDept(false);
      loadAllData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create department",
        description: error.message,
      });
    }
  };

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    try {
      await superAdminService.deleteDepartment(deptId);
      toast({
        title: "Department deleted",
        description: `${deptName} has been deleted successfully`,
      });
      loadAllData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete department",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have super admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage companies, members, and departments across the platform</p>
        </div>
        <Button onClick={loadAllData} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies">
            <Building2 className="h-4 w-4 mr-2" />
            Companies ({companies.length})
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Folder className="h-4 w-4 mr-2" />
            Departments ({departments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>Manage all companies in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">Loading companies...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Departments</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{company.membersCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.departmentsCount}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Company</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{company.name}"? This will remove all associated members, departments, and data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCompany(company.id, company.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Company
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>All Members</CardTitle>
              <CardDescription>Manage all company members across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">Loading members...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.profile?.fullName || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.department?.name || 'No department'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{member.profile?.fullName || 'this user'}" from the company? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id, member.profile?.fullName || 'User')}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Departments</CardTitle>
                <CardDescription>Manage departments across all companies</CardDescription>
              </div>
              <Dialog open={showCreateDept} onOpenChange={setShowCreateDept}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Department</DialogTitle>
                    <DialogDescription>
                      Create a new department for a company
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="deptName">Department Name</Label>
                      <Input
                        id="deptName"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g. Marketing"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Select value={newDeptCompanyId} onValueChange={setNewDeptCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDept(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateDepartment}
                      disabled={!newDeptName.trim() || !newDeptCompanyId}
                    >
                      Create Department
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="text-muted-foreground">{dept.company.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(dept.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{dept.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Department
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminPage;
