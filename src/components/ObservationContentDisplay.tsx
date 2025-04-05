
import React from 'react';
import { ObservationContent } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Image } from 'lucide-react';

interface ObservationContentDisplayProps {
  content: ObservationContent;
}

const ObservationContentDisplay: React.FC<ObservationContentDisplayProps> = ({
  content
}) => {
  if (!content) return null;
  
  return (
    <div className="space-y-4">
      {/* Text content */}
      {content.text && (
        <p>{content.text}</p>
      )}
      
      {/* External URLs */}
      {content.externalUrls && content.externalUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">External Sources</h4>
          <ul className="space-y-1">
            {content.externalUrls.map((url, index) => (
              <li key={`url-${index}`} className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Images */}
      {content.imageUrls && content.imageUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Images</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.imageUrls.map((imageUrl, index) => (
              <a 
                key={`img-${index}`} 
                href={imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={imageUrl}
                  alt={`Observation image ${index + 1}`}
                  className="rounded-md object-cover w-full h-40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationContentDisplay;
