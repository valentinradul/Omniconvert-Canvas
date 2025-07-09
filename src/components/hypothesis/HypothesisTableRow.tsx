
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Department, Hypothesis, PECTI, HypothesisStatus } from '@/types';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import HypothesisPectiEditor from './HypothesisPectiEditor';
import HypothesisStatusEditor from './HypothesisStatusEditor';

interface HypothesisTableRowProps {
  hypothesis: Hypothesis;
  idea: {
    title: string;
    tags?: string[];
    departmentId: string;
  } | undefined;
  department?: Department;
  hasExperiment: boolean;
  calculatePectiPercentage: (pecti: PECTI) => number;
  onEditPecti: (hypothesis: Hypothesis, editedPecti: PECTI) => void;
  onStatusChange?: (hypothesisId: string, newStatus: HypothesisStatus) => void;
}

const HypothesisTableRow: React.FC<HypothesisTableRowProps> = ({
  hypothesis,
  idea,
  department,
  hasExperiment,
  calculatePectiPercentage,
  onEditPecti,
  onStatusChange
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editPectiValues, setEditPectiValues] = useState<PECTI>({...hypothesis.pectiScore});

  const handlePectiChange = (category: keyof PECTI, value: number) => {
    setEditPectiValues(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSavePecti = () => {
    onEditPecti(hypothesis, editPectiValues);
    setIsEditing(false);
  };

  const handleEditPecti = () => {
    setEditPectiValues({...hypothesis.pectiScore});
    setIsEditing(true);
  };

  const handleStatusChange = (newStatus: HypothesisStatus) => {
    if (onStatusChange) {
      onStatusChange(hypothesis.id, newStatus);
    }
  };

  return (
    <TableRow className="group">
      <TableCell className="font-medium">
        <div className="space-y-2">
          <div className="font-medium">{idea?.title || 'No Access'}</div>
          <p className="text-xs text-muted-foreground line-clamp-2">{hypothesis.initiative}</p>
          {hypothesis.userName && (
            <div className="text-xs text-muted-foreground">
              <User className="inline h-3 w-3 mr-1" /> {hypothesis.userName}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {idea ? (
          <>
            <div className="flex flex-wrap gap-1 mb-1">
              {idea.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Department: {department?.name || 'No Access'}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">
            Department: No Access
          </div>
        )}
      </TableCell>
      <TableCell>
        <HypothesisStatusEditor
          currentStatus={hypothesis.status || 'Backlog'}
          onStatusChange={handleStatusChange}
          disabled={!onStatusChange}
        />
      </TableCell>
      <TableCell>
        {isEditing ? (
          <HypothesisPectiEditor
            pectiValues={editPectiValues}
            onPectiChange={handlePectiChange}
            onSave={handleSavePecti}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <PectiScoreDisplay 
            pecti={hypothesis.pectiScore} 
            size="sm"
            showPercentage={true}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="space-x-2">
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditPecti}
            >
              Edit PECTI
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/hypothesis-details/${hypothesis.id}`)}
          >
            View Details
          </Button>
          {!hasExperiment && (
            <Button
              size="sm"
              onClick={() => navigate(`/create-experiment/${hypothesis.id}`)}
            >
              Create Experiment
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default HypothesisTableRow;
