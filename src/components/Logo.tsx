
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth(); // Get auth status
  const isHomePage = location.pathname === '/';

  // Determine logo size based on authentication and home page status
  const getLogoSize = () => {
    if (isAuthenticated) {
      // 50% larger for authenticated users (multiplied by 1.5)
      return isHomePage ? "h-[45px]" : "h-[33.75px]"; 
    }
    // Original sizes
    return isHomePage ? "h-30" : "h-[22.5px]";
  };

  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/a4a5d09d-2657-46f8-8741-e7725966a66f.png" 
        alt="Company Logo" 
        className={getLogoSize()} 
      />
    </div>
  );
};

export default Logo;
