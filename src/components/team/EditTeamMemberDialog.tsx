
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImagePlus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TeamMember, ALL_TEAM_MEMBER_ROLES, ALL_DEPARTMENT_VISIBILITY_OPTIONS } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  email: z.string().email({ message: "Please enter a valid email" }).optional(),
  role: z.enum(["Admin", "Manager", "Team Member"] as const),
  department: z.string().optional(),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }).optional(),
  departmentVisibility: z.enum(["Own Department", "Selected Departments", "All Departments"] as const).default("Own Department"),
  visibleDepartments: z.array(z.string()).optional(),
  photoUrl: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface EditTeamMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<FormValues>) => Promise<void>;
  member: TeamMember | null;
}

export const EditTeamMemberDialog: React.FC<EditTeamMemberDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit,
  member 
}) => {
  const { departments } = useApp();
  const [photoPreview, setPhotoPreview] = useState<string | null>(member?.photoUrl || null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name || '',
      email: member?.email || '',
      role: (member?.role as any) || 'Team Member',
      department: member?.department || '',
      title: member?.title || '',
      departmentVisibility: (member?.departmentVisibility as any) || 'Own Department',
      visibleDepartments: member?.visibleDepartments || []
    },
    values: {
      name: member?.name || '',
      email: member?.email || '',
      role: (member?.role as any) || 'Team Member',
      department: member?.department || '',
      title: member?.title || '',
      departmentVisibility: (member?.departmentVisibility as any) || 'Own Department',
      visibleDepartments: member?.visibleDepartments || []
    }
  });

  React.useEffect(() => {
    if (member && isOpen) {
      form.reset({
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department || '',
        title: member.title || '',
        departmentVisibility: member.departmentVisibility || 'Own Department',
        visibleDepartments: member.visibleDepartments || []
      });
      setPhotoPreview(member.photoUrl || null);
    }
  }, [member, isOpen, form]);

  const selectedVisibility = form.watch('departmentVisibility');
  const selectedDepartment = form.watch('department');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update team member details and permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt={member?.name} />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {member?.name.substring(0, 2).toUpperCase() || <ImagePlus className="h-8 w-8" />}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
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
                      disabled // Name is read-only
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
                      disabled // Email is read-only
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
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_TEAM_MEMBER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role} {role === 'Admin' && '(full access)'}
                          {role === 'Manager' && '(can edit all experiments)'}
                          {role === 'Team Member' && '(standard access)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="departmentVisibility"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Department Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {ALL_DEPARTMENT_VISIBILITY_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`visibility-edit-${option}`} />
                          <Label htmlFor={`visibility-edit-${option}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedVisibility === "Selected Departments" && (
              <FormField
                control={form.control}
                name="visibleDepartments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visible Departments</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {departments
                        .filter((dept) => dept.id !== selectedDepartment)
                        .map((dept) => {
                          const isSelected = field.value?.includes(dept.id);
                          return (
                            <Button
                              key={dept.id}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const current = field.value || [];
                                field.onChange(
                                  isSelected
                                    ? current.filter((id) => id !== dept.id)
                                    : [...current, dept.id]
                                );
                              }}
                            >
                              {dept.name}
                            </Button>
                          );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4">
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
