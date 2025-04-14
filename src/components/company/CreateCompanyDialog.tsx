
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface CreateCompanyDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateCompanyDialog: React.FC<CreateCompanyDialogProps> = ({ open, onClose }) => {
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCompany, isLoading: companyLoading } = useCompany();
  const { isAuthenticated, user } = useAuth();

  // For debugging
  useEffect(() => {
    console.log("CreateCompanyDialog:", { 
      isAuthenticated, 
      userId: user?.id,
      isOpen: open
    });
  }, [isAuthenticated, user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    if (!isAuthenticated) {
      console.error("Cannot create company: User is not authenticated");
      return;
    }

    console.log("Submitting company creation:", companyName);
    setIsSubmitting(true);
    try {
      await createCompany(companyName);
      setCompanyName('');
      onClose();
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    console.log("CreateCompanyDialog: Not authenticated");
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Company</DialogTitle>
            <DialogDescription>
              Create a company to start collaborating with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {companyLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Loading company data...</span>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyName" className="col-span-4">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="col-span-4"
                disabled={isSubmitting || companyLoading}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || companyLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || companyLoading || !companyName.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompanyDialog;
