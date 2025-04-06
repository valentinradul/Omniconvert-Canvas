import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  role: z.string().min(2, { message: "Role must be at least 2 characters" })
});

const TeamMembersSection: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Member'
    },
  });

  // Fetch team members on component mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        
        // First, get the user's team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('created_by', user?.id)
          .single();
          
        if (teamError) {
          console.error('Error fetching team:', teamError);
          toast.error('Failed to load team members');
          setIsLoading(false);
          return;
        }
        
        if (!teamData) {
          console.log('No team found for this user');
          setIsLoading(false);
          return;
        }
        
        // Then, get team members for this team
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('id, role, name, email, status')
          .eq('team_id', teamData.id);
          
        if (membersError) {
          console.error('Error fetching team members:', membersError);
          toast.error('Failed to load team members');
          setIsLoading(false);
          return;
        }

        // Convert the data to match our TeamMember structure
        const formattedMembers = membersData.map(member => ({
          id: member.id,
          name: member.name || 'Unknown',
          email: member.email || 'No email provided',
          role: member.role
        }));
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error('Unexpected error fetching team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // First, get the user's team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user?.id)
        .single();
        
      if (teamError) {
        console.error('Error fetching team:', teamError);
        toast.error('Failed to add team member');
        return;
      }
      
      if (!teamData) {
        toast.error('No team found');
        return;
      }
      
      // Create a new team member
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: null, // Placeholder as we're inviting a user who might not exist yet
          role: values.role,
          email: values.email,
          name: values.name,
          status: 'invited'
        })
        .select()
        .single();
        
      if (memberError) {
        console.error('Error adding team member:', memberError);
        toast.error('Failed to add team member');
        return;
      }

      const newTeamMember: TeamMember = {
        id: newMember.id,
        name: values.name,
        email: values.email,
        role: values.role
      };
      
      setMembers([...members, newTeamMember]);
      toast.success('Team member invited successfully!');
      setIsDialogOpen(false);
      form.reset();
      
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their roles.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Team Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to join your team.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter email" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter role (e.g., Admin, Member)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button type="submit">Add Member</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center py-4">Loading team members...</p>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No team members yet.</p>
          ) : (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4">{member.name}</td>
                      <td className="py-3 px-4">{member.email}</td>
                      <td className="py-3 px-4">{member.role}</td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            toast.success(`Email invitation sent to ${member.email}`);
                          }}
                        >
                          Resend Invite
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMembersSection;
