import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PectiScoreDisplay from '@/components/PectiScoreDisplay';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Hypothesis, PECTI, Category, Tag, Department, HypothesisStatus, ALL_HYPOTHESIS_STATUSES } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Filter, User, Tag as TagIcon, Building } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const HypothesesPage: React.FC = () => {
  const { hypotheses, ideas, experiments, getIdeaById, editHypothesis, departments, getAllTags, getAllUserNames } = useApp();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'pectiScore' | 'createdAt'>('pectiScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<{
    departmentId?: string;
    tag?: Tag;
    minPectiScore?: number;
    userId?: string;
  }>({});
  
  const [editingHypothesis, setEditingHypothesis] = useState<string | null>(null);
  const [editPectiValues, setEditPectiValues] = useState<PECTI>({
    potential: 3,
    ease: 3,
    cost: 3,
    time: 3,
    impact: 3
  });
  
  const allTags = getAllTags();
  const allUsers = getAllUserNames();
  
  const filteredHypotheses = React.useMemo(() => {
    return hypotheses.filter(hypothesis => {
      if (searchQuery && !hypothesis.observation.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !hypothesis.initiative.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !hypothesis.metric.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filters.departmentId) {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea || relatedIdea.departmentId !== filters.departmentId) {
          return false;
        }
      }
      
      if (filters.tag) {
        const relatedIdea = ideas.find(i => i.id === hypothesis.ideaId);
        if (!relatedIdea || !relatedIdea.tags || !relatedIdea.tags.includes(filters.tag)) {
          return false;
        }
      }
      
      if (filters.minPectiScore) {
        const pectiPercentage = calculatePectiPercentage(hypothesis.pectiScore);
        if (pectiPercentage < filters.minPectiScore) {
          return false;
        }
      }
      
      if (filters.userId && hypothesis.userId !== filters.userId) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (sortField === 'pectiScore') {
        const scoreA = calculatePectiPercentage(a.pectiScore);
        const scoreB = calculatePectiPercentage(b.pectiScore);
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      } else {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [hypotheses, ideas, searchQuery, filters, sortField, sortDirection]);
  
  const calculatePectiPercentage = (pecti: PECTI): number => {
    const { potential, ease, cost, time, impact } = pecti;
    return Math.round(((potential + ease + (5 - cost) + (5 - time) + impact) / 25) * 100);
  };
  
  const handleEditPecti = (hypothesis: Hypothesis) => {
    setEditingHypothesis(hypothesis.id);
    setEditPectiValues({...hypothesis.pectiScore});
  };
  
  const handleSavePecti = (hypothesisId: string) => {
    editHypothesis(hypothesisId, { 
      pectiScore: editPectiValues 
    });
    setEditingHypothesis(null);
  };
  
  const handlePectiChange = (category: keyof PECTI, value: number) => {
    setEditPectiValues(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  const handleSort = (field: 'pectiScore' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hypotheses</h1>
          <p className="text-muted-foreground">Test your growth ideas with structured hypotheses</p>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search hypotheses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setFilters({})} 
            disabled={Object.keys(filters).length === 0}
          >
            Clear Filters
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-500" />
              <Label>Department</Label>
            </div>
            <Select
              value={filters.departmentId || ""}
              onValueChange={(value) => handleFilterChange('departmentId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-gray-500" />
              <Label>Tag</Label>
            </div>
            <Select
              value={filters.tag || ""}
              onValueChange={(value) => handleFilterChange('tag', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Min PECTI Score</Label>
            </div>
            <Select
              value={filters.minPectiScore?.toString() || ""}
              onValueChange={(value) => handleFilterChange('minPectiScore', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any score</SelectItem>
                <SelectItem value="30">30%+</SelectItem>
                <SelectItem value="50">50%+</SelectItem>
                <SelectItem value="70">70%+</SelectItem>
                <SelectItem value="80">80%+</SelectItem>
                <SelectItem value="90">90%+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <Label>User</Label>
            </div>
            <Select
              value={filters.userId || ""}
              onValueChange={(value) => handleFilterChange('userId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {filteredHypotheses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-medium">No hypotheses found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new hypothesis</p>
          <Button onClick={() => navigate('/ideas')}>View Ideas</Button>
        </div>
      ) : (
        <Table className="border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Hypothesis</TableHead>
              <TableHead>Related Idea</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('pectiScore')}>
                <div className="flex items-center">
                  PECTI Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHypotheses.map((hypothesis) => {
              const idea = getIdeaById(hypothesis.ideaId);
              const hasExperiment = experiments.some(e => e.hypothesisId === hypothesis.id);
              const isEditing = editingHypothesis === hypothesis.id;
              
              return (
                <TableRow key={hypothesis.id} className="group">
                  <TableCell className="font-medium">
                    <div className="space-y-2">
                      <div className="font-medium">{idea?.title || 'Unknown Idea'}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{hypothesis.initiative}</p>
                      {hypothesis.userName && (
                        <div className="text-xs text-muted-foreground">
                          <User className="inline h-3 w-3 mr-1" /> {hypothesis.userName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {idea && (
                      <>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {idea.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Department: {departments.find(d => d.id === idea.departmentId)?.name || 'Unknown'}
                        </div>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`
                      ${hypothesis.status === 'Selected For Testing' ? 'bg-blue-100 text-blue-800' : ''}
                      ${hypothesis.status === 'Testing' ? 'bg-amber-100 text-amber-800' : ''}
                      ${hypothesis.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                      ${hypothesis.status === 'Archived' ? 'bg-red-100 text-red-800' : ''}
                      ${hypothesis.status === 'Backlog' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {hypothesis.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {['potential', 'ease', 'cost', 'time', 'impact'].map((category) => (
                            <div key={category} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <Label className="capitalize">{category}</Label>
                                <span className="text-sm font-medium">
                                  {editPectiValues[category as keyof PECTI]}
                                </span>
                              </div>
                              <Slider 
                                value={[editPectiValues[category as keyof PECTI]]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => handlePectiChange(category as keyof PECTI, value[0])}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingHypothesis(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSavePecti(hypothesis.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <PectiScoreDisplay pecti={hypothesis.pectiScore} size="sm" />
                        <span className="ml-2 font-bold">
                          {calculatePectiPercentage(hypothesis.pectiScore)}%
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-x-2">
                      {!isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditPecti(hypothesis)}
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
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default HypothesesPage;
