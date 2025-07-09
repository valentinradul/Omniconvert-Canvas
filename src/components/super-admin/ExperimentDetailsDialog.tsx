
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Building, Calendar, User } from 'lucide-react';
import { ExtendedExperiment } from './ExperimentsManagement';

interface ExperimentDetailsDialogProps {
  experiment: ExtendedExperiment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExperimentDetailsDialog: React.FC<ExperimentDetailsDialogProps> = ({
  experiment,
  open,
  onOpenChange
}) => {
  if (!experiment) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Winning': return 'bg-green-100 text-green-800';
      case 'Losing': return 'bg-orange-100 text-orange-800';
      case 'Inconclusive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {experiment.hypotheses?.ideas?.title || 'Experiment Details'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(experiment.status)}>
                      {experiment.status || 'Planned'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">{experiment.companies?.name || 'No Company'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-medium">{experiment.userName || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{format(experiment.createdAt, 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">
                    {experiment.startDate 
                      ? format(experiment.startDate, 'MMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium">
                    {experiment.endDate 
                      ? format(experiment.endDate, 'MMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hypothesis Details */}
          {experiment.hypotheses && (
            <Card>
              <CardHeader>
                <CardTitle>Hypothesis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Observation</p>
                    <p className="text-sm text-gray-800">
                      {experiment.hypotheses.observation || 'No observation provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Idea Title</p>
                    <p className="text-sm text-gray-800">
                      {experiment.hypotheses.ideas?.title || 'No idea title'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {experiment.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {experiment.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes History */}
          {experiment.notes_history && experiment.notes_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Notes History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {experiment.notes_history.map((note: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{note.content || note}</p>
                          {note.author_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              By {note.author_name}
                            </p>
                          )}
                        </div>
                        {note.created_at && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(note.created_at), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperimentDetailsDialog;
