
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { TeamMemberFormData, Department } from '@/types';

interface VisibleDepartmentsFieldProps {
  control: Control<TeamMemberFormData>;
  departments: Department[];
  selectedDepartment: string | undefined;
}

export const VisibleDepartmentsField: React.FC<VisibleDepartmentsFieldProps> = ({ 
  control,
  departments,
  selectedDepartment
}) => {
  return (
    <FormField
      control={control}
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
  );
};
