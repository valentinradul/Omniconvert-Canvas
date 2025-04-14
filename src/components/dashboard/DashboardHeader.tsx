
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  title: string;
  description: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, description }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button onClick={() => navigate('/ideas')}>Add New Idea</Button>
    </div>
  );
};

export default DashboardHeader;
