import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, DollarSign, Plus, Pencil, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ExperimentFinancial } from '@/types/financials';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/company/CompanyContext';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExperimentFinancialsProps {
  experimentId: string;
}

const ExperimentFinancials: React.FC<ExperimentFinancialsProps> = ({ experimentId }) => {
  const { user } = useAuth();
  const { companyMembers } = useCompany();
  const [financials, setFinancials] = useState<ExperimentFinancial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<ExperimentFinancial | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'cost' as 'cost' | 'revenue',
    name: '',
    amount: '',
    period_start: null as Date | null,
    period_end: null as Date | null,
    description: ''
  });

  const resetForm = () => {
    setFormData({
      type: 'cost',
      name: '',
      amount: '',
      period_start: null,
      period_end: null,
      description: ''
    });
  };

  const fetchFinancials = async () => {
    try {
      const { data, error } = await supabase
        .from('experiment_financials')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFinancials((data || []) as ExperimentFinancial[]);
    } catch (error) {
      console.error('Error fetching financials:', error);
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [experimentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.amount || !formData.period_start || !formData.period_end) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.period_end < formData.period_start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const financialData = {
        experiment_id: experimentId,
        type: formData.type,
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        period_start: format(formData.period_start, 'yyyy-MM-dd'),
        period_end: format(formData.period_end, 'yyyy-MM-dd'),
        description: formData.description.trim() || null,
        added_by: user?.id
      };

      if (editingFinancial) {
        const { error } = await supabase
          .from('experiment_financials')
          .update(financialData)
          .eq('id', editingFinancial.id);
        
        if (error) throw error;
        toast.success('Financial entry updated successfully');
      } else {
        const { error } = await supabase
          .from('experiment_financials')
          .insert([financialData]);
        
        if (error) throw error;
        toast.success('Financial entry added successfully');
      }

      resetForm();
      setIsAddDialogOpen(false);
      setEditingFinancial(null);
      fetchFinancials();
    } catch (error) {
      console.error('Error saving financial:', error);
      toast.error('Failed to save financial data');
    }
  };

  const handleEdit = (financial: ExperimentFinancial) => {
    setFormData({
      type: financial.type,
      name: financial.name,
      amount: financial.amount.toString(),
      period_start: new Date(financial.period_start),
      period_end: new Date(financial.period_end),
      description: financial.description || ''
    });
    setEditingFinancial(financial);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (financial: ExperimentFinancial) => {
    try {
      const { error } = await supabase
        .from('experiment_financials')
        .delete()
        .eq('id', financial.id);

      if (error) throw error;
      toast.success('Financial entry deleted successfully');
      fetchFinancials();
    } catch (error) {
      console.error('Error deleting financial:', error);
      toast.error('Failed to delete financial entry');
    }
  };

  const getUserName = (userId: string) => {
    const member = companyMembers.find(m => m.userId === userId);
    return member?.profile?.fullName || 'Unknown User';
  };

  const totalCosts = financials
    .filter(f => f.type === 'cost')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalRevenues = financials
    .filter(f => f.type === 'revenue')
    .reduce((sum, f) => sum + f.amount, 0);

  if (isLoading) {
    return <div className="text-center py-8">Loading financial data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Tracking
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingFinancial(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingFinancial ? 'Edit' : 'Add'} Financial Entry
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'cost' | 'revenue') => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">Cost</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Facebook Ads, Sales Revenue"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period Start *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.period_start && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.period_start ? format(formData.period_start, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.period_start || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, period_start: date || null }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Period End *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.period_end && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.period_end ? format(formData.period_end, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.period_end || undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, period_end: date || null }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingFinancial ? 'Update' : 'Add'} Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-red-600">Total Costs</p>
            <p className="text-2xl font-bold">${totalCosts.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-green-600">Total Revenue</p>
            <p className="text-2xl font-bold">${totalRevenues.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Net Result</p>
            <p className={cn(
              "text-2xl font-bold",
              totalRevenues - totalCosts >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${(totalRevenues - totalCosts).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Financial entries */}
        {financials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No financial entries yet</p>
            <p className="text-sm">Add costs and revenues to track experiment ROI</p>
          </div>
        ) : (
          <div className="space-y-3">
            {financials.map((financial) => (
              <div key={financial.id} className="border rounded-lg p-4 hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={financial.type === 'cost' ? 'destructive' : 'default'}>
                        {financial.type}
                      </Badge>
                      <h4 className="font-medium">{financial.name}</h4>
                      <span className={cn(
                        "font-bold",
                        financial.type === 'cost' ? "text-red-600" : "text-green-600"
                      )}>
                        ${financial.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(financial.period_start), 'MMM d, yyyy')} - {format(new Date(financial.period_end), 'MMM d, yyyy')}
                      </span>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getUserName(financial.added_by)}
                      </div>
                    </div>
                    {financial.description && (
                      <p className="text-sm text-muted-foreground mt-1">{financial.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(financial)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Financial Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this financial entry? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(financial)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperimentFinancials;