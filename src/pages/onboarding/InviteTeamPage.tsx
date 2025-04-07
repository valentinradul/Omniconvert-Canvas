
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCompanyContext } from '@/context/CompanyContext';
import { useCompanyInvitations } from '@/hooks/useCompanyInvitations';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  role: z.enum(['manager', 'member'], {
    required_error: "You need to select a role",
  })
});

export default function InviteTeamPage() {
  const { activeCompany, refreshCompanies, isLoading } = useCompanyContext();
  const { sendInvitation } = useCompanyInvitations(activeCompany?.id);
  const [sentEmails, setSentEmails] = useState<string[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'member'
    }
  });

  // Try to refresh companies on component mount to ensure we have the latest data
  useEffect(() => {
    console.log("InviteTeamPage mounted, refreshing companies");
    refreshCompanies();
    
    // After a short delay, set loading to false
    const timer = setTimeout(() => {
      setLocalIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update local loading state based on context loading
  useEffect(() => {
    if (!isLoading) {
      setLocalIsLoading(false);
    }
  }, [isLoading]);
  
  useEffect(() => {
    if (activeCompany) {
      console.log("InviteTeamPage: Active company loaded:", activeCompany.name);
    } else if (!localIsLoading && !isLoading) {
      console.log("InviteTeamPage: No active company available after loading");
    }
  }, [activeCompany, localIsLoading, isLoading]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeCompany?.id) {
      console.error('No active company found');
      toast.error("No active company selected");
      return;
    }
    
    try {
      const result = await sendInvitation(values.email, values.role);
      if (result) {
        setSentEmails([...sentEmails, values.email]);
        form.reset();
        toast.success(`Invitation sent to ${values.email}`);
      } else {
        toast.error("Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };
  
  const handleCreateCompany = () => {
    navigate('/onboarding/create-company');
  };

  // Show loading state
  if (localIsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
            <CardDescription>
              Please wait while we load your company information.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show "no company" state when loading is complete but no company is found
  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">No Company Selected</CardTitle>
            <CardDescription>
              Please create or select a company before inviting team members.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleCreateCompany}>
              Create Company
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Invite Your Team</CardTitle>
          <CardDescription>
            Invite colleagues to collaborate on experiments in {activeCompany.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sentEmails.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-md">
              <p className="font-medium text-green-800">Invitations sent to:</p>
              <ul className="mt-2 text-sm text-green-700">
                {sentEmails.map(email => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="colleague@example.com"
                        type="email"
                        {...field}
                        autoFocus
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
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="manager" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Manager (can add/edit all experiments)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="member" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Member (can only edit their own experiments)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Send Invitation
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={handleFinish}
          >
            Finish
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
