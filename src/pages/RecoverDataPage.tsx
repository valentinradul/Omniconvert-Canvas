
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { recoverOrphanedData } from '@/utils/dataRecovery';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const RecoverDataPage = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [isRecovering, setIsRecovering] = useState(false);
  const navigate = useNavigate();

  const handleRecover = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsRecovering(true);
    try {
      // Check for existing data in localStorage
      let dataFound = false;
      ['ideas', 'hypotheses', 'experiments'].forEach(key => {
        if (localStorage.getItem(key)) {
          dataFound = true;
        }
      });
      
      if (!dataFound) {
        toast.warning('No data found to recover in your browser');
      }
      
      if (await recoverOrphanedData(email)) {
        toast.success('Data has been recovered successfully');
      }
      
      // Redirect to dashboard after recovery attempt
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Recovery error:', error);
      toast.error('An error occurred during recovery');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRecoverLocal = () => {
    if (!user?.id) {
      toast.error('You must be logged in to recover data');
      return;
    }
    
    let recoveredCount = 0;
    
    ['ideas', 'hypotheses', 'experiments'].forEach(dataType => {
      const oldData = localStorage.getItem(dataType);
      if (oldData) {
        localStorage.setItem(`${dataType}_${user.id}`, oldData);
        recoveredCount++;
      }
    });
    
    if (recoveredCount > 0) {
      toast.success(`Recovered ${recoveredCount} types of data to your account`);
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload(); // Force reload to ensure data is loaded
      }, 1500);
    } else {
      toast.warning('No data found to recover in your browser');
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Data Recovery</CardTitle>
          <CardDescription>
            Recover lost ideas, hypotheses, and experiments and associate them with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Try Quick Recovery First</AlertTitle>
            <AlertDescription>
              Try the quick recovery option first which will migrate any data stored in this browser to your account.
            </AlertDescription>
          </Alert>
          
          <Button 
            className="w-full mb-6" 
            onClick={handleRecoverLocal}
            disabled={isRecovering || !user?.id}
          >
            Quick Recovery (Recommended)
          </Button>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address (Advanced)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRecovering}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline"
            className="w-full" 
            onClick={handleRecover}
            disabled={isRecovering}
          >
            {isRecovering ? 'Recovering...' : 'Advanced Recovery'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RecoverDataPage;
