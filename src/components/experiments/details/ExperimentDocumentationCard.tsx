
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ObservationContent } from '@/types';

interface ExperimentDocumentationCardProps {
  observationContent?: ObservationContent;
}

const ExperimentDocumentationCard: React.FC<ExperimentDocumentationCardProps> = ({
  observationContent
}) => {
  const hasContent = observationContent?.text || 
    (observationContent?.imageUrls && observationContent.imageUrls.length > 0) ||
    (observationContent?.externalUrls && observationContent.externalUrls.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation & References</CardTitle>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <div className="space-y-4">
            {observationContent?.text && (
              <div className="prose max-w-none">
                {observationContent.text}
              </div>
            )}
            
            {observationContent?.imageUrls && observationContent.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {observationContent.imageUrls.map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-md overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Documentation image ${i+1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {observationContent?.externalUrls && observationContent.externalUrls.length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">External Links</h3>
                <ul className="space-y-2">
                  {observationContent.externalUrls.map((link, i) => (
                    <li key={i}>
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No documentation or references added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentDocumentationCard;
