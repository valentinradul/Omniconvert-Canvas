
import React from 'react';
import { TeamMemberForm } from './TeamMemberForm';
import { TeamMemberFormData } from '@/types';

interface AddTeamMemberFormProps {
  onSubmit: (values: TeamMemberFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const AddTeamMemberForm: React.FC<AddTeamMemberFormProps> = ({ 
  onSubmit, 
  isSubmitting = false 
}) => {
  const defaultValues: Partial<TeamMemberFormData> = {
    name: '',
    email: '',
    role: 'Team Member',
    department: '',
    title: '',
    departmentVisibility: 'Own Department',
    visibleDepartments: []
  };

  return (
    <TeamMemberForm
      onSubmit={onSubmit}
      defaultValues={defaultValues}
      isSubmitting={isSubmitting}
      submitLabel="Add Member"
    />
  );
};
