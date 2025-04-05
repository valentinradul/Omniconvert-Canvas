
import React, { useState } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { GrowthIdea, Hypothesis, HypothesisStatus, ALL_HYPOTHESIS_STATUSES, Experiment } from '@/types';
import { Badge } from '@/components/ui/badge';
import PectiScoreDisplay from './PectiScoreDisplay';
import StatusBadge from './StatusBadge';

interface KanbanBoardProps {
  ideas: GrowthIdea[];
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  onHypothesisStatusChange: (hypothesisId: string, newStatus: HypothesisStatus) => void;
  onIdeaToHypothesis: (ideaId: string) => void;
}

interface Column {
  id: HypothesisStatus;
  title: string;
  items: (Hypothesis | (Hypothesis & { experiment: Experiment }))[];
}

interface IdeaColumn {
  id: 'ideas';
  title: string;
  items: GrowthIdea[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  ideas, 
  hypotheses, 
  experiments,
  onHypothesisStatusChange,
  onIdeaToHypothesis
}) => {
  // Create initial columns from hypothesis statuses
  const initialColumns = ALL_HYPOTHESIS_STATUSES.reduce<Record<string, Column>>((acc, status) => {
    acc[status] = {
      id: status,
      title: status,
      items: hypotheses.filter(h => h.status === status)
    };
    return acc;
  }, {});
  
  // Special ideas column
  const ideasColumn: IdeaColumn = {
    id: 'ideas',
    title: 'Growth Ideas',
    items: ideas
  };

  // Set default status for hypotheses without a status
  hypotheses.forEach(hypothesis => {
    if (!hypothesis.status) {
      initialColumns.Backlog.items.push({
        ...hypothesis,
        status: 'Backlog'
      });
    }
  });

  // Add hypotheses with in-progress experiments to the Testing column
  if (experiments && experiments.length > 0) {
    experiments.forEach(experiment => {
      if (experiment.status === 'In Progress') {
        const relatedHypothesis = hypotheses.find(h => h.id === experiment.hypothesisId);
        
        if (relatedHypothesis && relatedHypothesis.status !== 'Testing') {
          initialColumns.Testing.items.push({
            ...relatedHypothesis,
            experiment
          });
        }
      }
    });
  }

  const [columns, setColumns] = useState(initialColumns);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // If coming from ideas column to a hypothesis column
    if (source.droppableId === 'ideas' && destination.droppableId !== 'ideas') {
      const ideaId = ideasColumn.items[source.index].id;
      onIdeaToHypothesis(ideaId);
      return;
    }
    
    // If moving between or within hypothesis columns
    if (source.droppableId !== 'ideas' && destination.droppableId !== 'ideas') {
      // Get source and destination columns
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      
      if (sourceColumn === destColumn) {
        // Reordering within the same column
        const newItems = Array.from(sourceColumn.items);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        
        const newColumns = {
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            items: newItems
          }
        };
        
        setColumns(newColumns);
      } else {
        // Moving between columns
        const sourceItems = Array.from(sourceColumn.items);
        const destItems = Array.from(destColumn.items);
        const [movedItem] = sourceItems.splice(source.index, 1);
        
        // Update the status of the moved hypothesis
        const updatedItem = {
          ...movedItem,
          status: destColumn.id
        };
        
        destItems.splice(destination.index, 0, updatedItem);
        
        const newColumns = {
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            items: sourceItems
          },
          [destination.droppableId]: {
            ...destColumn,
            items: destItems
          }
        };
        
        setColumns(newColumns);
        onHypothesisStatusChange(movedItem.id, destColumn.id);
      }
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Ideas column */}
        <div className="flex-shrink-0 w-80">
          <div className="bg-gray-100 rounded-md p-3">
            <h3 className="font-medium mb-3 flex items-center justify-between">
              <span>{ideasColumn.title}</span>
              <Badge variant="outline">{ideasColumn.items.length}</Badge>
            </h3>
            
            <Droppable droppableId="ideas" type="CARD">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {ideasColumn.items.map((idea, index) => (
                    <Draggable key={idea.id} draggableId={idea.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white"
                        >
                          <CardContent className="p-3">
                            <div className="text-sm font-medium">{idea.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {idea.description}
                            </div>
                            {idea.userName && (
                              <div className="text-xs text-muted-foreground mt-2">
                                By: {idea.userName}
                              </div>
                            )}
                            {idea.tags && idea.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {idea.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
        
        {/* Hypothesis status columns */}
        {ALL_HYPOTHESIS_STATUSES.map(status => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-gray-100 rounded-md p-3">
              <h3 className="font-medium mb-3 flex items-center justify-between">
                <span>{status}</span>
                <Badge variant="outline">{columns[status].items.length}</Badge>
              </h3>
              
              <Droppable droppableId={status} type="CARD">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 min-h-[50px]"
                  >
                    {columns[status].items.map((hypothesis, index) => {
                      // Check if this item has an attached experiment
                      const hasExperiment = 'experiment' in hypothesis;
                      
                      return (
                        <Draggable key={hypothesis.id} draggableId={hypothesis.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white"
                            >
                              <CardContent className="p-3">
                                <div className="text-sm font-medium">{hypothesis.metric}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {hypothesis.initiative}
                                </div>
                                <div className="mt-2">
                                  <PectiScoreDisplay
                                    pecti={hypothesis.pectiScore}
                                    showPercentage={false}
                                    showProgressBar={true}
                                    size="sm"
                                  />
                                </div>
                                {hasExperiment && (
                                  <div className="mt-2">
                                    <StatusBadge status={hypothesis.experiment.status} />
                                  </div>
                                )}
                                {hypothesis.userName && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    By: {hypothesis.userName}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
