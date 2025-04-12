
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { recoverOrphanedData } from '@/utils/dataRecovery';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
      await recoverOrphanedData(email);
      // Redirect to dashboard after recovery attempt
      setTimeout(() => navigate('/dashboard'), 2000);
    } finally {
      setIsRecovering(false);
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
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
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
            className="w-full" 
            onClick={handleRecover}
            disabled={isRecovering}
          >
            {isRecovering ? 'Recovering...' : 'Recover My Data'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RecoverDataPage;
