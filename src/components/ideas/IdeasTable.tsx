
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface IdeasTableProps {
  ideas: any[];
  getDepartmentById: (id: string) => any;
}

const IdeasTable: React.FC<IdeasTableProps> = ({ ideas, getDepartmentById }) => {
  const navigate = useNavigate();
  
  const sortedIdeas = [...ideas].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIdeas.map((idea) => (
            <TableRow 
              key={idea.id} 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => navigate(`/idea-details/${idea.id}`)}
            >
              <TableCell className="font-medium">{idea.title}</TableCell>
              <TableCell>{idea.category}</TableCell>
              <TableCell>{getDepartmentById(idea.departmentId)?.name}</TableCell>
              <TableCell>{idea.userName || "Unknown"}</TableCell>
              <TableCell>
                {idea.tags && idea.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map((tag, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">No tags</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/idea-details/${idea.id}`);
                  }}
                >
                  View Idea
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default IdeasTable;
