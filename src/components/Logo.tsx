
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/a4a5d09d-2657-46f8-8741-e7725966a66f.png" 
        alt="Company Logo" 
        className="h-15" // Keeping the same size as before
      />
    </div>
  );
};

export default Logo;
