
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isHomePage = location.pathname === '/';

  // Calculate the logo height - increase by 50% for logged in users
  const logoHeight = isHomePage 
    ? "h-30" 
    : isAuthenticated 
      ? "h-[33.75px]" // 22.5px * 1.5 = 33.75px (50% larger)
      : "h-[22.5px]";

  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/a4a5d09d-2657-46f8-8741-e7725966a66f.png" 
        alt="Company Logo" 
        className={logoHeight} 
      />
    </div>
  );
};

export default Logo;
