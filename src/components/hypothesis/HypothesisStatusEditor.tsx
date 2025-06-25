
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HypothesisStatus, ALL_HYPOTHESIS_STATUSES } from '@/types';

interface HypothesisStatusEditorProps {
  currentStatus: HypothesisStatus;
  onStatusChange: (newStatus: HypothesisStatus) => void;
  disabled?: boolean;
}

const HypothesisStatusEditor: React.FC<HypothesisStatusEditorProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  return (
    <Select 
      value={currentStatus} 
      onValueChange={(value) => onStatusChange(value as HypothesisStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {ALL_HYPOTHESIS_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default HypothesisStatusEditor;
