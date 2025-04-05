
import React, { useState, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Tag } from '@/types';

interface TagInputProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add tags...'
}) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (!input.trim()) return;
      
      // Don't add duplicate tags
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border rounded-md bg-background p-2 min-h-10">
      {tags.map((tag, i) => (
        <Badge 
          key={`${tag}-${i}`} 
          variant="secondary"
          className="flex items-center gap-1"
        >
          {tag}
          <X 
            size={12} 
            className="cursor-pointer" 
            onClick={() => removeTag(tag)}
          />
        </Badge>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
      />
    </div>
  );
};

export default TagInput;
