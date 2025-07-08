
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, UserPlus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 10;

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  
  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [membersPage, setMembersPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  
  // Search states
  const [usersSearch, setUsersSearch] = useState('');
  const [membersSearch, setMembersSearch] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [usersPage, membersPage, usersSearch, membersSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users with pagination and search
      let usersQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE - 1);

      if (usersSearch) {
        usersQuery = usersQuery.ilike('full_name', `%${usersSearch}%`);
      }

      const { data: usersData, error: usersError, count: usersCount } = await usersQuery;
      if (usersError) throw usersError;

      // Fetch company members with pagination and search
      let membersQuery = supabase
        .from('company_members')
        .select(`
          *,
          profiles(id, full_name, avatar_url, created_at),
          companies(id, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((membersPage - 1) * ITEMS_PER_PAGE, membersPage * ITEMS_PER_PAGE - 1);

      if (membersSearch) {
        membersQuery = membersQuery.or(`profiles.full_name.ilike.%${membersSearch}%,companies.name.ilike.%${membersSearch}%`);
      }

      const { data: membersData, error: membersError, count: membersCount } = await membersQuery;
      if (membersError) throw membersError;

      // Fetch all companies for the dropdown
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;

      setUsers(usersData || []);
      setMembers(membersData || []);
      setCompanies(companiesData || []);
      setTotalUsers(usersCount || 0);
      setTotalMembers(membersCount || 0);
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

  const PaginationControls = ({ 
    currentPage, 
    totalItems, 
    onPageChange, 
    itemsPerPage = ITEMS_PER_PAGE 
  }: {
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    itemsPerPage?: number;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => onPageChange(currentPage + 1)}
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
    return <div className="flex justify-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Users Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              All Users ({totalUsers})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1); // Reset to first page when searching
                }}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-6 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                    <div className="text-sm text-gray-600">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
            <PaginationControls
              currentPage={usersPage}
              totalItems={totalUsers}
              onPageChange={setUsersPage}
            />
          </CardContent>
        </Card>

        {/* Company Members Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Company Members ({totalMembers})
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members or companies..."
                value={membersSearch}
                onChange={(e) => {
                  setMembersSearch(e.target.value);
                  setMembersPage(1); // Reset to first page when searching
                }}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-6 max-h-96 overflow-y-auto">
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
              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No members found
                </div>
              )}
            </div>
            <PaginationControls
              currentPage={membersPage}
              totalItems={totalMembers}
              onPageChange={setMembersPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersManagement;
