
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TeamMemberFormData, ALL_DEPARTMENT_VISIBILITY_OPTIONS } from '@/types';

interface DepartmentVisibilityFieldProps {
  control: Control<TeamMemberFormData>;
}

export const DepartmentVisibilityField: React.FC<DepartmentVisibilityFieldProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="departmentVisibility"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Department Visibility</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              {ALL_DEPARTMENT_VISIBILITY_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`visibility-${option}`} />
                  <Label htmlFor={`visibility-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
