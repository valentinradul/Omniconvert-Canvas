
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CompanyMember, CompanyRole } from '@/types';
import { useCompany } from '@/context/company/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useDepartments } from '@/context/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Settings } from 'lucide-react';
import DepartmentPermissionSelector from './DepartmentPermissionSelector';

interface EditMemberDialogProps {
  member: CompanyMember | null;
  open: boolean;
  onClose: () => void;
  onMemberUpdated: () => void;
}

const EditMemberDialog: React.FC<EditMemberDialogProps> = ({ 
  member, 
  open, 
  onClose, 
  onMemberUpdated 
}) => {
  const { user } = useAuth();
  const { updateMemberRole, removeMember, userCompanyRole, currentCompany } = useCompany();
  const { departments, loading: departmentsLoading } = useDepartments(currentCompany);
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<CompanyRole>(member?.role || 'member');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Department permissions state
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [allDepartmentsSelected, setAllDepartmentsSelected] = useState(true);
  const [isDepartmentPermissionsLoading, setIsDepartmentPermissionsLoading] = useState(false);

  // Update selected role when member changes
  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  // Load department permissions when dialog opens
  useEffect(() => {
    if (open && member && currentCompany && departments.length > 0) {
      loadMemberDepartmentPermissions();
    }
  }, [open, member, currentCompany, departments]);

  const loadMemberDepartmentPermissions = async () => {
    if (!member || !currentCompany) return;

    setIsDepartmentPermissionsLoading(true);
    try {
      // Get the member's company_members record
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', member.userId)
        .eq('company_id', currentCompany.id)
        .single();

      if (memberError) throw memberError;

      // Get department permissions for this member
      const { data: permissions, error: permissionsError } = await supabase
        .from('member_department_permissions')
        .select('department_id')
        .eq('member_id', memberData.id);

      if (permissionsError) throw permissionsError;

      const departmentIds = permissions.map(p => p.department_id);
      
      // If no specific permissions are set, user has access to all departments
      if (departmentIds.length === 0) {
        setAllDepartmentsSelected(true);
        setSelectedDepartments([]);
      } else {
        setAllDepartmentsSelected(false);
        setSelectedDepartments(departmentIds);
      }
    } catch (error: any) {
      console.error('Error loading department permissions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load department permissions",
      });
    } finally {
      setIsDepartmentPermissionsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!member || selectedRole === member.role) {
      onClose();
      return;
    }

    setIsUpdating(true);
    try {
      await updateMemberRole(member.userId, selectedRole);
      toast({
        title: "Member role updated",
        description: `Role updated to ${selectedRole} successfully`,
      });
      onMemberUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message || "There was an error updating the member role",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateDepartmentPermissions = async () => {
    if (!member || !currentCompany) return;

    setIsUpdating(true);
    try {
      // Get the member's company_members record
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', member.userId)
        .eq('company_id', currentCompany.id)
        .single();

      if (memberError) throw memberError;

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('member_department_permissions')
        .delete()
        .eq('member_id', memberData.id);

      if (deleteError) throw deleteError;

      // If not all departments selected, add specific permissions
      if (!allDepartmentsSelected && selectedDepartments.length > 0) {
        const permissionsToInsert = selectedDepartments.map(departmentId => ({
          member_id: memberData.id,
          department_id: departmentId
        }));

        const { error: insertError } = await supabase
          .from('member_department_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Department permissions updated",
        description: "Member's department access has been updated successfully",
      });
      onMemberUpdated();
    } catch (error: any) {
      console.error('Error updating department permissions:', error);
      toast({
        variant: "destructive",
        title: "Failed to update permissions",
        description: error.message || "There was an error updating department permissions",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!member) return;

    setIsDeleting(true);
    try {
      await removeMember(member.userId);
      toast({
        title: "Member removed",
        description: "Member removed from the company successfully",
      });
      onMemberUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.message || "There was an error removing the member",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments(prev => [...prev, departmentId]);
    } else {
      setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
    }
  };

  const handleAllDepartmentsChange = (checked: boolean) => {
    setAllDepartmentsSelected(checked);
    if (checked) {
      setSelectedDepartments([]);
    }
  };

  if (!member) return null;

  const getUserDisplayName = () => {
    if (member.profile?.fullName) {
      return member.profile.fullName;
    }
    return 'User';
  };

  // Permission logic based on requirements:
  // - Members can't edit anyone (including themselves)
  // - Admins can edit members but not other admins or owners
  // - Owners can edit everyone except other owners
  const isEditingSelf = member.userId === user?.id;
  const canEditRole = () => {
    if (userCompanyRole === 'member') return false;
    if (userCompanyRole === 'admin') {
      return member.role === 'member' && !isEditingSelf;
    }
    if (userCompanyRole === 'owner') {
      return member.role !== 'owner';
    }
    return false;
  };

  const canEditDepartments = () => {
    // Only owners can edit department permissions for members
    return userCompanyRole === 'owner' && member.role === 'member';
  };

  const canDeleteMember = () => {
    if (userCompanyRole === 'member') return false;
    if (member.role === 'owner') return false;
    if (isEditingSelf) return false;
    return userCompanyRole === 'owner' || (userCompanyRole === 'admin' && member.role === 'member');
  };

  // Available roles based on user permissions
  const getAvailableRoles = (): CompanyRole[] => {
    if (userCompanyRole === 'owner') {
      // Owners can assign any role except owner to non-owners
      return member.role === 'owner' ? ['owner'] : ['member', 'admin'];
    }
    if (userCompanyRole === 'admin') {
      // Admins can only change members to member role
      return ['member'];
    }
    // Members can't change roles
    return [member.role];
  };

  const hasChanges = () => {
    return selectedRole !== member.role;
  };

  const hasDepartmentChanges = () => {
    // This would need to compare with loaded state - simplified for now
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Member Details</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Name:</strong> {getUserDisplayName()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Current Role:</strong> <span className="capitalize">{member.role}</span>
            </p>
            {isEditingSelf && (
              <p className="text-xs text-muted-foreground mt-1">
                (This is your profile)
              </p>
            )}
          </div>

          {canEditRole() && (
            <div>
              <h4 className="font-medium mb-2">Change Role</h4>
              <Select value={selectedRole} onValueChange={(value: CompanyRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canEditDepartments() && !departmentsLoading && departments.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Department Access
              </h4>
              {isDepartmentPermissionsLoading ? (
                <div className="text-sm text-muted-foreground">Loading permissions...</div>
              ) : (
                <DepartmentPermissionSelector
                  departments={departments}
                  selectedDepartments={selectedDepartments}
                  onDepartmentChange={handleDepartmentChange}
                  allDepartmentsSelected={allDepartmentsSelected}
                  onAllDepartmentsChange={handleAllDepartmentsChange}
                />
              )}
            </div>
          )}

          {!canEditRole() && !canEditDepartments() && !canDeleteMember() && (
            <p className="text-sm text-muted-foreground">
              {isEditingSelf && userCompanyRole === 'member' 
                ? "Members cannot edit their own profile or roles."
                : "You don't have permission to edit this member."
              }
            </p>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {canDeleteMember() && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {getUserDisplayName()} from the company? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteMember}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Removing..." : "Remove Member"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {canEditRole() && (
              <Button 
                onClick={handleUpdateRole} 
                disabled={isUpdating || selectedRole === member.role}
              >
                {isUpdating ? "Updating..." : "Update Role"}
              </Button>
            )}
            {canEditDepartments() && (
              <Button 
                onClick={handleUpdateDepartmentPermissions} 
                disabled={isUpdating}
                variant="secondary"
              >
                {isUpdating ? "Updating..." : "Update Permissions"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
