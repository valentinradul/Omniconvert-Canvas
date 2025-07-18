import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  Users,
  Target,
  Calendar,
  Brain,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface HypothesesData {
  id: string;
  initiative: string;
  observation: string;
  metric: string;
  status?: string;
  createdAt: Date;
  userName?: string;
  company_name?: string;
  idea_title?: string;
  idea_description?: string;
  pectiScore?: any;
}

interface HypothesisDetailsDialogProps {
  hypothesis: HypothesesData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HypothesisDetailsDialog: React.FC<HypothesisDetailsDialogProps> = ({
  hypothesis,
  open,
  onOpenChange,
}) => {
  if (!hypothesis) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Testing': return 'bg-blue-100 text-blue-800';
      case 'Validated': return 'bg-emerald-100 text-emerald-800';
      case 'Invalidated': return 'bg-red-100 text-red-800';
      case 'Paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Hypothesis Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Initiative</label>
                <p className="text-gray-900 font-medium">{hypothesis.initiative}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Observation</label>
                <p className="text-gray-900">{hypothesis.observation}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Metric</label>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{hypothesis.metric || 'No metric defined'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(hypothesis.status)}>
                    {hypothesis.status || 'Draft'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Idea */}
          {hypothesis.idea_title && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Related Idea
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-gray-900 font-medium">{hypothesis.idea_title}</p>
                </div>
                {hypothesis.idea_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900">{hypothesis.idea_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PECTI Score */}
          {hypothesis.pectiScore && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PECTI Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(hypothesis.pectiScore).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-primary">{value as number}</div>
                      <div className="text-sm text-gray-500 uppercase">{key}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Company</div>
                <div className="font-medium">{hypothesis.company_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Created By</div>
                <div className="font-medium">{hypothesis.userName || 'Unknown'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Created</div>
                <div className="font-medium">{format(hypothesis.createdAt, 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HypothesisDetailsDialog;