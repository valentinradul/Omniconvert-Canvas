
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, X, Mail, CheckCircle } from 'lucide-react';
import { addTeamMemberToTeam, fetchUserTeam } from '@/services/teamService';
import { TeamMemberFormData } from '@/types';

const OnboardingTeamInvite: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [message, setMessage] = useState(
    `Hey, I've just started using ExperimentFlow and I think it would be great for our team to collaborate on growth experiments. Join me!`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const handleAddEmail = () => {
    if (!currentEmail) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(currentEmail)) {
      toast.error('This email is already in the list');
      return;
    }
    
    setEmails([...emails, currentEmail]);
    setCurrentEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleInviteTeam = async () => {
    if (emails.length === 0) {
      navigate('/dashboard');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const teamData = await fetchUserTeam(user.id);
      
      if (!teamData || !teamData.id) {
        throw new Error('Team not found');
      }
      
      const teamId = teamData.id;
      const successfulInvites: string[] = [];
      
      // Process invites one by one
      for (const email of emails) {
        try {
          const memberData: TeamMemberFormData = {
            email,
            name: email.split('@')[0],
            role: 'Team Member',
            department: '',
            customMessage: message
          };
          
          await addTeamMemberToTeam(teamId, memberData);
          successfulInvites.push(email);
        } catch (err) {
          console.error(`Failed to invite ${email}:`, err);
          toast.error(`Failed to invite ${email}`);
        }
      }
      
      setSentEmails(successfulInvites);
      
      if (successfulInvites.length > 0) {
        toast.success(`Successfully invited ${successfulInvites.length} team members`);
      }
    } catch (error) {
      console.error('Error inviting team members:', error);
      toast.error('Failed to invite team members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Invite your team</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Collaborate better by inviting your team members
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invite team members</CardTitle>
            <CardDescription>
              ExperimentFlow works best with your whole team. Send invitations to collaborate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentEmails.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Invitations sent successfully!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {sentEmails.map(email => (
                            <li key={email}>{email}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="default" 
                  className="w-full" 
                  onClick={() => navigate('/dashboard')}
                >
                  Continue to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="colleague@company.com"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                  />
                  <Button variant="secondary" onClick={handleAddEmail}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                
                {emails.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-sm text-gray-500 mb-2 block">
                      Emails to invite ({emails.length}):
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {emails.map(email => (
                        <div 
                          key={email} 
                          className="bg-white rounded-full px-3 py-1 text-sm flex items-center border"
                        >
                          <Mail className="h-3 w-3 mr-2 text-blue-500" />
                          {email}
                          <button 
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Personalize your invitation:
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </CardContent>
          {sentEmails.length === 0 && (
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button 
                onClick={handleInviteTeam} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : emails.length > 0 ? 'Send Invites' : 'Continue'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OnboardingTeamInvite;
