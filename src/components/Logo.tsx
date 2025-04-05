
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M41.7908 88.2537L114.312 58.6655L83.0523 27.4061L41.7908 88.2537Z" fill="#EE2F3A"/>
        <path d="M169.116 113.528L97.0605 142.954L127.949 174.594L169.116 113.528Z" fill="#EE2F3A"/>
        <path d="M42.1614 113.528L83.0523 174.594L113.946 142.95L42.1614 113.528Z" fill="#EE2F3A"/>
        <path d="M169.116 88.2537L127.949 27.4061L97.0605 58.6699L169.116 88.2537Z" fill="#EE2F3A"/>
      </svg>
    </div>
  );
};

export default Logo;
