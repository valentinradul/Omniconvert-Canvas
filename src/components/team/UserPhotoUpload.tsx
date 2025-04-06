
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';

interface UserPhotoUploadProps {
  currentPhotoUrl?: string;
  userName?: string;
  onPhotoChange: (photoUrl: string | null) => void;
}

export const UserPhotoUpload: React.FC<UserPhotoUploadProps> = ({
  currentPhotoUrl,
  userName,
  onPhotoChange
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoUrl || null);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo is too large (max 5MB)');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
      onPhotoChange(result);
    };
    reader.readAsDataURL(file);
  };
  
  const removePhoto = () => {
    setPhotoPreview(null);
    onPhotoChange(null);
  };
  
  // Use a file input handler for the Avatar too
  const triggerFileInput = () => {
    document.getElementById('photo-upload')?.click();
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar 
        className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={triggerFileInput}
      >
        {photoPreview ? (
          <AvatarImage src={photoPreview} alt={userName || "User"} />
        ) : (
          <AvatarFallback className="text-2xl">
            {userName ? userName.substring(0, 2).toUpperCase() : "U"}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          type="button"
          className="relative"
        >
          <input
            id="photo-upload"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
        
        {photoPreview && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={removePhoto}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};
