
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamInviteDialog } from '../team/TeamInviteDialog';
import { UserPlus } from 'lucide-react';

interface PostIdeaInvitePromptProps {
  onClose: () => void;
  ideaTitle?: string;
}

const PostIdeaInvitePrompt: React.FC<PostIdeaInvitePromptProps> = ({ onClose, ideaTitle }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const getDefaultMessage = () => {
    if (ideaTitle) {
      return `Hey, I've just submitted a new idea "${ideaTitle}" on ExperimentFlow. I'd love for you to join the platform so we can collaborate on it!`;
    }
    return "Hey, I've just submitted a new idea on ExperimentFlow. I'd love for you to join the platform so we can collaborate on it!";
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Share your idea</CardTitle>
          <CardDescription>
            Great job submitting your idea! Want to invite teammates to collaborate?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <p className="mb-4">
              Ideas work best when your team can collaborate on them. 
              Would you like to invite some colleagues to join you?
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Maybe later
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            Invite teammates
          </Button>
        </CardFooter>
      </Card>

      <TeamInviteDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Share your idea with teammates"
        description="Invite colleagues to collaborate on your experiments"
        defaultMessage={getDefaultMessage()}
        onComplete={onClose}
      />
    </>
  );
};

export default PostIdeaInvitePrompt;
