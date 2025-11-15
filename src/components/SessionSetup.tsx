import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SessionSetupProps {
  onCreateSession: () => void;
  onJoinSession: (code: string) => void;
  onBack: () => void;
  isCreating?: boolean;
}

const SessionSetup = ({ onCreateSession, onJoinSession, onBack, isCreating }: SessionSetupProps) => {
  const [joinCode, setJoinCode] = useState('');
  const { toast } = useToast();

  const handleJoin = () => {
    if (joinCode.length === 6) {
      onJoinSession(joinCode.toUpperCase());
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-character session code",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back
      </Button>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Create New Session</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start a new session and invite your partner with a code
          </p>
          <Button onClick={onCreateSession} className="w-full" disabled={isCreating}>
            {isCreating ? 'Creating Session...' : 'Create Session'}
          </Button>
        </div>
      </Card>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Join Existing Session</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the 6-character code from your partner
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Enter code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-lg tracking-wider font-mono"
            />
            <Button onClick={handleJoin} className="w-full" disabled={joinCode.length !== 6}>
              Join Session
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SessionSetup;
