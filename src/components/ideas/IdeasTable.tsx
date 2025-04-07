
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { GrowthIdea } from '@/types';

interface IdeasTableProps {
  ideas: GrowthIdea[];
  getDepartmentById: (id: string) => { id: string; name: string } | undefined;
  allUsers: Array<{ id: string; name: string }>;
}

const IdeasTable: React.FC<IdeasTableProps> = ({
  ideas,
  getDepartmentById,
  allUsers
}) => {
  const navigate = useNavigate();

  if (ideas.length === 0) {
    return null;
  }

  const handleRowClick = (ideaId: string) => {
    navigate(`/idea-details/${ideaId}`);
  };

  const handleViewClick = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    navigate(`/idea-details/${ideaId}`);
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Responsible</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ideas.map((idea) => (
            <TableRow 
              key={idea.id} 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => handleRowClick(idea.id)}
            >
              <TableCell className="font-medium">{idea.title}</TableCell>
              <TableCell>{idea.category}</TableCell>
              <TableCell>{getDepartmentById(idea.departmentId)?.name}</TableCell>
              <TableCell>{idea.userName || "Unknown"}</TableCell>
              <TableCell>
                {idea.responsibleUserId ? 
                  allUsers.find(u => u.id === idea.responsibleUserId)?.name || "Unknown" : 
                  "Unassigned"}
              </TableCell>
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
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleViewClick(e, idea.id)}
                >
                  View
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
