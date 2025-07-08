
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, UserPlus, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  created_at: string;
  profiles: User;
  companies: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch all company members with profile and company info
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select(`
          *,
          profiles(id, full_name, avatar_url, created_at),
          companies(id, name)
        `)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Fetch all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;

      setUsers(usersData || []);
      setMembers(membersData || []);
      setCompanies(companiesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"? This action cannot be undone and will remove all their data.`)) {
      return;
    }

    try {
      // First, remove all company memberships for this user
      const { error: membersError } = await supabase
        .from('company_members')
        .delete()
        .eq('user_id', userId);

      if (membersError) throw membersError;

      // Delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Note: We cannot delete from auth.users table directly via the client
      // The profile deletion will cascade due to the foreign key relationship
      
      toast({
        title: 'Success',
        description: `User "${userName}" has been deleted successfully`
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user. Please try again.'
      });
    }
  };

  const addMemberToCompany = async () => {
    if (!selectedUserId || !selectedCompanyId || !selectedRole) return;

    try {
      // Check if user is already a member of this company
      const existingMember = members.find(
        m => m.user_id === selectedUserId && m.company_id === selectedCompanyId
      );

      if (existingMember) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'User is already a member of this company'
        });
        return;
      }

      const { error } = await supabase
        .from('company_members')
        .insert({
          user_id: selectedUserId,
          company_id: selectedCompanyId,
          role: selectedRole
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User added to company successfully'
      });

      setSelectedUserId('');
      setSelectedCompanyId('');
      setSelectedRole('member');
      setIsAddMemberDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add user to company'
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member role updated successfully'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update member role'
      });
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the company?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed successfully'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove member'
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* All Users Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                  <div className="text-sm text-gray-600">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteUser(user.id, user.full_name || 'Unnamed User')}
                  className="flex items-center gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Company Members Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Company Members ({members.length})
              <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add User to Company</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || 'Unnamed User'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Select Company</Label>
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a company" />
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
                    <div>
                      <Label>Select Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={addMemberToCompany} 
                        disabled={!selectedUserId || !selectedCompanyId}
                      >
                        Add Member
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{member.profiles.full_name || 'Unnamed User'}</div>
                  <div className="text-sm text-gray-600">{member.companies.name}</div>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="mt-1">
                    {member.role}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(role) => updateMemberRole(member.id, role)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersManagement;
