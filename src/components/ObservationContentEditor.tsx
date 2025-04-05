
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Link, Image } from 'lucide-react';
import { ObservationContent } from '@/types';

interface ObservationContentEditorProps {
  value: ObservationContent;
  onChange: (content: ObservationContent) => void;
  showTextArea?: boolean;
}

const ObservationContentEditor: React.FC<ObservationContentEditorProps> = ({
  value,
  onChange,
  showTextArea = true,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, text: e.target.value });
  };

  const addExternalUrl = () => {
    if (!newUrl || !newUrl.trim()) return;
    
    const isValidUrl = newUrl.match(/^(http|https):\/\/[^ "]+$/);
    if (!isValidUrl) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    const updatedUrls = [...(value.externalUrls || []), newUrl.trim()];
    onChange({ ...value, externalUrls: updatedUrls });
    setNewUrl('');
  };

  const removeExternalUrl = (index: number) => {
    const updatedUrls = [...(value.externalUrls || [])];
    updatedUrls.splice(index, 1);
    onChange({ ...value, externalUrls: updatedUrls });
  };

  const addImageUrl = () => {
    if (!newImageUrl || !newImageUrl.trim()) return;
    
    const isValidUrl = newImageUrl.match(/^(http|https):\/\/[^ "]+$/);
    if (!isValidUrl) {
      alert('Please enter a valid image URL starting with http:// or https://');
      return;
    }
    
    const updatedImageUrls = [...(value.imageUrls || []), newImageUrl.trim()];
    onChange({ ...value, imageUrls: updatedImageUrls });
    setNewImageUrl('');
  };

  const removeImageUrl = (index: number) => {
    const updatedImageUrls = [...(value.imageUrls || [])];
    updatedImageUrls.splice(index, 1);
    onChange({ ...value, imageUrls: updatedImageUrls });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Creating a temporary URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    const updatedImageUrls = [...(value.imageUrls || []), imageUrl];
    onChange({ ...value, imageUrls: updatedImageUrls });

    // Reset the input field
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {showTextArea && (
        <div>
          <Label htmlFor="observation">Observation</Label>
          <Textarea
            id="observation"
            value={value.text}
            onChange={handleTextChange}
            placeholder="Enter your observation here"
            className="mt-1"
          />
        </div>
      )}
      
      {/* External URLs section */}
      <div className="space-y-2">
        <Label>External URLs</Label>
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={addExternalUrl} 
            size="icon"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {value.externalUrls && value.externalUrls.length > 0 && (
          <div className="mt-2">
            <ul className="space-y-1">
              {value.externalUrls.map((url, index) => (
                <li key={`url-${index}`} className="flex items-center gap-2 bg-muted/40 p-2 rounded">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex-1 truncate"
                  >
                    {url}
                  </a>
                  <Button
                    type="button"
                    onClick={() => removeExternalUrl(index)}
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Images section */}
      <div className="space-y-2">
        <Label>Images</Label>
        <div className="flex flex-col space-y-2">
          {/* Upload image */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1"
            />
            <span className="text-muted-foreground">OR</span>
          </div>
          
          {/* Image URL input */}
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={addImageUrl} 
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {value.imageUrls && value.imageUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {value.imageUrls.map((imageUrl, index) => (
              <div key={`img-${index}`} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Observation image ${index + 1}`}
                  className="rounded-md object-cover w-full h-32"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                <Button
                  type="button"
                  onClick={() => removeImageUrl(index)}
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservationContentEditor;
