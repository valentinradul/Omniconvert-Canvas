import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/context/company/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building, 
  Loader2, 
  Shield, 
  Info, 
  Plus, 
  Trash2, 
  Edit,
  Target,
  Save
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContentSettings {
  id: string;
  company_id: string;
  restrict_content_to_departments: boolean;
  enable_financial_tracking: boolean;
  enable_gtm_calculator: boolean;
}

interface Department {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
}

const CompanyEditPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userCompanyRole, currentCompany } = useCompany();
  
  const [companyName, setCompanyName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch company details
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch content settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['content-settings', companyId],
    queryFn: async (): Promise<ContentSettings | null> => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('company_content_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found, create default
        const { data: newSettings, error: createError } = await supabase
          .from('company_content_settings')
          .insert({
            company_id: companyId,
            restrict_content_to_departments: false,
            enable_financial_tracking: true,
            enable_gtm_calculator: false
          })
          .select()
          .single();

        if (createError) throw createError;
        return newSettings;
      }

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return data as Department[];
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setCompanyName(company.name);
    }
  }, [company]);

  // Update company name mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('companies')
        .update({ name })
        .eq('id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company updated', description: 'Company name has been updated.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<ContentSettings>) => {
      if (!settings?.id) return;
      const { error } = await supabase
        .from('company_content_settings')
        .update(updates)
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-settings', companyId] });
      toast({ title: 'Settings updated', description: 'Content settings have been updated.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  // Department mutations
  const addDepartmentMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('departments')
        .insert({ name: name.trim(), company_id: companyId, created_by: user.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', companyId] });
      setNewDepartmentName('');
      setNewDialogOpen(false);
      toast({ title: 'Department created', description: 'Department has been created.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const editDepartmentMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('departments')
        .update({ name: name.trim() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', companyId] });
      setEditDepartmentId(null);
      setEditDepartmentName('');
      setEditDialogOpen(false);
      toast({ title: 'Department updated', description: 'Department has been updated.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', companyId] });
      toast({ title: 'Department deleted', description: 'Department has been deleted.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const handleToggleSetting = async (key: keyof ContentSettings, value: boolean) => {
    setIsUpdating(true);
    try {
      await updateSettingsMutation.mutateAsync({ [key]: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCompanyName = async () => {
    if (!companyName.trim()) return;
    await updateCompanyMutation.mutateAsync(companyName.trim());
  };

  const openEditDepartmentDialog = (dept: Department) => {
    setEditDepartmentId(dept.id);
    setEditDepartmentName(dept.name);
    setEditDialogOpen(true);
  };

  const isLoading = companyLoading || settingsLoading || departmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Company not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/company-management')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Company Management
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company-management')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Company</h1>
          <p className="text-muted-foreground">Manage company settings, departments, and features</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Details
              </CardTitle>
              <CardDescription>Update your company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                  <Button 
                    onClick={handleSaveCompanyName}
                    disabled={updateCompanyMutation.isPending || companyName === company.name}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage your organization's departments</CardDescription>
                </div>
                <Button onClick={() => setNewDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No departments yet. Create your first department.</p>
              ) : (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{dept.name}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDepartmentDialog(dept)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
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
                              <AlertDialogAction onClick={() => deleteDepartmentMutation.mutate(dept.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* GTM Calculator Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                GTM Calculator
              </CardTitle>
              <CardDescription>Enable or disable the Go-To-Market planning tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Enable GTM Calculator</h4>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users can access ad planning, outreach calculator, and campaign management tools
                  </p>
                </div>
                <Switch
                  checked={settings?.enable_gtm_calculator || false}
                  onCheckedChange={(checked) => handleToggleSetting('enable_gtm_calculator', checked)}
                  disabled={isUpdating}
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {settings?.enable_gtm_calculator 
                    ? <><strong>GTM Calculator is enabled.</strong> Users can access Go-To-Market planning tools.</>
                    : <><strong>GTM Calculator is disabled.</strong> Enable to access ad planning and outreach tools.</>
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Department Content Restriction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Department-Based Content Access
              </CardTitle>
              <CardDescription>Control content visibility based on departments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Restrict content to departments</h4>
                  <p className="text-sm text-muted-foreground">
                    Users will only see content from their assigned departments
                  </p>
                </div>
                <Switch
                  checked={settings?.restrict_content_to_departments || false}
                  onCheckedChange={(checked) => handleToggleSetting('restrict_content_to_departments', checked)}
                  disabled={isUpdating}
                />
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {settings?.restrict_content_to_departments
                    ? <><strong>Department restrictions active.</strong> Users see only their department's content.</>
                    : <><strong>Open access.</strong> All users can see all company content.</>
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Financial Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Experiment Financial Tracking
              </CardTitle>
              <CardDescription>Enable cost and revenue tracking for experiments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Enable financial tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Experiments will include sections for tracking costs and revenues
                  </p>
                </div>
                <Switch
                  checked={settings?.enable_financial_tracking || false}
                  onCheckedChange={(checked) => handleToggleSetting('enable_financial_tracking', checked)}
                  disabled={isUpdating}
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {settings?.enable_financial_tracking
                    ? <><strong>Financial tracking enabled.</strong> Experiments include cost/revenue sections.</>
                    : <><strong>Financial tracking disabled.</strong> No financial sections in experiments.</>
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Department Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>Add a new department to your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newDeptName">Department Name</Label>
              <Input
                id="newDeptName"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="E.g. Marketing"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => addDepartmentMutation.mutate(newDepartmentName)}
              disabled={!newDepartmentName.trim() || addDepartmentMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update the department name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDeptName">Department Name</Label>
              <Input
                id="editDeptName"
                value={editDepartmentName}
                onChange={(e) => setEditDepartmentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => editDepartmentMutation.mutate({ id: editDepartmentId!, name: editDepartmentName })}
              disabled={!editDepartmentName.trim() || editDepartmentMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyEditPage;
