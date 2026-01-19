import React from 'react';
import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';

const ArchiveLink: React.FC = () => {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <Link 
        to="/archive" 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Archive className="h-4 w-4" />
        <span>View all archived items (ideas, hypotheses, experiments)</span>
      </Link>
    </div>
  );
};

export default ArchiveLink;
