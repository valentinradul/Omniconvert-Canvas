
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TeamMemberFormData, ALL_TEAM_MEMBER_ROLES, ALL_DEPARTMENT_VISIBILITY_OPTIONS } from '@/types';
import { useApp } from '@/context/AppContext';
import { UserPhotoUpload } from './UserPhotoUpload';
import { TeamMemberRoleField } from './form-fields/TeamMemberRoleField';
import { TeamMemberDepartmentField } from './form-fields/TeamMemberDepartmentField';
import { DepartmentVisibilityField } from './form-fields/DepartmentVisibilityField';
import { VisibleDepartmentsField } from './form-fields/VisibleDepartmentsField';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  role: z.enum(["Admin", "Manager", "Team Member"] as const),
  department: z.string().optional(),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }).optional(),
  departmentVisibility: z.enum(["Own Department", "Selected Departments", "All Departments"] as const).default("Own Department"),
  visibleDepartments: z.array(z.string()).optional(),
  photoUrl: z.string().optional()
});

interface TeamMemberFormProps {
  onSubmit: (values: TeamMemberFormData) => Promise<void>;
  defaultValues: Partial<TeamMemberFormData>;
  isSubmitting?: boolean;
  submitLabel: string;
  cancelButton?: React.ReactNode;
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  submitLabel,
  cancelButton
}) => {
  const { departments } = useApp();
  
  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues.name || '',
      email: defaultValues.email || '',
      role: defaultValues.role || 'Team Member',
      department: defaultValues.department || '',
      title: defaultValues.title || '',
      departmentVisibility: defaultValues.departmentVisibility || 'Own Department',
      visibleDepartments: defaultValues.visibleDepartments || [],
      photoUrl: defaultValues.photoUrl
    },
  });

  const selectedVisibility = form.watch('departmentVisibility');
  const selectedDepartment = form.watch('department');

  const handlePhotoChange = (photoUrl: string | null) => {
    form.setValue('photoUrl', photoUrl || undefined);
  };

  const handleFormSubmit = async (values: TeamMemberFormData) => {
    console.log("TeamMemberForm: Starting form submission with values:", values);
    try {
      await onSubmit(values);
      console.log("TeamMemberForm: Form submission successful");
    } catch (error) {
      console.error("TeamMemberForm: Form submission failed:", error);
      // Form error handling is handled by the parent component
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="flex justify-center mb-4">
          <UserPhotoUpload 
            userName={form.watch('name')}
            onPhotoChange={handlePhotoChange}
            currentPhotoUrl={defaultValues.photoUrl}
          />
        </div>
        
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Growth Marketer, Product Manager" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <TeamMemberRoleField 
          control={form.control} 
        />
        
        <TeamMemberDepartmentField 
          control={form.control} 
          departments={departments}
        />
        
        <DepartmentVisibilityField 
          control={form.control} 
        />
        
        {selectedVisibility === "Selected Departments" && (
          <VisibleDepartmentsField 
            control={form.control}
            departments={departments}
            selectedDepartment={selectedDepartment}
          />
        )}
        
        <DialogFooter className="pt-4">
          {cancelButton}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
