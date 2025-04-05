
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="20" fill="#33A9FF" />
        <circle cx="30" cy="65" r="20" fill="#33A9FF" />
        <circle cx="70" cy="65" r="20" fill="#33A9FF" />
      </svg>
      <span className="ml-2 text-xl font-bold">ExperimentFlow</span>
    </div>
  );
};

export default Logo;
