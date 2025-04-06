
import React from 'react';
import { useLocation } from 'react-router-dom';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/a4a5d09d-2657-46f8-8741-e7725966a66f.png" 
        alt="Company Logo" 
        className={isHomePage ? "h-30" : "h-[22.5px]"} 
      />
    </div>
  );
};

export default Logo;
