
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useCompanyContext } from '@/context/CompanyContext';
import { useCompanyInvitations } from '@/hooks/useCompanyInvitations';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  role: z.enum(['owner', 'manager', 'member'], {
    required_error: "You need to select a role",
  })
});

type InviteFormData = {
  email: string;
  role: 'owner' | 'manager' | 'member';
};

interface CompanyInviteFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const CompanyInviteForm: React.FC<CompanyInviteFormProps> = ({
  onSuccess,
  onCancel,
  isSubmitting = false
}) => {
  const { activeCompany, isAdmin } = useCompanyContext();
  const { sendInvitation } = useCompanyInvitations(activeCompany?.id);
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'member'
    }
  });
  
  const handleSubmit = async (values: InviteFormData) => {
    try {
      console.log('CompanyInviteForm: Starting submission with values:', values);
      
      if (!activeCompany?.id) {
        console.error('No active company found');
        toast.error("No active company selected");
        return;
      }
      
      // Only admin users can add other admins
      if (values.role === 'owner' && !isAdmin) {
        toast.error("Only company admins can add new admins");
        return;
      }
      
      // Use sendInvitation from useCompanyInvitations hook
      const result = await sendInvitation(
        values.email,
        values.role
      );
      
      console.log('CompanyInviteForm: Invitation result:', result);
      
      if (result) {
        form.reset();
        onSuccess();
      }
    } catch (error) {
      console.error('Error in CompanyInviteForm handleSubmit:', error);
      toast.error("Failed to send invitation");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  {isAdmin && (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="owner" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Admin (full access)
                      </FormLabel>
                    </FormItem>
                  )}
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
        
        <DialogFooter>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
