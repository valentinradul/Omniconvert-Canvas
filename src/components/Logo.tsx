
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/36110bfe-b273-479e-ad8c-950f5764e65c.png" 
        alt="Company Logo" 
        className="h-30" // Changed from h-10 to h-30 (3x larger)
      />
    </div>
  );
};

export default Logo;
