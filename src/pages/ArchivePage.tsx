import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { Archive, Lightbulb, FlaskConical, TestTube2, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ArchivePage: React.FC = () => {
  const { 
    archivedIdeas, 
    archivedHypotheses,
    archivedExperiments,
    loadArchivedIdeas,
    loadArchivedHypotheses,
    loadArchivedExperiments,
    unarchiveIdea,
    unarchiveHypothesis,
    unarchiveExperiment,
    getIdeaById,
    getHypothesisById,
    isLoadingArchived,
    isLoadingArchivedHypotheses,
    isLoadingArchivedExperiments,
  } = useApp();

  const [activeTab, setActiveTab] = useState('ideas');
  const [ideasLoaded, setIdeasLoaded] = useState(false);
  const [hypothesesLoaded, setHypothesesLoaded] = useState(false);
  const [experimentsLoaded, setExperimentsLoaded] = useState(false);

  // Load archived items based on active tab
  useEffect(() => {
    if (activeTab === 'ideas' && !ideasLoaded) {
      loadArchivedIdeas();
      setIdeasLoaded(true);
    } else if (activeTab === 'hypotheses' && !hypothesesLoaded) {
      loadArchivedHypotheses();
      setHypothesesLoaded(true);
    } else if (activeTab === 'experiments' && !experimentsLoaded) {
      loadArchivedExperiments();
      setExperimentsLoaded(true);
    }
  }, [activeTab, ideasLoaded, hypothesesLoaded, experimentsLoaded, loadArchivedIdeas, loadArchivedHypotheses, loadArchivedExperiments]);

  const handleUnarchiveIdea = async (id: string) => {
    await unarchiveIdea(id);
  };

  const handleUnarchiveHypothesis = async (id: string) => {
    await unarchiveHypothesis(id);
  };

  const handleUnarchiveExperiment = async (id: string) => {
    await unarchiveExperiment(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-muted-foreground">View and restore archived items</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Ideas ({archivedIdeas.length})
          </TabsTrigger>
          <TabsTrigger value="hypotheses" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Hypotheses ({archivedHypotheses.length})
          </TabsTrigger>
          <TabsTrigger value="experiments" className="flex items-center gap-2">
            <TestTube2 className="h-4 w-4" />
            Experiments ({archivedExperiments.length})
          </TabsTrigger>
        </TabsList>

        {/* Ideas Tab */}
        <TabsContent value="ideas" className="mt-4">
          {isLoadingArchived ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading archived ideas...</p>
            </div>
          ) : archivedIdeas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedIdeas.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell>
                      <Link 
                        to={`/idea-details/${idea.id}`}
                        className="font-medium hover:underline"
                      >
                        {idea.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {idea.category && <Badge variant="secondary">{idea.category}</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {idea.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnarchiveIdea(idea.id)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyArchiveState type="ideas" />
          )}
        </TabsContent>

        {/* Hypotheses Tab */}
        <TabsContent value="hypotheses" className="mt-4">
          {isLoadingArchivedHypotheses ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading archived hypotheses...</p>
            </div>
          ) : archivedHypotheses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Observation</TableHead>
                  <TableHead>Initiative</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedHypotheses.map((hypothesis) => {
                  const idea = getIdeaById(hypothesis.ideaId);
                  return (
                    <TableRow key={hypothesis.id}>
                      <TableCell>
                        <Link 
                          to={`/hypothesis-details/${hypothesis.id}`}
                          className="font-medium hover:underline"
                        >
                          {hypothesis.observation.substring(0, 60)}
                          {hypothesis.observation.length > 60 ? '...' : ''}
                        </Link>
                        {idea && (
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {idea.title}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {hypothesis.initiative}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {hypothesis.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnarchiveHypothesis(hypothesis.id)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyArchiveState type="hypotheses" />
          )}
        </TabsContent>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="mt-4">
          {isLoadingArchivedExperiments ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading archived experiments...</p>
            </div>
          ) : archivedExperiments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Experiment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedExperiments.map((experiment) => {
                  const hypothesis = getHypothesisById(experiment.hypothesisId);
                  const idea = hypothesis ? getIdeaById(hypothesis.ideaId) : undefined;
                  return (
                    <TableRow key={experiment.id}>
                      <TableCell>
                        <Link 
                          to={`/experiment-details/${experiment.id}`}
                          className="font-medium hover:underline"
                        >
                          {experiment.title || idea?.title || 'Untitled Experiment'}
                        </Link>
                        {hypothesis && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {hypothesis.observation.substring(0, 40)}
                            {hypothesis.observation.length > 40 ? '...' : ''}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{experiment.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {experiment.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnarchiveExperiment(experiment.id)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyArchiveState type="experiments" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EmptyArchiveState: React.FC<{ type: string }> = ({ type }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Archive className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium">No archived {type}</h3>
    <p className="text-muted-foreground text-sm mt-1">
      {type.charAt(0).toUpperCase() + type.slice(1)} you archive will appear here
    </p>
  </div>
);

export default ArchivePage;
