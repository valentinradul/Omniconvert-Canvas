
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { recoverUserData } from '@/utils/dataRecovery';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DataRecoveryBanner: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [recoveryStats, setRecoveryStats] = useState<{
    ideasCount: number;
    hypothesesCount: number;
    experimentsCount: number;
  } | null>(null);

  // Check if there's unassociated data in localStorage
  const hasUnassociatedData = React.useMemo(() => {
    if (!user) return false;
    
    const oldIdeas = localStorage.getItem('ideas');
    const oldHypotheses = localStorage.getItem('hypotheses');
    const oldExperiments = localStorage.getItem('experiments');
    
    return !!(oldIdeas || oldHypotheses || oldExperiments);
  }, [user]);

  if (!user || !hasUnassociatedData || recoveryComplete) return null;

  const handleRecovery = async () => {
    if (!user?.id) return;
    
    setIsRecovering(true);
    try {
      const result = await recoverUserData(user.id);
      
      if (result.success) {
        setRecoveryComplete(true);
        setRecoveryStats({
          ideasCount: result.ideasCount || 0,
          hypothesesCount: result.hypothesesCount || 0,
          experimentsCount: result.experimentsCount || 0
        });
        toast({
          title: "Data Recovery Complete",
          description: `Successfully recovered ${result.ideasCount} ideas, ${result.hypothesesCount} hypotheses, and ${result.experimentsCount} experiments.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Data Recovery Failed",
          description: result.message || "An unknown error occurred during data recovery.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Data Recovery Error",
        description: error.message || "An unknown error occurred during data recovery.",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-300">
      <AlertTitle className="text-amber-800">Unassociated Data Detected</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          We found previous ideas, hypotheses, or experiments data stored on this device. 
          Would you like to recover this data and associate it with your account?
        </p>
        <Button 
          onClick={handleRecovery} 
          disabled={isRecovering}
          className="bg-amber-600 hover:bg-amber-700 mt-2"
        >
          {isRecovering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recovering...
            </>
          ) : "Recover My Data"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DataRecoveryBanner;
